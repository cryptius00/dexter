import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { MemoryDatabase } from './database.js';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('MemoryDatabase', () => {
  let db: MemoryDatabase;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = join(tmpdir(), `test-db-${Date.now()}-${Math.random()}.sqlite`);
    db = await MemoryDatabase.create(dbPath);
  });

  afterEach(async () => {
    db.close();
    try {
      await unlink(dbPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  });

  it('should delete chunks and FTS entries for a file', async () => {
    const filePath = 'test-file.txt';
    const chunk = {
      filePath,
      startLine: 1,
      endLine: 2,
      content: 'test content',
      contentHash: 'hash1',
    };

    db.upsertChunk({ chunk, embedding: null });

    // Verify it exists
    const beforeCount = db.deleteChunksForFile('non-existent.txt');
    expect(beforeCount).toBe(0);

    const indexedFiles = db.listIndexedFiles();
    expect(indexedFiles).toContain(filePath);

    // Search to verify FTS
    const searchResults = db.searchKeyword('test', 10);
    expect(searchResults.length).toBe(1);

    // Delete
    const deletedCount = db.deleteChunksForFile(filePath);
    expect(deletedCount).toBe(1);

    // Verify it's gone
    const indexedFilesAfter = db.listIndexedFiles();
    expect(indexedFilesAfter).not.toContain(filePath);

    const searchResultsAfter = db.searchKeyword('test', 10);
    expect(searchResultsAfter.length).toBe(0);
  });

  it('should handle deleting multiple chunks for a file', async () => {
     const filePath = 'test-file.txt';
     db.upsertChunk({
       chunk: { filePath, startLine: 1, endLine: 2, content: 'content 1', contentHash: 'hash1' },
       embedding: null
     });
     db.upsertChunk({
       chunk: { filePath, startLine: 3, endLine: 4, content: 'content 2', contentHash: 'hash2' },
       embedding: null
     });

     const deletedCount = db.deleteChunksForFile(filePath);
     expect(deletedCount).toBe(2);

     const searchResults = db.searchKeyword('content', 10);
     expect(searchResults.length).toBe(0);
  });
});
