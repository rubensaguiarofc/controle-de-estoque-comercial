# Debug AdMob - Vídeos com Recompensa

## Problema
O toast "Mostrando vídeo com recompensa…" aparece, mas o vídeo não carrega.

## Possíveis Causas

### 1. **AdMob ainda não aprovado** (MAIS PROVÁVEL)
- IDs de produção levam 24-48h para começar a servir anúncios após primeiro cadastro
- Até lá, AdMob retorna erro "No fill" mesmo com ID válido
- **Solução temporária**: Use IDs de teste do Google

### 2. **Falta conexão com internet**
- Anúncios são carregados da internet
- Verifique se o dispositivo está conectado

### 3. **Região não suportada**
- Alguns anúncios não estão disponíveis em todas as regiões
- Brasil geralmente tem boa cobertura

### 4. **AdMob não inicializado corretamente**
- Verificar logs do Chrome DevTools

## Como Debugar

### 1. Instalar o APK atualizado
```
android\app\build\outputs\apk\release\app-release.apk
```

### 2. Conectar Chrome DevTools
1. Conectar celular no PC via USB
2. Ativar **Depuração USB** no celular (Configurações > Opções do desenvolvedor)
3. Abrir Chrome no PC e ir para: `chrome://inspect`
4. Selecionar o app na lista
5. Clicar em **Inspect**

### 3. Verificar Console Logs
No console do DevTools, procure por:
- `[showLongRewarded]` - Logs do ad-manager
- `[ads-export]` - Logs da exportação
- `[canShow:rewarded]` - Verificação de cooldown
- Erros do AdMob plugin

### 4. Testar Exportação
1. No app, fazer **backup** → deve tentar mostrar vídeo
2. Fazer **exportação de relatório** → deve tentar mostrar vídeo
3. Verificar mensagens no console

## Logs Esperados (SUCESSO)

```
[canShow:rewarded] first time, allowing
[ads-export] attempting rewarded video (export #1)
[showLongRewarded] preparing ad { adId: "ca-app-pub-...", isTesting: false }
[showLongRewarded] showing ad
[showLongRewarded] ad shown successfully
```

## Logs Esperados (ERRO: No Fill)

```
[canShow:rewarded] first time, allowing
[ads-export] attempting rewarded video (export #1)
[showLongRewarded] preparing ad { adId: "ca-app-pub-...", isTesting: false }
[showLongRewarded] error: AdMobError { code: "ERROR_CODE_NO_FILL", message: "..." }
[ads-export] rewarded video error: ...
```

**Significado**: ID de produção válido, mas AdMob não tem anúncios disponíveis ainda.

## Solução Temporária: Usar IDs de Teste

Se o erro for "No Fill", edite `.env.local`:

```bash
# Comentar IDs de produção
# NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-5771833523730319/9272101382

# IDs de teste do Google (sempre funcionam)
NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-3940256099942544/5224354917
```

**IDs de teste sempre mostram vídeos**, mesmo sem aprovação.

Depois de confirmar que funciona com IDs de teste, volte para os IDs de produção em 24-48h.

## Verificar no AdMob Console

1. Acessar: https://apps.admob.google.com/
2. Apps > Seu app > Unidades de anúncio
3. Verificar status do "Rewarded Video":
   - ✅ **Ativo**: Está servindo anúncios
   - ⏳ **Revisando**: Aguardando aprovação
   - ⚠️ **Limitado**: Problema de política

## Checklist de Validação

- [ ] App instalado (versão 16 com logs)
- [ ] Chrome DevTools conectado
- [ ] Tentou fazer backup/exportação
- [ ] Verificou logs no console
- [ ] Vídeo apareceu? Se não, qual erro?
- [ ] AdMob Console mostra unidade ativa?
- [ ] Testou com ID de teste?

## Próximos Passos

**Se aparecer "No Fill"**:
1. Use IDs de teste para validar que a integração funciona
2. Aguarde 24-48h para IDs de produção serem aprovados
3. Tente novamente com IDs de produção

**Se outro erro**:
- Compartilhe a mensagem de erro completa do console
- Verificar status no AdMob Console
