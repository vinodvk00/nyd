"use client"

import { useSidebar } from '@/contexts/sidebar-context';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isMobile, isOpen, close } = useSidebar();

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Sidebar - Full height, fixed on desktop */}
      <Sidebar />

      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
          aria-label="Close sidebar"
        />
      )}

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="h-full lg:ml-60 flex flex-col">
        {/* StatusBar - Fixed at top, starts after sidebar on desktop */}
        <StatusBar />

        {/* Main Content Area - scrollbar-gutter prevents layout shift */}
        <main className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
