import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.next', 'plan-tests');
mkdirSync(output, { recursive: true });
writeFileSync(path.join(output, 'package.json'), '{"type":"commonjs"}\n');
const compile = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.plan-tests.json'], { cwd: root, stdio: 'inherit' });
if (compile.error || compile.status !== 0) process.exit(compile.status || 1);
const tests = ['domain', 'security'].flatMap(folder => readdirSync(path.join(output, 'tests', folder)).filter(name => name.endsWith('.test.js')).map(name => path.join(output, 'tests', folder, name)));
const run = spawnSync(process.execPath, ['--test', ...tests], { cwd: root, stdio: 'inherit' });
process.exit(run.status ?? 1);
