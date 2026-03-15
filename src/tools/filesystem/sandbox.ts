import { lstat } from 'node:fs/promises';
import { isAbsolute, join, normalize, relative, resolve as resolvePath } from 'node:path';
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
  const resolved = resolveSandboxPath({ filePath: params.filePath, cwd: params.cwd, root });
  await assertNoSymlink(resolved.relative, resolvePath(root));
  return resolved;
}

async function assertNoSymlink(relativePath: string, root: string): Promise<void> {
  if (!relativePath) {
    return;
  }

  const parts = relativePath.split(/[\\/]/).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(`Symlink not allowed in sandbox path: ${current}`);
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'ENOENT') {
        return;
      }
      throw err;
    }
  }
}
