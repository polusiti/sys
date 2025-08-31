import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'now-src');
const DIST = join(SRC, 'docs/.vuepress/dist');
const DEST = join(ROOT, 'now');

console.log('[now] Installing deps (now-src)...');
execSync('npm install', { cwd: SRC, stdio: 'inherit' });

console.log('[now] Building VuePress site...');
execSync('npm run build', { cwd: SRC, stdio: 'inherit' });

console.log('[now] Replacing now/ directory...');
if (existsSync(DEST)) rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST);

cpSync(DIST, DEST, { recursive: true });

console.log('[now] Build complete. Files in now/:');
console.log(readdirSync(DEST));
