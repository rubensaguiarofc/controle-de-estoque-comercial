"use client";

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
          <CardDescription>Faça login com sua conta Google para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full" disabled={loading}>
            {loading ? 'Carregando...' : (
              <>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c73 0 135.3 29.7 181.5 77.3L386.5 129.5c-36.2-34.1-85.2-55.3-142.5-55.3-108.5 0-196.8 88.5-196.8 197.8s88.3 197.8 196.8 197.8c119.3 0 168.3-95.2 175.5-144.9H244v-85.3h238.9c2.9 15.3 4.5 31.1 4.5 47.9z"></path></svg>
                Entrar com o Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
