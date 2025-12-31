"use client"

import { Menu, Plus } from 'lucide-react';
import { useSidebar } from '@/contexts/sidebar-context';
import { useHeader } from '@/contexts/header-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { toast } from 'sonner';

export function StatusBar() {
  const { toggle, isMobile } = useSidebar();
  const { breadcrumbs, leftActions, rightActions } = useHeader();

  const hasBreadcrumbs = breadcrumbs.length > 0;
  const hasLeftActions = !!leftActions;
  const hasRightActions = !!rightActions;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-full items-center px-6 gap-3">
          {/* Left: Hamburger (mobile) + Breadcrumbs + Left Actions */}
          <div className="flex items-center gap-3 min-w-0">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label="Toggle sidebar"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {hasBreadcrumbs && (
              <Breadcrumb items={breadcrumbs} />
            )}
            {hasLeftActions && (
              <>
                {hasBreadcrumbs && <div className="h-6 w-px bg-border" />}
                {leftActions}
              </>
            )}
          </div>

          {/* Right: Page Right Actions + Global Actions */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {hasRightActions && (
              <>
                {rightActions}
                <div className="h-6 w-px bg-border" />
              </>
            )}

            <Button
              onClick={() => toast.info('Quick Log coming soon!')}
              size="sm"
              variant="outline"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Log</span>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
