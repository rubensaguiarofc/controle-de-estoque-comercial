import { redirect } from 'next/navigation'

<<<<<<< HEAD
export default function LoginRedirect() {
	// Server-side redirect to avoid prerendering client-only login page
	redirect('/')
=======
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return null; // A página não exibirá nenhum conteúdo
>>>>>>> origin/main
}

