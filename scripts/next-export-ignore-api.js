#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const apiDir = path.join(repoRoot, 'src', 'app', 'api');
const tempDir = path.join(repoRoot, '.temp_api_hidden');

function move(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) {
    console.error('Destination already exists:', dest);
    process.exit(1);
  }
  fs.renameSync(src, dest);
}

try {
  if (fs.existsSync(apiDir)) {
    console.log('Hiding API directory:', apiDir);
    move(apiDir, tempDir);
  } else {
    console.log('No API directory to hide');
  }

  console.log('Running next build && next export');
  // Use cross-env via npx for cross-platform NODE_ENV setting on Windows
  const res = spawnSync('npx', ['cross-env', 'NODE_ENV=production', 'next', 'build'], { stdio: 'inherit', shell: true });
  if (res.status !== 0) throw new Error('next build failed');

} catch (err) {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
} finally {
  if (fs.existsSync(tempDir)) {
    console.log('Restoring API directory');
    move(tempDir, apiDir);
  }
}

console.log('Export completed');
