"use client"

import { Menu, Plus } from 'lucide-react';
import { useSidebar } from '@/contexts/sidebar-context';
import { useHeader } from '@/contexts/header-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
        <div className="flex h-full items-center px-3 sm:px-6 gap-2 sm:gap-3">
          {/* Left: Hamburger (mobile) + Breadcrumbs + Left Actions */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
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
              <div className="min-w-0 overflow-hidden">
                <Breadcrumb items={breadcrumbs} />
              </div>
            )}
            {hasLeftActions && (
              <>
                {hasBreadcrumbs && <div className="h-6 w-px bg-border shrink-0" />}
                <div className="shrink-0">{leftActions}</div>
              </>
            )}
          </div>

          {/* Right: Page Right Actions + Global Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            {hasRightActions && (
              <>
                {rightActions}
                <div className="h-6 w-px bg-border" />
              </>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => toast.info('Quick Log coming soon!')}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Quick Log</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick log time entry</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
