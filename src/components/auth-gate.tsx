"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const loginEnabled = useMemo(() => process.env.NEXT_PUBLIC_LOGIN_ENABLED !== "false", []);

  // If login is globally disabled, bypass auth and show content directly
  if (!loginEnabled) {
    return <>{children}</>;
  }

  useEffect(() => {
    if (!loading && !user) {
      // If not authenticated, send to login page (works in web and static APK)
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!user) return null; // Redirecting
  return <>{children}</>;
}

export default AuthGate;
