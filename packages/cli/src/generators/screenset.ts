import path from 'path';
import fs from 'fs-extra';
import { getTemplatesDir } from '../core/templates.js';
import { writeGeneratedFiles } from '../utils/fs.js';
import type { GeneratedFile } from '../core/types.js';

/**
 * Input for screenset generation
 */
export interface ScreensetGeneratorInput {
  /** Screenset name in camelCase (e.g., 'contacts', 'dashboard') */
  name: string;
  /** MFE dev server port */
  port: number;
  /** Absolute path of the project root */
  projectRoot: string;
}

/**
 * Output of screenset generation
 */
export interface ScreensetGeneratorOutput {
  /** Path to the created MFE package */
  mfePath: string;
  /** Files created */
  files: string[];
}

/**
 * Convert camelCase to kebab-case
 * e.g. 'myScreenset' → 'my-screenset'
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Convert camelCase to PascalCase
 * e.g. 'myScreenset' → 'MyScreenset'
 */
function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Apply placeholder replacements to file content
 * Exported for use by project generator (demo MFE scaffolding)
 */
export function applyMfeReplacements(content: string, name: string, namePascal: string, port: number): string {
  const nameKebab = toKebabCase(name);       // e.g. 'contacts' (or 'my-contacts')

  return content
    // Class names: BlankMfeLifecycle → ContactsMfeLifecycle
    .replace(/BlankMfeLifecycle/g, `${namePascal}MfeLifecycle`)
    // API class: _BlankApiService → _ContactsApiService
    .replace(/_BlankApiService/g, `_${namePascal}ApiService`)
    // Mock map: blankMockMap → contactsMockMap
    .replace(/blankMockMap/g, `${name}MockMap`)
    // Slice name: '_blank/home' → 'contacts/home'
    .replace(/'_blank\//g, `'${name}/`)
    // Redux state type: '_blank/home' → 'contacts/home'
    .replace(/"_blank\//g, `"${name}/`)
    // API route: '/api/blank' → '/api/contacts'
    .replace(/\/api\/blank/g, `/api/${nameKebab}`)
    // Federation name: blankMfe → contactsMfe
    .replace(/blankMfe/g, `${name}Mfe`)
    // Package name: @hai3/blank-mfe → @hai3/contacts-mfe
    .replace(/@hai3\/blank-mfe/g, `@hai3/${nameKebab}-mfe`)
    // GTS IDs: hai3.blank. → hai3.contacts.
    .replace(/hai3\.blank\./g, `hai3.${name}.`)
    // Remote entry port: localhost:3099 → localhost:{port}
    .replace(/localhost:3099/g, `localhost:${port}`)
    // Port in scripts: --port 3099 → --port {port}
    .replace(/--port 3099/g, `--port ${port}`)
    // Port reference in README
    .replace(/from `3099`/g, `from \`${port}\``)
    // Route: /blank-home → /contacts
    .replace(/\/blank-home/g, `/${nameKebab}`)
    // Label: "Blank Home" → "Contacts"
    .replace(/"Blank Home"/g, `"${namePascal}"`)
    // Comment references: _blank-mfe → {name}-mfe
    .replace(/_blank-mfe/g, `${nameKebab}-mfe`)
    // Comment references: _Blank Domain → _{Name} Domain
    .replace(/_Blank Domain/g, `_${namePascal} Domain`)
    // Comment: Blank MFE template → {Name} MFE
    .replace(/Blank MFE template/g, `${namePascal} MFE`)
    .replace(/Blank MFE/g, `${namePascal} MFE`)
    // Comment: for the Blank → for the {Name}
    .replace(/for the Blank/g, `for the ${namePascal}`)
    // Replace monorepo file: refs with npm versions (standalone projects can't resolve file: paths)
    .replace(/"file:\.\.\/\.\.\/\.\.\/packages\/[a-z0-9-]+"/g, `"alpha"`);
}

/**
 * Rename a file if it contains blank placeholders
 * Exported for use by project generator (demo MFE scaffolding)
 */
export function applyMfeFileRename(fileName: string, name: string): string {
  const namePascal = toPascalCase(name);
  return fileName
    .replace(/_BlankApiService/g, `_${namePascal}ApiService`);
}

/**
 * Recursively read all files from a directory
 */
async function readDirRecursive(
  dir: string,
  basePath: string = ''
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  if (!(await fs.pathExists(dir))) {
    return files;
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      files.push(...(await readDirRecursive(fullPath, relativePath)));
    } else {
      const content = await fs.readFile(fullPath, 'utf-8');
      files.push({ path: relativePath, content });
    }
  }

  return files;
}

/**
 * Scan existing mfe_packages to find used ports
 */
export async function getUsedMfePorts(projectRoot: string): Promise<Set<number>> {
  const usedPorts = new Set<number>();
  const mfePackagesDir = path.join(projectRoot, 'src', 'mfe_packages');

  if (!(await fs.pathExists(mfePackagesDir))) {
    return usedPorts;
  }

  const entries = await fs.readdir(mfePackagesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgJsonPath = path.join(mfePackagesDir, entry.name, 'package.json');
    if (await fs.pathExists(pkgJsonPath)) {
      try {
        const pkgJson = await fs.readJson(pkgJsonPath);
        const devScript = pkgJson?.scripts?.dev ?? '';
        const portMatch = devScript.match(/--port\s+(\d+)/);
        if (portMatch) {
          usedPorts.add(parseInt(portMatch[1], 10));
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  return usedPorts;
}

/**
 * Find next available MFE port starting from startPort
 */
export async function assignMfePort(projectRoot: string, startPort = 3001): Promise<number> {
  const usedPorts = await getUsedMfePorts(projectRoot);
  let port = startPort;
  while (usedPorts.has(port)) {
    port++;
  }
  return port;
}

/**
 * Update bootstrap.ts to import and register the new MFE
 */
async function updateBootstrap(projectRoot: string, name: string): Promise<boolean> {
  const bootstrapPath = path.join(projectRoot, 'src', 'app', 'mfe', 'bootstrap.ts');

  if (!(await fs.pathExists(bootstrapPath))) {
    return false;
  }

  const nameKebab = toKebabCase(name);
  const namePascal = toPascalCase(name);
  const content = await fs.readFile(bootstrapPath, 'utf-8');

  // Check if already registered
  if (content.includes(`${nameKebab}-mfe/mfe.json`)) {
    return true;
  }

  // Add import after existing imports (before the first non-import line)
  const importLine = `import ${name}MfeConfig from '@/mfe_packages/${nameKebab}-mfe/mfe.json';`;

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  // Insert import after last import
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importLine);
  }

  // Build registration block
  const registrationBlock = `
  // Register ${namePascal} MFE
  screensetsRegistry.typeSystem.register(${name}MfeConfig.manifest);
  for (const entry of ${name}MfeConfig.entries) {
    screensetsRegistry.typeSystem.register({ ...entry, manifest: ${name}MfeConfig.manifest });
  }
  for (const extension of ${name}MfeConfig.extensions) {
    await screensetsRegistry.registerExtension(extension);
  }`;

  const newContent = lines.join('\n');

  // Insert registration before the closing brace of bootstrapMFE (before the last "}")
  // Find the marker: "Standalone: no mfe.json" comment or the closing pattern
  const standaloneMarker = '// Standalone: no mfe.json or extensions registered here.';
  if (newContent.includes(standaloneMarker)) {
    const updated = newContent.replace(
      standaloneMarker,
      `${registrationBlock.trim()}\n\n  ${standaloneMarker}`
    );
    await fs.writeFile(bootstrapPath, updated, 'utf-8');
    return true;
  }

  // Fallback: append before the last closing brace
  const lastBrace = newContent.lastIndexOf('}');
  if (lastBrace >= 0) {
    const updated =
      newContent.slice(0, lastBrace) +
      '\n' + registrationBlock + '\n' +
      newContent.slice(lastBrace);
    await fs.writeFile(bootstrapPath, updated, 'utf-8');
    return true;
  }

  return false;
}

/**
 * Generate a new MFE screenset package from the _blank-mfe template
 */
export async function generateScreenset(
  input: ScreensetGeneratorInput
): Promise<ScreensetGeneratorOutput> {
  const { name, port, projectRoot } = input;
  const nameKebab = toKebabCase(name);
  const mfeDirName = `${nameKebab}-mfe`;
  const mfePath = path.join(projectRoot, 'src', 'mfe_packages', mfeDirName);

  const templatesDir = await getTemplatesDir();
  const mfeTemplateDir = path.join(templatesDir, 'mfe-template');

  if (!(await fs.pathExists(mfeTemplateDir))) {
    throw new Error(
      'MFE template not found. Run `npm run build` in packages/cli first.'
    );
  }

  // Read all template files
  const templateFiles = await readDirRecursive(mfeTemplateDir);

  // Transform content and apply renames
  const outputFiles: GeneratedFile[] = templateFiles.map((file) => {
    // Apply file rename
    const parts = file.path.split(path.sep);
    const renamedParts = parts.map((part) => applyMfeFileRename(part, name));
    const renamedPath = renamedParts.join(path.sep);

    // Apply content replacements
    const namePascal = toPascalCase(name);
    const transformedContent = applyMfeReplacements(file.content, name, namePascal, port);

    return { path: renamedPath, content: transformedContent };
  });

  // Write files to mfe package directory
  const writtenFiles = await writeGeneratedFiles(mfePath, outputFiles);

  // Update bootstrap.ts
  await updateBootstrap(projectRoot, name);

  return {
    mfePath,
    files: writtenFiles,
  };
}
