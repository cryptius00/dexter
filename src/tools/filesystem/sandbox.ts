import { lstat, realpath } from 'node:fs/promises';
import {
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve as resolvePath,
  sep,
} from 'node:path';
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
 * Check if a path is under a parent directory (inclusive)
 */
function isUnder(parent: string, child: string): boolean {
  if (parent === child) return true;
  const relativePath = relative(parent, child);
  return !relativePath.startsWith('..') && !isAbsolute(relativePath) && relativePath !== '';
}

/**
 * Check if a path is in the deny-list of sensitive directories
 */
function isPathDenied(resolvedPath: string): boolean {
  const normalizedPath = normalize(resolvedPath).toLowerCase();

  // Check Unix-style paths
  for (const denied of DENY_LIST) {
    if (isUnder(denied.toLowerCase(), normalizedPath)) {
      return true;
    }
  }

  // Check Windows-style paths
  for (const denied of WINDOWS_DENY_LIST) {
    if (isUnder(denied.toLowerCase(), normalizedPath)) {
      return true;
    }
  }

  // Check for hidden files/directories in sensitive locations
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir) {
    const normalizedHome = normalize(homeDir).toLowerCase();
    const sensitiveDirs = ['/.ssh', '/.aws', '/.gnupg', '/.kube'];
    for (const sensitive of sensitiveDirs) {
      const sensitivePath = normalize(join(normalizedHome, sensitive)).toLowerCase();
      if (isUnder(sensitivePath, normalizedPath)) {
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
  if (!isUnder(rootResolved, normalized)) {
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
  const resolvedRoot = resolvePath(root);

  // Check if root itself is a symlink
  try {
    const rootStat = await lstat(resolvedRoot);
    if (rootStat.isSymbolicLink()) {
      throw new Error(`Sandbox root cannot be a symbolic link: ${resolvedRoot}`);
    }
  } catch (err) {
    if ((err as { code?: string }).code !== 'ENOENT') {
      throw err;
    }
  }

  // Security: Check for symlinks in the RAW path components BEFORE lexical normalization.
  // path.relative() and path.resolve() might normalize away '..', so we must
  // inspect the components of the input path manually.
  if (params.filePath.includes('..')) {
    const { root: pathRoot } = parse(params.filePath);
    let current = isAbsolute(params.filePath) ? pathRoot : params.cwd;
    const parts = params.filePath.split(/[\\/]/).filter(Boolean);
    for (const part of parts) {
      const next = join(current, part);
      try {
        const stat = await lstat(next);
        if (stat.isSymbolicLink() && part !== '..') {
          throw new Error(`Symlink not allowed in path with traversal: ${next}`);
        }
      } catch {}
      current = next;
    }
  }

  const expanded = resolveToCwd(params.filePath, params.cwd);
  const rawRelative = relative(resolvedRoot, expanded);
  await assertNoSymlink(rawRelative, resolvedRoot);

  const resolved = resolveSandboxPath({ filePath: params.filePath, cwd: params.cwd, root });

  // Final canonical check: ensure the real path is still under the real root
  try {
    const realRoot = await realpath(resolvedRoot);
    const realTarget = await realpath(resolved.resolved);

    if (!isUnder(realRoot, realTarget)) {
      throw new Error(`Canonical path traversal detected: ${params.filePath}`);
    }
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== 'ENOENT') {
      throw err;
    }
    // If target doesn't exist, we've already done lexical and symlink-component checks.
    // For write_file, the target might not exist yet.
    // We should still ensure the parent directory is safe.
    try {
      let current = resolved.resolved;
      while (current !== resolvedRoot) {
        const parent = join(current, '..');
        if (parent === current) break;
        try {
          const [realParent, realRoot] = await Promise.all([realpath(parent), realpath(resolvedRoot)]);
          if (!isUnder(realRoot, realParent)) {
            throw new Error(`Canonical path traversal detected in parent: ${params.filePath}`);
          }
          break; // Found an existing parent that is safe
        } catch {
          current = parent;
        }
      }
    } catch {
      // Ignore errors in parent check
    }
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
