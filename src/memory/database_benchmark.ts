import { MemoryDatabase } from './database.js';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function runBenchmark() {
  const dbPath = join(tmpdir(), `test-db-${Date.now()}.sqlite`);
  const db = await MemoryDatabase.create(dbPath);

  const filePath = 'test-file.txt';
  const numChunks = 1000;

  console.log(`Inserting ${numChunks} chunks...`);
  for (let i = 0; i < numChunks; i++) {
    db.upsertChunk({
      chunk: {
        filePath,
        startLine: i,
        endLine: i + 1,
        content: `Content for chunk ${i}`,
        contentHash: `hash-${i}`,
      },
      embedding: new Array(1536).fill(0).map(() => Math.random()),
      provider: 'test',
      model: 'test',
    });
  }

  console.log('Running deleteChunksForFile...');
  const start = performance.now();
  const deletedCount = db.deleteChunksForFile(filePath);
  const end = performance.now();

  console.log(`Deleted ${deletedCount} chunks in ${(end - start).toFixed(2)}ms`);

  db.close();
  await unlink(dbPath);
}

runBenchmark().catch(console.error);
