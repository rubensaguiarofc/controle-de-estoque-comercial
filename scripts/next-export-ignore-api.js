#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const apiDir = path.join(repoRoot, 'src', 'app', 'api');
const tempDir = path.join(repoRoot, '.temp_api_hidden');

function cleanIfExists(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch {}
}

function moveOrCopy(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) cleanIfExists(dest);
  try {
    fs.renameSync(src, dest);
  } catch (e) {
    // Fallback for EPERM on Windows (cross-device or locked): copy then remove
    const copyRecursive = (s, d) => {
      const stat = fs.statSync(s);
      if (stat.isDirectory()) {
        fs.mkdirSync(d, { recursive: true });
        for (const entry of fs.readdirSync(s)) {
          copyRecursive(path.join(s, entry), path.join(d, entry));
        }
      } else {
        fs.copyFileSync(s, d);
      }
    };
    copyRecursive(src, dest);
    fs.rmSync(src, { recursive: true, force: true });
  }
}

try {
  // Ensure no stale temp remains
  cleanIfExists(tempDir);

  if (fs.existsSync(apiDir)) {
    console.log('Hiding API directory:', apiDir);
    moveOrCopy(apiDir, tempDir);
  } else {
    console.log('No API directory to hide');
  }

  console.log('Running next build (static export via output: export)');
  // Use Node 20 runtime to avoid Node 22 readlink issues on Windows during Next build
  // Equivalent to: npx -p node@20 node node_modules/next/dist/bin/next build
  const env = { ...process.env, NEXT_DISABLE_SWC_NATIVE: '1', NODE_ENV: 'production' };
  // Preload a small fs patch to normalize readlink EISDIR to EINVAL on Windows
  // Prefer preload path relative to the current working dir (handles junctions like C:\proj)
  let preload = path.join(process.cwd(), 'scripts', 'patch-fs.js');
  if (!fs.existsSync(preload)) {
    preload = path.join(repoRoot, 'scripts', 'patch-fs.js');
  }
  // Preload our fs patch for the child Node process by passing -r as an exec arg.
  // This avoids putting -r into NODE_OPTIONS which may be restricted on some Node builds on Windows.
  const preloadPosix = preload.replace(/\\/g, '/');
  const spawnArgs = ['-r', preloadPosix, path.join('node_modules', 'next', 'dist', 'bin', 'next'), 'build'];

  const buildRes = spawnSync(
    process.execPath,
    spawnArgs,
    { stdio: 'inherit', shell: false, env: env }
  );
  if (buildRes.status !== 0) throw new Error('next build failed');

  // next export deprecated on Next 15 when using output: 'export'

} catch (err) {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
} finally {
  if (fs.existsSync(tempDir)) {
    console.log('Restoring API directory');
    moveOrCopy(tempDir, apiDir);
  }
}

console.log('Export completed');
