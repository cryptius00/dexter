import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute, join, normalize, relative, resolve as resolvePath, sep } from 'node:path';
import { resolveToCwd } from './utils/path-utils.js';

// Deny-list of sensitive system paths
const DENY_LIST = [
  '/etc',
  '/usr',
  '/bin',
  '/sbin',
  '/var',
  '/sys',
  '/proc',
  '/boot',
  '/dev',
  '/root',
];

// Windows-specific deny paths
const WINDOWS_DENY_LIST = [
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\Users\\All Users',
  'C:\\ProgramData',
];

/**
 * Check if a path is in the deny-list of sensitive directories
 */
function isPathDenied(resolvedPath: string): boolean {
  const normalizedPath = normalize(resolvedPath).toLowerCase();

  // Check Unix-style paths
  for (const denied of DENY_LIST) {
    if (normalizedPath.startsWith(denied.toLowerCase())) {
      return true;
    }
  }

  // Check Windows-style paths
  for (const denied of WINDOWS_DENY_LIST) {
    if (normalizedPath.startsWith(denied.toLowerCase())) {
      return true;
    }
  }

  // Check for hidden files/directories in sensitive locations
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir) {
    const normalizedHome = normalize(homeDir).toLowerCase();
    const sensitiveDirs = ['/.ssh', '/.aws', '/.gnupg', '/.kube'];
    for (const sensitive of sensitiveDirs) {
      if (normalizedPath.startsWith((normalizedHome + sensitive).toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

export function resolveSandboxPath(params: { filePath: string; cwd: string; root: string }): {
  resolved: string;
  relative: string;
} {
  const resolved = resolveToCwd(params.filePath, params.cwd);
  const rootResolved = resolvePath(params.root);
  const rel = relative(rootResolved, resolved);

  if (!rel || rel === '') {
    return { resolved, relative: '' };
  }

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Path escapes sandbox root: ${params.filePath}`);
  }

  // Check deny-list BEFORE returning
  if (isPathDenied(resolved)) {
    throw new Error(`Access to sensitive path is forbidden: ${params.filePath}`);
  }

  // Additional check: normalize and verify no path traversal
  const normalized = normalize(resolved);
  if (!normalized.startsWith(rootResolved)) {
    throw new Error(`Path traversal detected: ${params.filePath}`);
  }

  return { resolved, relative: rel };
}

export async function assertSandboxPath(params: {
  filePath: string;
  cwd: string;
  root?: string;
}): Promise<{ resolved: string; relative: string }> {
  const root = params.root ?? params.cwd;
  const rootResolved = resolvePath(root);

  // FIRST, check for symlinks in the RAW path to catch normalization bypass.
  // We must not use path.resolve/normalize because it swallows '..'.
  // Instead, we manually iterate through the path components.
  const components = params.filePath.split(/[\\/]/).filter(Boolean);
  let current = isAbsolute(params.filePath) ? resolvePath(params.filePath).split(sep)[0] + sep : params.cwd;

  for (const component of components) {
    current = join(current, component);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(`Symlink not allowed in sandbox path: ${current}`);
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== 'ENOENT') {
        throw err;
      }
    }
  }

  const resolved = resolveSandboxPath({ filePath: params.filePath, cwd: params.cwd, root });

  // 1. Check for symlinks in the lexically normalized path as well
  await assertNoSymlink(resolved.relative, rootResolved);

  // 2. Check the real path to ensure it's still within the sandbox
  try {
    const real = await realpath(resolved.resolved);
    const rel = relative(rootResolved, real);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error(`Path escapes sandbox root (via symlink): ${params.filePath}`);
    }
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== 'ENOENT') {
      throw err;
    }
    // If file doesn't exist, realpath will fail with ENOENT.
    // We still want to allow non-existent paths for write_file.
    // The assertNoSymlink check already covers the components that DO exist.
  }

  return resolved;
}

async function assertNoSymlink(relativePath: string, root: string): Promise<void> {
  if (!relativePath) {
    return;
  }

  const parts = relativePath.split(/[\\/]/).filter(Boolean);
  let current = root;

  for (const part of parts) {
    // If we encounter '..', we must follow it physically if possible,
    // but assertNoSymlink's job is just to check if anything along the path is a symlink.
    // If we use lexical join for '..', it might not match reality.
    // BUT we want to FORBID symlinks anyway.

    // If part is '..', we are going back up.
    // Lexically, join(current, '..') is fine for checking if the RESULT is a symlink,
    // but it doesn't help if the PREVIOUS component was a symlink.
    // However, we check every component as we go.

    current = join(current, part);

    // If we've escaped the root lexically, that's already a red flag,
    // but resolveSandboxPath should have caught that for the final path.
    // For intermediate components, we still check them.

    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(`Symlink not allowed in sandbox path: ${current}`);
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'ENOENT') {
        // If a component doesn't exist, we can't reliably check it or its children.
        // If it's a '..' that doesn't exist, that's weird.
        // Usually we only care if an EXISTING component is a symlink.
        continue;
      }
      throw err;
    }
  }
}
