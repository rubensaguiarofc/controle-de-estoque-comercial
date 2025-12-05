# Internal testing (Google Play Console)

Use este guia para publicar rapidamente a versão 11 no canal de Teste interno.

## Pré‑requisitos
- AAB pronto: `android/app/build/outputs/bundle/release/app-release.aab`
- Keystore de upload igual à cadastrada no Play App Signing
- Ícones, descrição e política de privacidade já configurados no app (Play Console)

## Passo a passo
1) Acesse Play Console → Seu app → Teste → Teste interno → Criar nova versão
2) Upload do `app-release.aab`
3) Notas da versão: copie de `docs/playstore/release-notes-v11.md`
4) Selecionar testadores:
   - Via e-mails: importe `docs/playstore/internal-testers-template.csv` (uma coluna `email`)
   - Ou crie um grupo do Google com os testadores e vincule no Console
5) Salvar e enviar para revisão. Aguarde processamento (assinatura/verificação)
6) Copie o link de participação (opt-in) e compartilhe com os testadores

## Checklist de conformidade
- Classificação de conteúdo preenchida (Questionário)
- Segurança de dados (Data Safety) atualizada
- Políticas → Conteúdo do app (ex.: Permissões, Ads/Ad ID, Política de privacidade)
- Avisos: se houver, resolva antes do envio para produção

## Dicas
- Use Teste Interno para validar rápido (liberação imediata após processamento)
- Depois promova a mesma versão para Teste fechado/aberto ou Produção
- Guarde o `mapping.txt` (proguard) para analisar crashes: `android/app/build/outputs/mapping/release/mapping.txt`
