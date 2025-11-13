# Notas de Atualização - Versão 18

## 🎯 Melhorias e Correções

### ✨ Novidades

**� Autenticação Simplificada**
- Removido login com Google para simplificar a experiência
- Foco em autenticação por email/senha mais segura e direta

**📂 Sistema de Backup Profissional**
- Nova pasta dedicada para backups em Documentos/Backups/
- Salvamento automático com nome amigável e timestamp
- Interface melhorada para seleção e restauração de backups
- Validação SHA-256 para garantir integridade dos dados

### 🐛 Correções

**🔍 Busca de Itens**
- Corrigido bug que impedia a busca de funcionar na biblioteca de itens
- Agora é possível pesquisar por nome, especificações e código de barras

**Sistema de Anúncios**
- Corrigido erro "UNIMPLEMENTED" ao exibir vídeos de recompensa
- Melhorada sincronização do plugin AdMob
- Logs detalhados para diagnóstico

**Estabilidade Geral**
- Correções de bugs menores
- Melhorias de desempenho
- Interface mais responsiva

### 🔧 Melhorias Técnicas

- Atualização para versão 18
- Integração completa com AdMob (IDs de produção)
- Código otimizado para melhor performance
- Sistema de logs aprimorado

---

## 📝 Notas para Play Store

### Português (pt-BR)

**Novidades na versão 18:**

✅ Login simplificado (removido Google Sign-In)
✅ Busca de itens corrigida e funcionando perfeitamente
✅ Sistema de backup profissional com validação SHA-256
✅ Nova pasta dedicada para organizar seus backups
✅ Correções importantes no sistema de anúncios
✅ Melhorias de estabilidade e performance

Gerencie seus dados de forma mais simples e segura!

---

### Inglês (en-US)

**What's new in version 18:**

✅ Simplified login (removed Google Sign-In)
✅ Item search fixed and working perfectly
✅ Professional backup system with SHA-256 validation
✅ New dedicated folder to organize your backups
✅ Important fixes in the ads system
✅ Stability and performance improvements

Manage your data in a simpler and more secure way!

---

## 📋 Changelog Técnico

### [18] - 2025-11-13

#### Added
- Dedicated backup folder in Documents/Backups/
- SHA-256 checksum validation for backups
- Backup selection interface with preview
- Timestamp-based backup naming
- File size display in backup list
- Detailed logging system for ads

#### Fixed
- Item search not working in library (fixed ?? operator to || for proper fallback)
- UNIMPLEMENTED error when showing rewarded videos
- AdMob plugin synchronization issues
- Asset sync problems causing plugin errors

#### Changed
- Removed Google Sign-In for simplified authentication
- Updated to AdMob production IDs
- Improved backup export workflow
- Enhanced error handling and user feedback
- Optimized code for better performance

#### Technical
- Version code: 18
- Version name: "18"
- AdMob App ID: ca-app-pub-5771833523730319~8308280172
- Min SDK: 22
- Target SDK: 35
- Compile SDK: 35

---

## 🚀 Próximas Atualizações (Roadmap)

- 🔄 Backup automático diário para Firestore
- ☁️ Sincronização em nuvem
- 📊 Estatísticas de uso de backup
- 🔔 Notificações de backup programado
- 📱 Compartilhamento de backups entre dispositivos

---

**Data de lançamento:** 13 de novembro de 2025  
**Build:** 18  
**Tamanho:** ~18 MB
