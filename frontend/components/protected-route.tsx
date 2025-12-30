"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/verify'];
const AUTH_ONLY_ROUTES = ['/login', '/register', '/forgot-password'];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isPublicRoute(pathname)) {
        router.replace('/login');
      } else if (isAuthenticated && isAuthOnlyRoute(pathname)) {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return null;
  }

  if (isAuthenticated && isAuthOnlyRoute(pathname)) {
    return null;
  }

  return <>{children}</>;
}
