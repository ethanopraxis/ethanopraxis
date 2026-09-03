/**
 * Guard against the lockfile drift that breaks `npm ci` on Linux.
 *
 * npm resolves optional dependencies for the machine it runs on, so a targeted
 * `npm install <pkg>` on macOS can quietly drop the linux-only packages that
 * sharp pulls in. CI then fails with "Missing: @emnapi/… from lock file".
 * Regenerate with: rm -rf node_modules package-lock.json && npm install
 */
import fs from 'node:fs';
import path from 'node:path';

const lock = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, '../package-lock.json'), 'utf8')
);
const names = Object.keys(lock.packages ?? {});
const required = ['@emnapi/runtime', '@emnapi/core', 'linux-x64-gnu'];
const missing = required.filter((n) => !names.some((k) => k.includes(n)));

if (missing.length) {
  console.error(`check-lockfile: package-lock.json is missing Linux build deps: ${missing.join(', ')}`);
  console.error('  `npm ci` will fail in CI. Fix with:');
  console.error('  rm -rf node_modules package-lock.json && npm install');
  process.exit(1);
}
console.log('check-lockfile: Linux optional deps present — npm ci will resolve in CI');
