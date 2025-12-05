#!/usr/bin/env node
/**
 * bump-android-version.js
 * Incrementa versionCode e versionName do arquivo android/app/build.gradle automaticamente.
 * Uso:
 *   node scripts/bump-android-version.js            -> patch (default)
 *   node scripts/bump-android-version.js patch
 *   node scripts/bump-android-version.js minor
 *   node scripts/bump-android-version.js major
 *   node scripts/bump-android-version.js set 2.5.0  -> define versão específica
 *
 * Regras:
 * - versionCode: sempre +1
 * - versionName: semver (major.minor[.patch])
 *   - patch: incrementa último número
 *   - minor: incrementa segundo número, zera patch
 *   - major: incrementa primeiro número, zera minor/patch
 *   - set: define exatamente a string fornecida
 */

const fs = require('fs');
const path = require('path');

const mode = (process.argv[2] || 'patch').toLowerCase();
const explicitVersion = process.argv[3];

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (!fs.existsSync(gradlePath)) {
  console.error('Arquivo build.gradle não encontrado em', gradlePath);
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, 'utf8');

const versionCodeRegex = /versionCode\s+(\d+)/;
const versionNameRegex = /versionName\s+"([^"]+)"/;

const vcMatch = content.match(versionCodeRegex);
const vnMatch = content.match(versionNameRegex);

if (!vcMatch || !vnMatch) {
  console.error('Não foi possível localizar versionCode ou versionName no build.gradle');
  process.exit(1);
}

const currentCode = parseInt(vcMatch[1], 10);
const currentName = vnMatch[1];

function bumpName(name, mode, explicit) {
  if (mode === 'set') {
    if (!explicit) {
      console.error('Modo set exige uma versão explícita. Ex: set 2.0.0');
      process.exit(1);
    }
    return explicit;
  }
  const parts = name.split('.').map(p => parseInt(p, 10));
  // Garantir ao menos 3 partes para facilitar patch
  while (parts.length < 3) parts.push(0);

  switch (mode) {
    case 'major':
      parts[0] += 1; parts[1] = 0; parts[2] = 0; break;
    case 'minor':
      parts[1] += 1; parts[2] = 0; break;
    case 'patch':
      parts[parts.length - 1] += 1; break;
    default:
      console.warn('Modo desconhecido, usando patch');
      parts[parts.length - 1] += 1;
  }
  // Remover zeros finais se originalmente tinha menos partes
  // Se original tinha 2 partes e patch criou terceira, mantemos.
  return parts.join('.');
}

const newVersionCode = currentCode + 1;
const newVersionName = bumpName(currentName, mode, explicitVersion);

content = content.replace(versionCodeRegex, `versionCode ${newVersionCode}`)
                 .replace(versionNameRegex, `versionName "${newVersionName}"`);

// Adiciona comentário de auditoria se não existir ainda
if (!/AUTO_VERSION_BUMP/.test(content)) {
  content = content.replace(/android \{/, match => `${match}\n    // AUTO_VERSION_BUMP: versionCode/versionName são mantidos pelo script bump-android-version.js`);
}

fs.writeFileSync(gradlePath, content, 'utf8');

console.log(`Versão Android atualizada: versionCode ${currentCode} -> ${newVersionCode}, versionName ${currentName} -> ${newVersionName}`);
