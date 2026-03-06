import path from 'path';
import fs from 'fs-extra';
import type { CommandDefinition } from '../../core/command.js';
import { validationOk, validationError } from '../../core/types.js';
import { isCamelCase, isReservedScreensetName } from '../../utils/validation.js';
import { generateScreenset, assignMfePort } from '../../generators/screenset.js';

/**
 * Arguments for screenset create command
 */
export interface ScreensetCreateArgs {
  name: string;
  port?: number;
}

/**
 * Result of screenset create command
 */
export interface ScreensetCreateResult {
  mfePath: string;
  files: string[];
  port: number;
}

/**
 * screenset create command implementation
 *
 * Scaffolds a new MFE screenset package from the _blank-mfe template.
 */
export const screensetCreateCommand: CommandDefinition<
  ScreensetCreateArgs,
  ScreensetCreateResult
> = {
  name: 'screenset:create',
  description: 'Create a new MFE screenset package',
  args: [
    {
      name: 'name',
      description: 'Screenset name in camelCase (e.g., contacts, dashboard)',
      required: true,
    },
  ],
  options: [
    {
      name: 'port',
      description: 'MFE dev server port (auto-assigned if omitted)',
      type: 'string',
    },
  ],

  validate(args, ctx) {
    const { name } = args;

    if (!name) {
      return validationError('MISSING_NAME', 'Screenset name is required.');
    }

    if (!isCamelCase(name)) {
      return validationError(
        'INVALID_NAME',
        `Invalid screenset name "${name}". Name must be camelCase (e.g., contacts, myDashboard).`
      );
    }

    if (isReservedScreensetName(name)) {
      return validationError(
        'RESERVED_NAME',
        `"${name}" is a reserved name. Choose a different screenset name.`
      );
    }

    if (!ctx.projectRoot) {
      return validationError(
        'NOT_IN_PROJECT',
        'Not inside a HAI3 project. Run this command from a project root.'
      );
    }

    return validationOk();
  },

  async execute(args, ctx): Promise<ScreensetCreateResult> {
    const { logger, projectRoot } = ctx;
    const { name } = args;

    // Derive kebab name for directory check
    const nameKebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const mfeDirName = `${nameKebab}-mfe`;
    const mfePath = path.join(projectRoot!, 'src', 'mfe_packages', mfeDirName);

    // Check for collision with existing MFE package
    if (await fs.pathExists(mfePath)) {
      throw new Error(
        `MFE package already exists at src/mfe_packages/${mfeDirName}/. Choose a different name.`
      );
    }

    // Assign port
    const port = args.port ?? (await assignMfePort(projectRoot!));

    logger.info(`Creating screenset '${name}' (port: ${port})...`);
    logger.newline();

    const result = await generateScreenset({
      name,
      port,
      projectRoot: projectRoot!,
    });

    logger.success(`Created screenset '${name}' at src/mfe_packages/${mfeDirName}/`);
    logger.newline();
    logger.log(`Files created (${result.files.length} files):`);
    for (const file of result.files.slice(0, 10)) {
      logger.log(`  ${file}`);
    }
    if (result.files.length > 10) {
      logger.log(`  ... and ${result.files.length - 10} more`);
    }
    logger.newline();
    logger.log('Next steps:');
    logger.log(`  cd src/mfe_packages/${mfeDirName}`);
    logger.log('  npm install');
    logger.log(`  npm run dev  # starts on port ${port}`);
    logger.newline();
    logger.info('The MFE has been registered in src/app/mfe/bootstrap.ts.');

    return {
      mfePath: result.mfePath,
      files: result.files,
      port,
    };
  },
};
