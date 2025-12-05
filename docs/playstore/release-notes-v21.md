# Notas de Atualização - Versão 21

## 🎯 OTIMIZAÇÃO DE TAMANHO E PERFORMANCE

### **R8 Code Shrinking Ativado**
- App agora usa R8 para reduzir tamanho e otimizar código
- Tamanho reduzido de **17.29 MB → 17.04 MB** (redução de ~250 KB)
- Arquivo de mapeamento `mapping.txt` incluído para análise de crashes
- Melhor performance em tempo de execução

### **Arquivo de Desofuscação**
- Arquivo `mapping.txt` (20.7 MB) gerado e incluído no upload
- Facilita análise e depuração de falhas e ANRs
- Stacktraces de crashes agora são legíveis no Play Console
- Melhor diagnóstico de problemas em produção

---

## 🚨 CORREÇÕES CRÍTICAS (Incluídas de v20)

### **BUG CRÍTICO RESOLVIDO: Abatimento de Estoque**
- Corrigido problema onde saídas de estoque não decrementavam as quantidades
- Método `addWithdrawal` agora usa `setDoc` antes de `updateDoc`
- Estoque agora é atualizado corretamente em tempo real

### **Erro TypeScript Corrigido**
- Corrigido erro de tipo no código de restauração de backup
- Validação de estrutura de dados mais robusta

### **Otimização de Logs**
- Removidos logs excessivos em produção
- Melhor performance e segurança

---

## 📋 Melhorias Incluídas (v19-v21)

### ✨ Novidades

**⚡ Entrada de Estoque Otimizada**
- Scanner de código de barras integrado
- Atalho de teclado (Enter) para adicionar itens
- Indicadores visuais de quantidade em estoque
- Fluxo otimizado para entrada em lote
- Auto-focus inteligente nos campos

**🔐 Autenticação Simplificada**
- Removido login com Google
- Foco em autenticação por email/senha

**📂 Sistema de Backup Profissional**
- Nova pasta dedicada para backups
- Validação SHA-256 para integridade dos dados

**⚡ Performance e Tamanho**
- R8 code shrinking ativo
- Recursos não utilizados removidos
- App mais leve e rápido

### 🐛 Correções

**🚨 Abatimento de Estoque (CRÍTICO)**
- Saídas agora decrementam estoque corretamente

**🔧 Salvamento de Ferramentas**
- Ferramentas sincronizam com Firebase/localStorage
- Histórico de movimentação salvo corretamente

**🔍 Busca de Itens**
- Busca funcionando perfeitamente

**Sistema de Anúncios**
- Corrigido erro "UNIMPLEMENTED"
- Melhorada sincronização do plugin AdMob

### 🔧 Melhorias Técnicas

- Atualização para versão 21
- R8/ProGuard ativado com regras otimizadas
- Arquivo mapping.txt incluído (20.7 MB)
- Código ofuscado para maior segurança
- Tamanho do app reduzido
- Integração completa com AdMob
- Persistência de ferramentas em nuvem
- Sistema de logs otimizado

---

## 📝 Notas para Play Store

### Português (pt-BR)

**Novidades na versão 21:**

⚡ App mais leve e rápido com R8 ativado
🚨 CORREÇÃO CRÍTICA: Saída de estoque funcionando perfeitamente
✅ Arquivo de desofuscação incluído para melhor suporte
✅ Entrada de estoque super otimizada
✅ Salvamento de ferramentas corrigido
✅ Sistema de backup profissional
✅ Melhorias de estabilidade e performance

Versão otimizada, estável e confiável!

### Inglês (en-US)

**What's new in version 21:**

⚡ Lighter and faster app with R8 enabled
🚨 CRITICAL FIX: Stock withdrawal working perfectly
✅ Deobfuscation file included for better support
✅ Super optimized stock entry
✅ Tool saving fixed
✅ Professional backup system
✅ Stability and performance improvements

Optimized, stable and reliable version!

---

## 📋 Changelog Técnico

### [21] - 2025-11-14

#### Added
- R8 code shrinking and resource shrinking enabled
- ProGuard mapping file (mapping.txt) for crash deobfuscation
- Additional ProGuard rules for Facebook SDK warnings

#### Changed
- Reduced app size from 17.29 MB to 17.04 MB (~250 KB reduction)
- Enabled minifyEnabled and shrinkResources in release build
- Optimized code with R8 optimizer

#### Fixed (from v20)
- **CRITICAL:** Stock withdrawal not decrementing quantities
- TypeScript error in backup restoration
- Excessive production logging

#### Technical
- Version code: 21
- Version name: "21"
- R8: Enabled with optimize mode
- Mapping file: app/build/outputs/mapping/release/mapping.txt (20.7 MB)
- ProGuard rules: Updated with Facebook SDK dontwarn
- App size: 17.04 MB (reduced from 17.29 MB)
- AdMob App ID: ca-app-pub-5771833523730319~8308280172
- Min SDK: 22
- Target SDK: 35
- Compile SDK: 35

---

## 📦 Arquivos para Upload

1. **AAB:** `android/app/build/outputs/bundle/release/app-release.aab` (17.04 MB)
2. **Mapping:** `android/app/build/outputs/mapping/release/mapping.txt` (20.7 MB)

**IMPORTANTE:** Faça upload do arquivo `mapping.txt` no Play Console junto com o AAB. Isso permitirá que stacktraces de crashes sejam legíveis.

---

**Data de lançamento:** 14 de novembro de 2025  
**Build:** 21  
**Tamanho:** ~17 MB (reduzido de 17.29 MB)
