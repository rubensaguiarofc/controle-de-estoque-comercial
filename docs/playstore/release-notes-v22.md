# Notas de Atualização - Versão 22

## 🆕 Novidades principais

### **Suporte nativo para seleção de arquivos (Importar Backup)**
- Adicionado suporte a seleção de arquivos nativa em Android (via file chooser) para importar backups de qualquer pasta.
- Foram incluídos plugins auxiliares (Cordova) para compatibilidade com diferentes ROMs:
  - `cordova-plugin-filechooser`
  - `cordova-plugin-filepath`
  - `cordova-plugin-file`
- O app agora tenta usar o picker nativo automaticamente; no navegador continua funcionando via `input[type=file]`.

### **Fluxo de permissão para arquivos**
- Quando o seletor nativo falhar por falta de permissão, o app mostra um fluxo guiado para que o usuário habilite o acesso a arquivos nas configurações do app.
- Botão "Abrir configurações" tenta abrir a tela de configurações do aplicativo para facilitar a concessão da permissão.
- Observação: `MANAGE_EXTERNAL_STORAGE` foi adicionada ao `AndroidManifest.xml`. Esse escopo de permissão exige justificativa na Play Store e o usuário precisa autorizar nas configurações do sistema.

---

## 🎯 Outras melhorias e correções (incluídas de v21)

- R8 / ProGuard continuam ativos para reduzir o tamanho do app e gerar `mapping.txt`.
- Correção crítica: abatimento de estoque (saídas agora decrementam corretamente).
- Persistência de assinatura para retirada/devolução de ferramentas.
- Resumo de Uso agora filtra pelo item pesquisado para reduzir impressões massivas.
- Fila de operações offline adicionada para gravar operações quando o app está offline e sincronizar depois.

---

## 🔧 Técnicos e Build

- Version code: 22
- Version name: "22"
- Alterações de manifest: adicionada permissão `android.permission.MANAGE_EXTERNAL_STORAGE` (use com cautela)
- Cordova plugins adicionados para file picker/reading
- Commit branch: `chore/atualizacao-20251030`

---

## 📝 Notas para Play Store (pt-BR)

**Novidades na versão 22:**

- Importação de backups de qualquer pasta (picker nativo)
- Fluxo de permissão guiado para habilitar acesso a arquivos
- Correções de estabilidade e pequenas otimizações

---

## 📋 Changelog técnico resumido

### [22] - 2025-11-28

#### Added
- Suporte nativo ao file picker para importar backups
- Fluxo de permissão e helper para abrir configurações do app
- Cordova plugins: `cordova-plugin-filechooser`, `cordova-plugin-filepath`, `cordova-plugin-file`

#### Changed
- Bump versionCode/versionName para 22
- Backup import fallback aprimorado (web + native)

#### Fixed
- Diversas correções de confiabilidade em importação de backups

---

**Build:** 22
**Data de lançamento:** 28 de novembro de 2025
