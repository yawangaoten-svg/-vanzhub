'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthPage from '@/components/AuthPage';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-brand animate-pulse" />
          <div className="text-lg font-semibold gradient-text">VANZHUB</div>
          <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-gradient-brand rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (user) return null;

  return <AuthPage />;
}
