// Refreshes data/: the real catalogues the pictures show, as they are today. The pictures are made from this snapshot,
// not from the network, so that making them again gives the same pictures until somebody refreshes it on purpose.
//
//   node scripts/shots/levilauncher-windows/refresh-data.mjs
//
// data/catalogues.json   Minecraft's GDK releases (LeviLauncher's minecraft-windows-gdk-version-db) and the LeviLamina
//                        versions of each game version (levilamina-client-version-db), as LeviLauncher fetches them.
// data/mods/...          the entry of LeviOptimize in the LeviMC Mods catalogue (levimc.org/api/v4/mods/index.json),
//                        its detail and its icon, served to the launcher in place of levimc.org.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = path.join(here, 'data');
const RAW = 'https://raw.githubusercontent.com/LiteLDev';
const MODS = 'https://levimc.org/api/v4/mods/';
const MOD_ID = 'github.com/LiteLDev/LeviOptimize';
const RELEASES = 12; // the newest GDK releases kept: more than the Download page shows at once

async function get(url, as = 'json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return as === 'json' ? response.json() : Buffer.from(await response.arrayBuffer());
}

function write(file, content) {
  const target = path.join(data, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, typeof content === 'string' ? content : content);
  console.log(`wrote data/${file}`);
}

const gdk = await get(`${RAW}/minecraft-windows-gdk-version-db/refs/heads/main/historical_versions.json`);
const db = await get(`${RAW}/levilamina-client-version-db/refs/heads/main/v2/version-db.json`);
const catalogues = {
  releaseVersions: gdk.releaseVersions.slice(-RELEASES),
  leviLaminaVersionDB: db.versions,
};
write('catalogues.json', `${JSON.stringify(catalogues, null, 2)}\n`);

// The launcher leaves out of the catalogue every mod whose detail it cannot read, and the pictures show only
// LeviOptimize: the catalogue is kept with LeviOptimize alone, so that only its detail needs to be kept.
const index = await get(`${MODS}index.json`);
index.mods = index.mods.filter((mod) => mod.id === MOD_ID);
if (index.mods.length !== 1) throw new Error(`${MOD_ID} is not in the catalogue`);
const detail = await get(`${MODS}${MOD_ID}/index.json`);
index.stats = { projects: 1, authors: 1, versions: detail.versions.length }; // of the catalogue kept
write('mods/index.json', `${JSON.stringify(index)}\n`);
write(`mods/${MOD_ID}/index.json`, `${JSON.stringify(detail)}\n`);
// capture.mjs serves levimc.org/mods/<path> from data/mods/<path>.
const icon = new URL(detail.logo);
if (icon.hostname !== 'levimc.org' || !icon.pathname.startsWith('/mods/')) throw new Error(`The icon moved: ${detail.logo}`);
write(`mods${icon.pathname.replace(/^\/mods/, '')}`, await get(detail.logo, 'bytes'));
