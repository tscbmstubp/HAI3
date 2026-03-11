/**
 * Validation utilities for CLI commands
 */
// @cpt-FEATURE:cpt-hai3-algo-cli-tooling-validate-project-name:p1

import lodash from 'lodash';
const { toLower } = lodash;

/**
 * Validate npm package name
 * Based on npm package name rules
 */
// @cpt-begin:cpt-hai3-algo-cli-tooling-validate-project-name:p1:inst-1
export function isValidPackageName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (name.length > 214) return false;
  if (name.startsWith('.') || name.startsWith('_')) return false;
  if (name !== toLower(name)) return false;
  if (/[~'!()*]/.test(name)) return false;
  if (encodeURIComponent(name) !== name) {
    // Check for scoped packages
    if (name.startsWith('@')) {
      const [scope, pkg] = name.slice(1).split('/');
      if (!scope || !pkg) return false;
      if (encodeURIComponent(scope) !== scope) return false;
      if (encodeURIComponent(pkg) !== pkg) return false;
    } else {
      return false;
    }
  }
  return true;
}
// @cpt-end:cpt-hai3-algo-cli-tooling-validate-project-name:p1:inst-1

/**
 * Validate camelCase string
 */
export function isCamelCase(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Must start with lowercase letter
  if (!/^[a-z]/.test(str)) return false;
  // Only alphanumeric characters
  if (!/^[a-zA-Z0-9]+$/.test(str)) return false;
  return true;
}

/**
 * Validate PascalCase string
 */
export function isPascalCase(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Must start with uppercase letter
  if (!/^[A-Z]/.test(str)) return false;
  // Only alphanumeric characters
  if (!/^[a-zA-Z0-9]+$/.test(str)) return false;
  return true;
}

/**
 * Reserved screenset names that cannot be used
 */
const RESERVED_SCREENSET_NAMES = ['screenset', 'screen', 'index', 'api', 'core'];

/**
 * Check if screenset name is reserved
 */
export function isReservedScreensetName(name: string): boolean {
  return RESERVED_SCREENSET_NAMES.includes(toLower(name));
}
