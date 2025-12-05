"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleSignIn from "../../components/googleSignIn";
import { Capacitor } from "@capacitor/core";
import { signInWithGoogleNative } from "@/lib/auth/google-native";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useAuth } from "@/firebase/provider";

// Toggle login availability via env var NEXT_PUBLIC_LOGIN_ENABLED (set to 'false' to disable)
const loginEnabled = process.env.NEXT_PUBLIC_LOGIN_ENABLED !== "false";
// Toggle ONLY Google login via env var NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED (set to 'false' to hide Google buttons)
const googleLoginEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED !== "false";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  // If login is disabled, immediately send user to home
  useEffect(() => {
    if (!loginEnabled) router.replace("/");
  }, []);
  if (!loginEnabled) return null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Toggle entre login e criar conta
  const [loading, setLoading] = useState(false);
  const snackbarRef = useRef<HTMLDivElement | null>(null);

  function showSnackbar(message: string, isError = false) {
    const el = snackbarRef.current;
    if (!el) return;
    el.textContent = message;
    // use design tokens for snackbar backgrounds
    el.classList.remove("bg-destructive", "bg-primary", "bg-card");
    el.classList.add(isError ? "bg-destructive" : "bg-primary");
    el.classList.remove("opacity-0", "pointer-events-none");
    el.classList.add("opacity-100");
    setTimeout(() => {
      el.classList.remove("opacity-100");
      el.classList.add("opacity-0", "pointer-events-none");
    }, 3000);
  }

  // router already defined above

  async function handleSignUp() {
    if (!email || !password || !confirmPassword) {
      showSnackbar("Por favor, preencha todos os campos.", true);
      return;
    }
    if (password !== confirmPassword) {
      showSnackbar("As senhas não coincidem.", true);
      return;
    }
    if (password.length < 6) {
      showSnackbar("A senha deve ter no mínimo 6 caracteres.", true);
      return;
    }
    
    setLoading(true);
    try {
      // Criar conta usando Firebase Auth diretamente (funciona em static export)
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      if (auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        showSnackbar(`Conta criada com sucesso! Bem-vindo(a), ${email}.`, false);
        router.push("/");
      } else {
        showSnackbar("Erro ao conectar com o sistema de autenticação.", true);
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/email-already-in-use") {
        showSnackbar("Este e-mail já está cadastrado.", true);
      } else if (e.code === "auth/invalid-email") {
        showSnackbar("E-mail inválido.", true);
      } else if (e.code === "auth/weak-password") {
        showSnackbar("Senha muito fraca. Use pelo menos 6 caracteres.", true);
      } else {
        showSnackbar("Erro ao criar conta. Tente novamente.", true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      showSnackbar("Por favor, preencha todos os campos.", true);
      return;
    }
    setLoading(true);
    try {
      // Login usando Firebase Auth diretamente (funciona em static export)
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      if (auth) {
        await signInWithEmailAndPassword(auth, email, password);
        showSnackbar(`Login realizado com sucesso! Bem-vindo(a), ${email}.`, false);
        router.push("/");
      } else {
        showSnackbar("Erro ao conectar com o sistema de autenticação.", true);
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found") {
        showSnackbar("E-mail ou senha incorretos.", true);
      } else if (e.code === "auth/invalid-email") {
        showSnackbar("E-mail inválido.", true);
      } else if (e.code === "auth/user-disabled") {
        showSnackbar("Esta conta foi desativada.", true);
      } else if (e.code === "auth/too-many-requests") {
        showSnackbar("Muitas tentativas. Tente novamente mais tarde.", true);
      } else {
        showSnackbar("Erro ao fazer login. Verifique suas credenciais.", true);
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle credentials from GoogleSignIn component
  async function handleGoogleCredential(response: any) {
    if (response?.credential) {
      try {
        // 1) Autenticar no Firebase Web SDK (válido no browser e no APK)
        try {
          if (auth) {
            const cred = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, cred);
          }
        } catch (e) {
          console.warn("Falha ao autenticar no Firebase com GIS", e);
        }

        // 2) Backend opcional: em dev server local, a rota /api existe; no APK, ignorar erros
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          const url = backendUrl ? `${backendUrl}/api/auth/google` : `/api/auth/google`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: response.credential }),
          });
          if (!res.ok) {
            try { const err = await res.json(); console.warn('Backend auth falhou (web GIS):', err); } catch {}
          }
        } catch (e) {
          // Em APK (static export), esta rota não existe; tudo bem seguir sem backend
          console.debug('Ignorando falha ao contactar backend em ambiente sem API');
        }

        showSnackbar(`Login Google: Bem-vindo(a)!`, false);
        router.push("/");
      } catch (e) {
        console.error("Erro ao autenticar com Google.", e);
        showSnackbar("Erro ao autenticar com Google.", true);
      }
    } else {
      showSnackbar("Falha ao obter credenciais do Google.", true);
    }
  }

  async function handleGoogleNative() {
    try {
      const native = await signInWithGoogleNative();
      if (!native.ok || !native.idToken) {
        const msg = native.error ? `Falha no login Google (Android): ${native.error}` : "Falha no login Google (Android).";
        showSnackbar(msg, true);
        return;
      }
      // 1) Tentar autenticar também no Firebase Web SDK (sem depender de backend)
      try {
        if (auth) {
          const cred = GoogleAuthProvider.credential(native.idToken, native.accessToken);
          await signInWithCredential(auth, cred);
        }
      } catch (e) {
        console.warn("Falha ao vincular login nativo ao Firebase Web SDK", e);
      }

      // 2) Se houver backend configurado, chamar para criar sessão (opcional)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: native.idToken }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            console.warn("Backend auth falhou:", data?.error || res.statusText);
          }
        } catch (e) {
          console.warn("Não foi possível contactar o backend para criar sessão.", e);
        }
      }

      // Sucesso local: seguir para a home
      showSnackbar(`Login Google: Bem-vindo(a)!`, false);
      router.push("/");
    } catch (e) {
      console.error("Erro Google nativo", e);
      showSnackbar("Erro ao autenticar com Google (Android).", true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-xl shadow-2xl border border-border text-foreground">
        <h2 className="text-xl font-semibold text-primary text-center mb-4 dark:text-indigo-400">Almoxarifado Fácil</h2>
        <h1 className="text-3xl font-extrabold text-foreground text-center mb-2 dark:text-white">
          {isSignUp ? "Criar Conta" : "Bem-vindo(a)"}
        </h1>
        <p className="text-muted-foreground text-center mb-8 dark:text-gray-400">
          {isSignUp ? "Preencha os dados para criar sua conta" : "Faça login para continuar"}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            isSignUp ? handleSignUp() : handleLogin();
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1 dark:text-gray-300">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="mt-1 block w-full px-4 py-2 border border-input rounded-lg shadow-sm focus:outline-none focus:ring-ring focus:border-primary transition duration-150 ease-in-out bg-card text-foreground"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1 dark:text-gray-300">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-4 py-2 border border-input rounded-lg shadow-sm focus:outline-none focus:ring-ring focus:border-primary transition duration-150 ease-in-out bg-card text-foreground"
            />
            {isSignUp && (
              <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
            )}
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1 dark:text-gray-300">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-4 py-2 border border-input rounded-lg shadow-sm focus:outline-none focus:ring-ring focus:border-primary transition duration-150 ease-in-out bg-card text-foreground"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed dark:text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-500"
          >
            {loading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
          </button>

          {/* Toggle entre Login e Criar Conta */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-sm font-medium text-primary hover:opacity-90 dark:text-indigo-400"
            >
              {isSignUp ? "Já tem uma conta? Entrar" : "Não tem conta? Criar agora"}
            </button>
          </div>

          {!isSignUp && (
            <div className="text-center mt-4">
              <a href="#" className="text-sm font-medium text-primary hover:opacity-90 dark:text-indigo-400">
                Esqueceu sua senha?
              </a>
            </div>
          )}
        </form>

        <div className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border dark:border-gray-700">
          &copy; 2025 Alternativa Solcutions. Todos os direitos reservados.
        </div>
      </div>

      <div
        id="snackbar"
        ref={snackbarRef}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card text-foreground px-6 py-3 rounded-lg shadow-xl opacity-0 transition-opacity duration-300 z-50 pointer-events-none dark:bg-gray-700 dark:text-white"
      >
        Mensagem de Retorno
      </div>
    </div>
  );
}
  