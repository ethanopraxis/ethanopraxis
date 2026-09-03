/**
 * YouTube Data API -> src/data/videos.json  (machine-owned; never hand-edit)
 *
 * Needs YT_API_KEY and YT_CHANNEL_ID. Reads .env locally so the key never has
 * to be pasted into a shell; in CI they arrive as repo secrets. Values are
 * never printed.
 *
 * Run: node scripts/sync-youtube.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/videos.json');

// Local convenience: .env is git-ignored and holds the key.
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const i = line.indexOf('=');
    if (i < 0 || line.trim().startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
  }
}

const KEY = process.env.YT_API_KEY;
const CHANNEL = process.env.YT_CHANNEL_ID;
if (!KEY || !CHANNEL) {
  console.error('sync-youtube: YT_API_KEY and YT_CHANNEL_ID are required.');
  process.exit(1);
}

const api = async (endpoint, params) => {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [k, v] of Object.entries({ ...params, key: KEY })) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    // Redact anything that looks like the key before this reaches a log.
    throw new Error(`${endpoint} ${res.status}: ${body.split(KEY).join('[redacted]').slice(0, 400)}`);
  }
  return res.json();
};

/** PT1H2M3S -> seconds */
const durationSec = (iso) => {
  const m = /^P(?:([\d.]+)D)?T?(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?$/.exec(iso ?? '') ?? [];
  return (Number(m[1] ?? 0) * 86400) + (Number(m[2] ?? 0) * 3600) + (Number(m[3] ?? 0) * 60) + Number(m[4] ?? 0);
};

const uploads = 'UU' + CHANNEL.slice(2);

const ids = [];
let pageToken;
do {
  const page = await api('playlistItems', {
    part: 'snippet,contentDetails', playlistId: uploads, maxResults: 50,
    ...(pageToken ? { pageToken } : {}),
  });
  for (const it of page.items ?? []) ids.push(it.contentDetails.videoId);
  pageToken = page.nextPageToken;
} while (pageToken);

const videos = [];
for (let i = 0; i < ids.length; i += 50) {
  const page = await api('videos', {
    part: 'snippet,contentDetails', id: ids.slice(i, i + 50).join(','), maxResults: 50,
  });
  for (const v of page.items ?? []) {
    videos.push({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description ?? '',
      publishedAt: v.snippet.publishedAt,
      durationSec: durationSec(v.contentDetails.duration),
      tags: v.snippet.tags ?? [],
    });
  }
}

videos.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : a.id < b.id ? -1 : 1));

// Stable stringify: key order fixed above, so JSON.stringify is deterministic.
const next = JSON.stringify(videos, null, 2) + '\n';
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (next === prev) {
  console.log(`sync-youtube: no change (${videos.length} videos)`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, next);
  console.log(`sync-youtube: wrote ${videos.length} videos`);
}
