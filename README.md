# Controle de Almoxarifado (Next.js + Capacitor)

Aplicação de controle de estoque e ferramentas com suporte Web/Android (Capacitor).

## Build Android
1. Export estático: `npm run export:capacitor`
2. Copiar assets para Android: `npx cap copy android`
3. Abrir/gerar bundle: `cd android && ./gradlew bundleRelease`

## Versão Android
Script de bump: `npm run bump:android [patch|minor|major|set <versão>]`
Atualiza `versionCode` e `versionName` em `android/app/build.gradle`.

## Permissões
- `android.permission.CAMERA`: apenas para leitura de códigos (não gravamos imagens)
- `READ/WRITE_EXTERNAL_STORAGE` (legacy): salvar PDFs/etiquetas gerados localmente (Downloads)

## Salvamento de PDFs
Fluxo: gerar PDF (jsPDF) → tentativa de salvar via plugin nativo MediaStore → fallback Filesystem → Share.

## Política de Privacidade
URL pública: https://docs.google.com/document/d/1o7_RCTS3Kexrzd2FVomTZ6__R8uaL9Y9bwhfBBHsefo

Também disponível localmente em [`/privacy-policy`](./src/app/privacy-policy/page.tsx) e `docs/privacy-policy.md`.

Resumo: usamos a câmera somente para escanear códigos; PDFs são gerados e salvos localmente; não coletamos imagens/vídeos.

## Keystore / Assinatura
Arquivo: `android/app/minha-key.jks` configurado em `keystore.properties`. Mantenha-o fora de controle de versão público.

## Próximos Passos
- Testar em dispositivo real as permissões e fluxo de salvamento
- Documentar backend (Firebase) se habilitado

