import { spawnSync } from 'node:child_process';

const isolationFlag = process.allowedNodeEnvironmentFlags.has('--test-isolation')
  ? '--test-isolation=none'
  : '--experimental-test-isolation=none';
const result = spawnSync(process.execPath, [
  '--experimental-transform-types', '--test', isolationFlag, 'tests/*.test.mjs',
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
