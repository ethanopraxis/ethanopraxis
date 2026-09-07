/**
 * Refuse to ship personal identifiers in a PUBLIC repo.
 *
 * The channel is deliberately faceless, but the one-time de-identify pass was
 * a cleanup, not a guard — three plan documents added afterwards each carried
 * the owner's given name into the public repo before anyone noticed. This is
 * the mechanical check that pass should have left behind.
 *
 * Patterns live in .privacy-patterns (gitignored), one regex per line, so the
 * names being guarded never enter the repository themselves. Absent file =>
 * skip, which keeps CI green; the guard is for the machine that has the list.
 *
 * Fix a hit by rewording, not by adding an exception.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const LIST = path.join(ROOT, '.privacy-patterns');

if (!fs.existsSync(LIST)) {
  console.log('check-privacy: no .privacy-patterns on this machine — skipped');
  process.exit(0);
}

const patterns = fs.readFileSync(LIST, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => new RegExp(l, 'i'));

if (patterns.length === 0) {
  console.log('check-privacy: .privacy-patterns is empty — skipped');
  process.exit(0);
}

// Tracked files only: what is committed is what becomes public.
const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => f !== 'package-lock.json' && !f.startsWith('docs/reference/nen-mong-v0'));

const hits = [];
for (const rel of files) {
  const full = path.join(ROOT, rel);
  let text;
  try {
    const buf = fs.readFileSync(full);
    if (buf.includes(0)) continue; // binary
    text = buf.toString('utf8');
  } catch {
    continue;
  }
  text.split('\n').forEach((line, i) => {
    for (const re of patterns) {
      if (re.test(line)) hits.push(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`);
    }
  });
}

if (hits.length) {
  console.error(`check-privacy: ${hits.length} personal identifier(s) in tracked files.`);
  console.error('This repository is PUBLIC — reword before committing.\n');
  for (const h of hits) console.error('  ' + h);
  process.exit(1);
}
console.log(`check-privacy: ${files.length} tracked files clean against ${patterns.length} pattern(s)`);
