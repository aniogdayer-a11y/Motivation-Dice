const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');
const tests = readdirSync(path.join(__dirname, 'tests')).filter(file => file.endsWith('.test.mjs')).map(file => path.join('tests', file));
const result = spawnSync(process.execPath, ['--test', ...tests], { cwd: __dirname, stdio: 'inherit' });
process.exit(result.status ?? 1);
