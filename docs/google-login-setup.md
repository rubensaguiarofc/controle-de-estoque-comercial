# Login com Google (Web e Android)

Este app suporta:
- Web/PWA: Google Identity Services (GIS)
- Android (APK): Login nativo via `@capacitor-firebase/authentication`

## 1) Web/PWA
1. No Google Cloud Console, crie um OAuth Client do tipo "Web application".
2. Copie o Client ID e adicione no arquivo `.env.local`:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - (opcional server) `GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxx.apps.googleusercontent.com`
3. Em Credenciais, inclua `Authorized JavaScript origins` (ex.: `http://localhost:3003`).
4. (Opcional) No Firebase Console, ative o provedor Google em Authentication.

A tela `src/app/login/page.tsx` já renderiza o botão e envia o `idToken` para `/api/auth/google`.

## 2) Android (APK)
1. No Google Cloud, crie um OAuth Client do tipo "Android" (package: `com.rubensaguiarofc.controleestoque` e SHA-1/SHA-256 do keystore).
2. Baixe `google-services.json` do seu projeto Firebase (mesmo projeto do app) e coloque em `android/app/google-services.json`.
3. O projeto já tem o classpath do Google Services e aplica o plugin automaticamente se o arquivo existir.
4. O plugin `@capacitor-firebase/authentication@6` já está instalado. Para sincronizar:
   - `npx cap sync android`
5. Recompile o APK (`./android/gradlew.bat assembleDebug`).

Fluxo:
- No Android, o botão "Entrar com Google (Android)" chama o plugin nativo, obtém `idToken` e envia para `/api/auth/google` (que valida o token e cria cookie).

## Observações
- Para produção, gere keystore release e cadastre o SHA-1/SHA-256 release no client Android do Google Cloud.
- Se precisar do usuário também autenticado no Firebase Web SDK, é possível integrar usando `signInWithCredential` no cliente (opcional).
