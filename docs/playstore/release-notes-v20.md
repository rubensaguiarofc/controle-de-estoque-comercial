# Notas de Atualização - Versão 20

## 🚨 CORREÇÕES CRÍTICAS

### **BUG CRÍTICO RESOLVIDO: Abatimento de Estoque**
- Corrigido problema onde saídas de estoque não decrementavam as quantidades
- Método `addWithdrawal` agora usa `setDoc` antes de `updateDoc` para garantir que item exista no Firestore
- Estoque agora é atualizado corretamente em tempo real

### **Erro TypeScript Corrigido**
- Corrigido erro de tipo no código de restauração de backup
- Validação de estrutura de dados mais robusta
- Melhor compatibilidade com formatos de backup v1 e v2

### **Otimização de Logs**
- Removidos logs excessivos em produção (console.log → console.debug)
- Melhor performance e segurança
- Logs de anúncios otimizados para não poluir console

---

## 📋 Melhorias Incluídas (v19 + v20)

### ✨ Novidades

**⚡ Entrada de Estoque Otimizada**
- Scanner de código de barras integrado para adição rápida
- Atalho de teclado (Enter) para adicionar itens
- Indicadores visuais de quantidade em estoque
- Fluxo otimizado para entrada em lote
- Auto-focus inteligente nos campos

**🔐 Autenticação Simplificada**
- Removido login com Google para simplificar a experiência
- Foco em autenticação por email/senha mais segura e direta

**📂 Sistema de Backup Profissional**
- Nova pasta dedicada para backups em Documentos/Backups/
- Salvamento automático com nome amigável e timestamp
- Interface melhorada para seleção e restauração de backups
- Validação SHA-256 para garantir integridade dos dados

### 🐛 Correções

**🚨 Abatimento de Estoque (CRÍTICO)**
- Corrigido bug que impedia a redução automática do estoque nas saídas
- Firebase agora sincroniza corretamente as quantidades
- Solução garante persistência mesmo com itens novos

**🔧 Salvamento de Ferramentas**
- Corrigido bug crítico que impedia salvamento de ferramentas
- Ferramentas agora sincronizam com Firebase/localStorage
- Histórico de movimentação salvo corretamente

**🔍 Busca de Itens**
- Corrigido bug que impedia a busca de funcionar na biblioteca de itens
- Agora é possível pesquisar por nome, especificações e código de barras

**🐛 Erro TypeScript**
- Corrigido erro de tipo em restauração de backup
- Melhor validação de estrutura de dados

**Sistema de Anúncios**
- Corrigido erro "UNIMPLEMENTED" ao exibir vídeos de recompensa
- Melhorada sincronização do plugin AdMob
- Logs otimizados para produção

**Estabilidade Geral**
- Correções de bugs menores
- Melhorias de desempenho
- Interface mais responsiva

### 🔧 Melhorias Técnicas

- Atualização para versão 20
- Integração completa com AdMob (IDs de produção)
- Persistência de ferramentas em nuvem
- Código otimizado para melhor performance
- Sistema de logs aprimorado e otimizado para produção
- Validação de tipos TypeScript mais robusta

---

## 📝 Notas para Play Store

### Português (pt-BR)

**Novidades na versão 20:**

🚨 CORREÇÃO CRÍTICA: Saída de estoque agora funciona perfeitamente!
✅ Entrada de estoque super otimizada com scanner e atalhos
✅ Salvamento de ferramentas corrigido
✅ Login simplificado (removido Google Sign-In)
✅ Busca de itens funcionando perfeitamente
✅ Sistema de backup profissional com validação SHA-256
✅ Melhorias de estabilidade e performance

Versão estável e confiável para uso em produção!

### Inglês (en-US)

**What's new in version 20:**

🚨 CRITICAL FIX: Stock withdrawal now works perfectly!
✅ Super optimized stock entry with scanner and shortcuts
✅ Tool saving fixed
✅ Simplified login (removed Google Sign-In)
✅ Item search working perfectly
✅ Professional backup system with SHA-256 validation
✅ Stability and performance improvements

Stable and reliable version for production use!

---

## 📋 Changelog Técnico

### [20] - 2025-11-14

#### Fixed (CRITICAL)
- **CRITICAL:** Stock withdrawal not decrementing quantities in Firestore
- **CRITICAL:** TypeScript error in backup restoration (`Property 'data' does not exist on type 'any[]'`)
- Tool persistence not working (Firebase/localStorage sync)
- Tool checkout and return history not being saved
- Item search not working in library (fixed ?? operator to || for proper fallback)
- UNIMPLEMENTED error when showing rewarded videos
- AdMob plugin synchronization issues

#### Changed
- Optimized production logging (console.log → console.debug for ads)
- Improved type checking in backup restoration
- Enhanced error handling for stock operations
- Better Firebase document existence validation before updates

#### Technical
- Version code: 20
- Version name: "20"
- Firebase: Added `setDoc` before `updateDoc` to ensure document exists
- TypeScript: Fixed type guard for backup data structure
- Logging: Removed excessive console.log calls in production
- AdMob App ID: ca-app-pub-5771833523730319~8308280172
- Min SDK: 22
- Target SDK: 35
- Compile SDK: 35

---

**Data de lançamento:** 14 de novembro de 2025  
**Build:** 20  
**Tamanho:** ~17 MB

---

## ⚠️ Mudanças Importantes

Esta versão corrige um **bug crítico** onde saídas de estoque não estavam decrementando as quantidades. Se você estiver usando a versão 19, recomendamos atualizar imediatamente para a versão 20.

### Para usuários existentes:
1. Verifique o estoque após a atualização
2. Se necessário, ajuste manualmente as quantidades que não foram decrementadas
3. Futuras saídas funcionarão corretamente
