import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { assertSandboxPath } from './sandbox';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mkdir, symlink, writeFile, rm } from 'node:fs/promises';

describe('sandbox security', () => {
  const tmpDir = path.resolve(process.cwd(), 'tmp_test_sandbox_unit');
  const sandboxRoot = path.join(tmpDir, 'sandbox');

  beforeEach(async () => {
    if (fs.existsSync(tmpDir)) await rm(tmpDir, { recursive: true });
    await mkdir(tmpDir, { recursive: true });
    await mkdir(sandboxRoot, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it('should block symlinks pointing outside', async () => {
    const outsideFile = path.join(tmpDir, 'secret.txt');
    await writeFile(outsideFile, 'secret');
    const link = path.join(sandboxRoot, 'link');
    await symlink(outsideFile, link);

    await expect(assertSandboxPath({
      filePath: 'link',
      cwd: sandboxRoot,
      root: sandboxRoot
    })).rejects.toThrow(/Symlink not allowed/);
  });

  it('should block symlink normalization bypass (link/../outside)', async () => {
    const realDir = path.join(tmpDir, 'real_dir');
    await mkdir(realDir);
    const secretFile = path.join(tmpDir, 'secret.txt');
    await writeFile(secretFile, 'secret');

    const linkToReal = path.join(sandboxRoot, 'link_to_real');
    await symlink(realDir, linkToReal);

    // This path lexically resolves to sandbox/secret.txt
    // But physically it goes to tmpDir/secret.txt
    await expect(assertSandboxPath({
      filePath: 'link_to_real/../secret.txt',
      cwd: sandboxRoot,
      root: sandboxRoot
    })).rejects.toThrow(/Symlink not allowed/);
  });

  it('should allow normal files', async () => {
    const normalFile = path.join(sandboxRoot, 'test.txt');
    await writeFile(normalFile, 'hello');

    const res = await assertSandboxPath({
      filePath: 'test.txt',
      cwd: sandboxRoot,
      root: sandboxRoot
    });
    expect(res.relative).toBe('test.txt');
  });

  it('should allow non-existent files for writing', async () => {
    const res = await assertSandboxPath({
      filePath: 'new-file.txt',
      cwd: sandboxRoot,
      root: sandboxRoot
    });
    expect(res.relative).toBe('new-file.txt');
  });
});
