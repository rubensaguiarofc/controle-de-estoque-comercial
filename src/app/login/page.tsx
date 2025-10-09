
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return null; // A página não exibirá nenhum conteúdo
}
