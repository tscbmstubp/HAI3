/**
 * Migration Runner
 *
 * Executes migrations in order, tracks applied migrations,
 * and handles dry-run mode.
 */
// @cpt-FEATURE:cpt-hai3-algo-cli-tooling-resolve-pending-migrations:p2
// @cpt-FEATURE:cpt-hai3-algo-cli-tooling-apply-migration:p2
// @cpt-FEATURE:cpt-hai3-state-cli-tooling-migration-tracker:p2
// @cpt-FEATURE:cpt-hai3-dod-cli-tooling-migrations:p2

import path from 'path';
import fs from 'fs-extra';
import { Project } from 'ts-morph';
import type {
  Migration,
  MigrationOptions,
  MigrationResult,
  MigrationPreview,
  MigrationStatus,
  MigrationTracker,
  MigrationLogger,
  FilePreview,
  FileResult,
  AppliedMigration,
  AppliedTransformRecord,
  TransformChange,
} from './types.js';
import { getMigrations } from './registry.js';

/** Default tracker file path */
const TRACKER_FILE = '.hai3/migrations.json';

/** Default include patterns */
const DEFAULT_INCLUDE = ['**/*.ts', '**/*.tsx'];

/** Default exclude patterns */
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/*.d.ts'];

/**
 * Load the migration tracker from disk
 */
async function loadTracker(targetPath: string): Promise<MigrationTracker> {
  const trackerPath = path.join(targetPath, TRACKER_FILE);
  try {
    const content = await fs.readFile(trackerPath, 'utf-8');
    return JSON.parse(content) as MigrationTracker;
  } catch {
    // Return empty tracker if file doesn't exist
    return {
      version: '1.0.0',
      applied: [],
    };
  }
}

/**
 * Save the migration tracker to disk
 */
async function saveTracker(
  targetPath: string,
  tracker: MigrationTracker
): Promise<void> {
  const trackerPath = path.join(targetPath, TRACKER_FILE);
  await fs.ensureDir(path.dirname(trackerPath));
  await fs.writeFile(trackerPath, JSON.stringify(tracker, null, 2), 'utf-8');
}

/**
 * Get migration status for a project
 */
export async function getMigrationStatus(
  targetPath: string
): Promise<MigrationStatus> {
  const tracker = await loadTracker(targetPath);
  const allMigrations = getMigrations();

  // Get list of applied migration IDs
  const appliedIds = new Set(tracker.applied.map((m) => m.id));

  // Filter pending migrations
  const pending = allMigrations.filter((m) => !appliedIds.has(m.id));

  // Try to detect current version from package.json
  let currentVersion: string | undefined;
  try {
    const pkgPath = path.join(targetPath, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    // Check for HAI3 packages
    const hai3Deps = Object.keys(pkg.dependencies || {}).filter((d) =>
      d.startsWith('@hai3/')
    );
    if (hai3Deps.length > 0) {
      const firstDep = pkg.dependencies[hai3Deps[0]];
      // Extract version from semver range
      currentVersion = firstDep.replace(/^[\^~]/, '');
    }
  } catch {
    // Package.json not found or invalid
  }

  return {
    applied: tracker.applied,
    pending,
    currentVersion,
  };
}

/**
 * Preview a migration (dry-run)
 */
export async function previewMigration(
  migration: Migration,
  options: MigrationOptions,
  logger: MigrationLogger
): Promise<MigrationPreview> {
  const targetPath = options.targetPath || process.cwd();
  const include = options.include || DEFAULT_INCLUDE;
  const exclude = options.exclude || DEFAULT_EXCLUDE;

  logger.info(`Previewing migration: ${migration.name}`);
  logger.info(`Target: ${targetPath}`);

  // Create ts-morph project
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      declaration: false,
      noEmit: true,
    },
  });

  // Add source files
  const sourceFiles = project.addSourceFilesAtPaths(
    include.map((pattern) => path.join(targetPath, pattern))
  );

  // Filter out excluded files
  const filteredFiles = sourceFiles.filter((sf) => {
    const relativePath = path.relative(targetPath, sf.getFilePath());
    return !exclude.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(relativePath);
    });
  });

  logger.info(`Found ${filteredFiles.length} source files`);

  const filesPreviews: FilePreview[] = [];

  for (const sourceFile of filteredFiles) {
    const relativePath = path.relative(targetPath, sourceFile.getFilePath());
    const changes: TransformChange[] = [];
    const transforms: string[] = [];

    for (const transform of migration.transforms) {
      if (transform.canApply(sourceFile)) {
        const transformChanges = transform.preview(sourceFile);
        if (transformChanges.length > 0) {
          changes.push(...transformChanges);
          transforms.push(transform.id);
        }
      }
    }

    if (changes.length > 0) {
      filesPreviews.push({
        path: relativePath,
        changes,
        transforms,
      });
    }
  }

  return {
    migrationId: migration.id,
    files: filesPreviews,
    totalFilesAffected: filesPreviews.length,
    totalChanges: filesPreviews.reduce((sum, f) => sum + f.changes.length, 0),
  };
}

/**
 * Apply a migration
 */
// @cpt-begin:cpt-hai3-algo-cli-tooling-apply-migration:p2:inst-1
export async function applyMigration(
  migration: Migration,
  options: MigrationOptions,
  logger: MigrationLogger
): Promise<MigrationResult> {
  const targetPath = options.targetPath || process.cwd();
  const include = options.include || DEFAULT_INCLUDE;
  const exclude = options.exclude || DEFAULT_EXCLUDE;

  logger.info(`Applying migration: ${migration.name}`);
  logger.info(`Target: ${targetPath}`);

  // Load tracker to check if already applied
  const tracker = await loadTracker(targetPath);
  if (tracker.applied.some((m) => m.id === migration.id)) {
    logger.warn(`Migration ${migration.id} has already been applied`);
    return {
      success: false,
      migrationId: migration.id,
      filesModified: 0,
      totalChanges: 0,
      files: [],
      warnings: [`Migration ${migration.id} has already been applied`],
      errors: [],
      appliedAt: new Date().toISOString(),
    };
  }

  // Create ts-morph project
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      declaration: false,
      noEmit: true,
    },
  });

  // Add source files
  const sourceFiles = project.addSourceFilesAtPaths(
    include.map((pattern) => path.join(targetPath, pattern))
  );

  // Filter out excluded files
  const filteredFiles = sourceFiles.filter((sf) => {
    const relativePath = path.relative(targetPath, sf.getFilePath());
    return !exclude.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(relativePath);
    });
  });

  logger.info(`Processing ${filteredFiles.length} source files`);

  const filesResults: FileResult[] = [];
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  const transformStats: Map<string, number> = new Map();

  for (const sourceFile of filteredFiles) {
    const relativePath = path.relative(targetPath, sourceFile.getFilePath());
    let fileChanges = 0;
    const appliedTransforms: string[] = [];

    for (const transform of migration.transforms) {
      if (transform.canApply(sourceFile)) {
        logger.debug(`Applying ${transform.id} to ${relativePath}`);
        const result = transform.apply(sourceFile);

        if (result.success && result.changesApplied > 0) {
          fileChanges += result.changesApplied;
          appliedTransforms.push(transform.id);
          transformStats.set(
            transform.id,
            (transformStats.get(transform.id) || 0) + 1
          );
        }

        allWarnings.push(...result.warnings.map((w) => `${relativePath}: ${w}`));
        allErrors.push(...result.errors.map((e) => `${relativePath}: ${e}`));
      }
    }

    if (fileChanges > 0) {
      filesResults.push({
        path: relativePath,
        success: true,
        changesApplied: fileChanges,
        transforms: appliedTransforms,
      });
    }
  }

  // Save modified files
  await project.save();

  // Update tracker
  const appliedAt = new Date().toISOString();
  const appliedRecord: AppliedMigration = {
    id: migration.id,
    appliedAt,
    filesModified: filesResults.length,
    transforms: Array.from(transformStats.entries()).map(
      ([id, filesModified]): AppliedTransformRecord => ({
        id,
        filesModified,
      })
    ),
  };
  tracker.applied.push(appliedRecord);
  await saveTracker(targetPath, tracker);

  logger.success(`Migration ${migration.id} applied successfully`);
  logger.info(`Files modified: ${filesResults.length}`);

  return {
    success: allErrors.length === 0,
    migrationId: migration.id,
    filesModified: filesResults.length,
    totalChanges: filesResults.reduce((sum, f) => sum + f.changesApplied, 0),
    files: filesResults,
    warnings: allWarnings,
    errors: allErrors,
    appliedAt,
  };
}

// @cpt-end:cpt-hai3-algo-cli-tooling-apply-migration:p2:inst-1

/**
 * Run migrations up to a target version
 */
// @cpt-begin:cpt-hai3-algo-cli-tooling-resolve-pending-migrations:p2:inst-1
export async function runMigrations(
  options: MigrationOptions,
  logger: MigrationLogger
): Promise<MigrationResult[]> {
  const targetPath = options.targetPath || process.cwd();
  const status = await getMigrationStatus(targetPath);

  // Filter migrations based on target version
  let migrationsToRun = status.pending;
  if (options.targetVersion) {
    migrationsToRun = migrationsToRun.filter(
      (m) => m.version <= options.targetVersion!
    );
  }

  if (migrationsToRun.length === 0) {
    logger.info('No pending migrations to apply');
    return [];
  }

  // Sort by version
  migrationsToRun.sort((a, b) => a.version.localeCompare(b.version));

  const results: MigrationResult[] = [];

  for (const migration of migrationsToRun) {
    if (options.dryRun) {
      const preview = await previewMigration(migration, options, logger);
      // Convert preview to result format for consistency
      results.push({
        success: true,
        migrationId: migration.id,
        filesModified: preview.totalFilesAffected,
        totalChanges: preview.totalChanges,
        files: preview.files.map((f) => ({
          path: f.path,
          success: true,
          changesApplied: f.changes.length,
          transforms: f.transforms,
        })),
        warnings: [],
        errors: [],
        appliedAt: '[dry-run]',
      });
    } else {
      const result = await applyMigration(migration, options, logger);
      results.push(result);

      // Stop on error
      if (!result.success) {
        logger.error(`Migration ${migration.id} failed, stopping`);
        break;
      }
    }
  }

  return results;
}

// @cpt-end:cpt-hai3-algo-cli-tooling-resolve-pending-migrations:p2:inst-1

/**
 * Format a migration result for display
 */
export function formatResult(result: MigrationResult): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('='.repeat(60));
  lines.push(`  HAI3 Migration Report`);
  lines.push('='.repeat(60));
  lines.push(`  Migration: ${result.migrationId}`);
  lines.push(`  Applied: ${result.appliedAt}`);
  lines.push('-'.repeat(60));
  lines.push(`  Files modified: ${result.filesModified}`);
  lines.push(`  Total changes: ${result.totalChanges}`);

  if (result.warnings.length > 0) {
    lines.push('-'.repeat(60));
    lines.push('  Warnings:');
    for (const warning of result.warnings) {
      lines.push(`    - ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push('-'.repeat(60));
    lines.push('  Errors:');
    for (const error of result.errors) {
      lines.push(`    - ${error}`);
    }
  }

  lines.push('='.repeat(60));
  lines.push(`  Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  lines.push('='.repeat(60));
  lines.push('');

  return lines.join('\n');
}
