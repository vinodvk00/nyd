"use client"

import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { AppShell } from './AppShell';

const EXCLUDED_ROUTES = ['/login', '/register', '/', '/forgot-password', '/reset-password', '/auth/verify'];

interface ConditionalAppShellProps {
  children: React.ReactNode;
}

export function ConditionalAppShell({ children }: ConditionalAppShellProps) {
  const pathname = usePathname();
  const shouldShowAppShell = !EXCLUDED_ROUTES.includes(pathname);

  if (!shouldShowAppShell) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  );
}
