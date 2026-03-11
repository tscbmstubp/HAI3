// @cpt-FEATURE:cpt-hai3-state-cli-tooling-command-lifecycle:p1
// @cpt-FEATURE:cpt-hai3-dod-cli-tooling-command-infra:p1
import type { CommandDefinition, CommandContext } from './command.js';
import type { CommandResult, ExecutionMode } from './types.js';
import { Logger } from './logger.js';
import { createInteractivePrompt, createProgrammaticPrompt } from './prompt.js';
import { findProjectRoot, loadConfig } from '../utils/project.js';

/**
 * Build command context based on execution mode
 */
async function buildContext(mode: ExecutionMode): Promise<CommandContext> {
  const cwd = process.cwd();
  const projectRoot = await findProjectRoot(cwd);
  const config = projectRoot ? await loadConfig(projectRoot) : null;

  const logger = mode.interactive ? new Logger() : Logger.silent();
  const prompt = mode.interactive
    ? createInteractivePrompt()
    : createProgrammaticPrompt(mode.answers ?? {});

  return {
    cwd,
    projectRoot,
    config,
    logger,
    prompt,
  };
}

/**
 * Execute a command with the given arguments and mode
 *
 * @param command - Command definition to execute
 * @param args - Arguments to pass to the command
 * @param mode - Execution mode (interactive or programmatic)
 * @returns Command result with success/failure and data
 */
// @cpt-begin:cpt-hai3-state-cli-tooling-command-lifecycle:p1:inst-1
export async function executeCommand<TArgs, TResult>(
  command: CommandDefinition<TArgs, TResult>,
  args: TArgs,
  mode: ExecutionMode = { interactive: true }
): Promise<CommandResult<TResult>> {
  const ctx = await buildContext(mode);

  // Validate arguments
  const validation = command.validate(args, ctx);
  if (!validation.ok) {
    for (const error of validation.errors) {
      ctx.logger.error(error.message);
    }
    return { success: false, errors: validation.errors };
  }

  // Execute command
  try {
    const result = await command.execute(args, ctx);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.logger.error(message);
    return {
      success: false,
      errors: [{ code: 'EXECUTION_ERROR', message }],
    };
  }
}

// @cpt-end:cpt-hai3-state-cli-tooling-command-lifecycle:p1:inst-1

/**
 * Build context for testing or external use
 */
export async function buildCommandContext(
  mode: ExecutionMode = { interactive: true }
): Promise<CommandContext> {
  return buildContext(mode);
}
