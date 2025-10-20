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
  const buildRes = spawnSync('npx', ['cross-env', 'NODE_ENV=production', 'next', 'build'], { stdio: 'inherit', shell: true });
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
