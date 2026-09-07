/**
 * Guard against the lockfile drift that breaks `npm ci` on Linux.
 *
 * npm resolves optional dependencies for the machine it runs on, so a targeted
 * `npm install <pkg>` on macOS can quietly drop packages that only a Linux tree
 * needs — typically @emnapi/*, required by @img/sharp-wasm32. CI then dies with
 * "Missing: @emnapi/runtime from lock file".
 *
 * This checks the invariant `npm ci` actually enforces: every dependency
 * declared by every entry must RESOLVE somewhere up the node_modules chain.
 * An earlier version only grepped for the package name anywhere in the file,
 * which passed happily while nested copies existed under an unrelated parent
 * and no top-level entry did — a false green that shipped a broken build.
 *
 * Fix when it fails: rm -rf node_modules package-lock.json && npm install
 */
import fs from 'node:fs';
import path from 'node:path';

const lock = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, '../package-lock.json'), 'utf8'),
);
const entries = lock.packages ?? {};
const present = new Set(Object.keys(entries));

/** Mirror npm's lookup: the package's own node_modules, then each ancestor's. */
function resolves(from, name) {
  const scopes = [];
  let base = from;
  while (true) {
    scopes.push(base ? `${base}/node_modules/${name}` : `node_modules/${name}`);
    const i = base.lastIndexOf('/node_modules/');
    if (i < 0) break;
    base = base.slice(0, i);
  }
  scopes.push(`node_modules/${name}`);
  return scopes.some((s) => present.has(s));
}

const missing = [];
for (const [where, meta] of Object.entries(entries)) {
  if (meta.link) continue; // workspace symlink, resolved elsewhere
  for (const field of ['dependencies', 'optionalDependencies']) {
    for (const name of Object.keys(meta[field] ?? {})) {
      if (!resolves(where, name)) missing.push(`${name}  (required by ${where || 'the root package'})`);
    }
  }
}

if (missing.length) {
  console.error('check-lockfile: package-lock.json has unresolvable dependencies.');
  console.error('`npm ci` will fail — most often on Linux only, so CI breaks and local passes.\n');
  for (const m of [...new Set(missing)].sort()) console.error('  missing: ' + m);
  console.error('\nFix: rm -rf node_modules package-lock.json && npm install');
  process.exit(1);
}
console.log(`check-lockfile: all ${present.size - 1} locked packages resolve — npm ci will install`);
