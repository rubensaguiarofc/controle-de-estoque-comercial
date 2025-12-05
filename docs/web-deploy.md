# Deploy Web (Next.js server)

Este app foi ajustado para rodar em modo servidor na web e continuar com export estático nos builds móveis.

## Como rodar em desenvolvimento (web)

```bash
npm run dev:web
```

## Como buildar e iniciar em produção (web)

```bash
npm run build:web
npm run start:web
```

Isso executa Next.js em modo servidor (com API routes ativas), útil para hospedagem em Vercel, Render, Railway ou servidor próprio.

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha os campos do Firebase e Google.

- NEXT_OUTPUT_EXPORT=false ativa o modo servidor.
- NEXT_PUBLIC_FIREBASE_* conforme seu projeto Firebase.
- NEXT_PUBLIC_GOOGLE_CLIENT_ID e GOOGLE_CLIENT_ID para login Google.

## Hospedagem recomendada
- Vercel: conecte o repositório, configure as variáveis de ambiente, build automático com `NEXT_OUTPUT_EXPORT=false`.
- Alternativas: Render, Railway, ou VPS com Node 18+.

## Observações
- Para builds Android/iOS, mantenha o fluxo atual com `npm run export:capacitor`.
- No web, as rotas API em `src/app/api/*` ficam disponíveis normalmente.
