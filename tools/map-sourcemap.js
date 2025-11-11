#!/usr/bin/env node
// Usage: node tools/map-sourcemap.js <map-file> <line> <column>
const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

async function main() {
  const [,, mapFile, lineArg, colArg] = process.argv;
  if (!mapFile || !lineArg || !colArg) {
    console.error('Usage: node tools/map-sourcemap.js <map-file> <line> <column>');
    process.exit(2);
  }
  const abs = path.resolve(mapFile);
  if (!fs.existsSync(abs)) {
    console.error('Map file not found:', abs);
    process.exit(2);
  }
  const raw = fs.readFileSync(abs, 'utf8');
  const map = JSON.parse(raw);
  const line = parseInt(lineArg, 10);
  const column = parseInt(colArg, 10);

  const consumer = await new SourceMapConsumer(map);
  try {
    const orig = consumer.originalPositionFor({ line, column });
    console.log(JSON.stringify({ mapFile: abs, generated: { line, column }, original: orig }, null, 2));
  } finally {
    consumer.destroy && consumer.destroy();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
