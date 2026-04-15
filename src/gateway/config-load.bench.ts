
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { loadGatewayConfig } from './config.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tempConfigPath = join(tmpdir(), `gateway-perf-test-${Date.now()}.json`);

const dummyConfig = {
  gateway: { accountId: 'perf-test', logLevel: 'debug' },
  channels: {
    whatsapp: {
      enabled: true,
      accounts: {
        'test-acc': {
          enabled: true,
          allowFrom: ['+15551234567', '+15557654321', '*'],
        }
      },
      allowFrom: ['+15551234567']
    }
  },
  bindings: []
};

writeFileSync(tempConfigPath, JSON.stringify(dummyConfig), 'utf8');

const iterations = 1000;

console.log(`Benchmarking loadGatewayConfig with ${iterations} iterations...`);

console.time('loadGatewayConfig');
for (let i = 0; i < iterations; i++) {
  loadGatewayConfig(tempConfigPath);
}
console.timeEnd('loadGatewayConfig');

if (existsSync(tempConfigPath)) {
  unlinkSync(tempConfigPath);
}
