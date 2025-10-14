"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleSignIn from "../../components/googleSignIn";

// Toggle login availability via env var NEXT_PUBLIC_LOGIN_ENABLED (set to 'false' to disable)
const loginEnabled = process.env.NEXT_PUBLIC_LOGIN_ENABLED !== "false";

export default function LoginPage() {
  if (!loginEnabled) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-border dark:border-gray-700 text-foreground dark:text-gray-100 text-center">
          <h2 className="text-xl font-semibold text-primary dark:text-indigo-400 mb-2">Almoxarifado Fácil</h2>
          <h1 className="text-2xl font-bold text-foreground dark:text-white mb-4">Login temporariamente desativado</h1>
          <p className="text-muted-foreground dark:text-gray-300 mb-4">O acesso via e-mail/senha e Google está temporariamente desabilitado para manutenção.</p>
          <p className="text-sm text-muted-foreground dark:text-gray-500">Se precisar de acesso, contate o administrador.</p>
        </div>
      </div>
    );
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      showSnackbar("Por favor, preencha todos os campos.", true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showSnackbar(`Login realizado com sucesso! Bem-vindo(a), ${email}.`, false);
        // server sets cookie; navigate to app home
        router.push("/");
      } else {
        showSnackbar(data.error || "E-mail ou senha incorretos.", true);
      }
    } catch (e) {
      console.error(e);
      showSnackbar("Erro de conexão com o servidor.", true);
    } finally {
      setLoading(false);
    }
  }

  // Handle credentials from GoogleSignIn component
  async function handleGoogleCredential(response: any) {
    if (response?.credential) {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: response.credential }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          showSnackbar(`Login Google: Bem-vindo(a), ${data.user?.name || data.user?.email || 'Usuário'}!`, false);
          router.push("/");
        } else {
          showSnackbar(data.error || "Falha na autenticação com Google.", true);
        }
      } catch (e) {
        console.error("Erro ao autenticar com Google.", e);
        showSnackbar("Erro ao autenticar com Google.", true);
      }
    } else {
      showSnackbar("Falha ao obter credenciais do Google.", true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-xl shadow-2xl border border-border text-foreground">
        <h2 className="text-xl font-semibold text-primary text-center mb-4 dark:text-indigo-400">Almoxarifado Fácil</h2>
        <h1 className="text-3xl font-extrabold text-foreground text-center mb-2 dark:text-white">Bem-vindo(a)</h1>
        <p className="text-muted-foreground text-center mb-8 dark:text-gray-400">Faça login para continuar</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed dark:text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-500"
          >
            {loading ? "Carregando..." : "Entrar"}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground font-semibold dark:bg-gray-800 dark:text-gray-400">OU</span>
            </div>
          </div>

          {/* Google Sign In */}
          <div className="w-full">
            <GoogleSignIn onCredential={handleGoogleCredential} />
          </div>

          <div className="text-center mt-4">
            <a href="#" className="text-sm font-medium text-primary hover:opacity-90 dark:text-indigo-400">
              Esqueceu sua senha?
            </a>
          </div>
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
  