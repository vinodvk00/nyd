"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, FileText, Clock, BarChart3, Folder, Plane, Wrench, ChevronDown, ChevronRight, Settings, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/sidebar-context';
import { useCurrentAudit } from '@/hooks/useCurrentAudit';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PILOT_COLOR = '#22c55e';   // green-500
const PLANE_COLOR = '#3b82f6';   // blue-500
const ENGINEER_COLOR = '#a855f7'; // purple-500

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultExpanded?: boolean;
}

function UserSection({ onNavClick }: { onNavClick: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="border-t px-3 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 px-2 py-2 text-sm rounded-lg hover:bg-foreground/5 cursor-pointer transition-colors focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium truncate">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-foreground/5">
            <Link href="/settings" onClick={onNavClick}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              onNavClick();
              logout();
            }}
            className="text-destructive focus:text-destructive focus:bg-foreground/5 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobile, close } = useSidebar();
  const { data: currentAudit } = useCurrentAudit();

  const logTimeHref = currentAudit
    ? `/audits/${currentAudit.id}/log`
    : '/audits';

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nyd-sidebar-expanded');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {}
      }
    }
    return new Set(['PILOT', 'PLANE', 'ENGINEER']);
  });

  useEffect(() => {
    localStorage.setItem('nyd-sidebar-expanded', JSON.stringify(Array.from(expandedSections)));
  }, [expandedSections]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const sections: NavSection[] = [
    {
      title: 'PILOT',
      color: PILOT_COLOR,
      icon: Target,
      defaultExpanded: true,
      items: [
        { label: 'Goals', href: '/goals', icon: Target },
      ],
    },
    {
      title: 'PLANE',
      color: PLANE_COLOR,
      icon: Plane,
      defaultExpanded: true,
      items: [
        { label: 'Audits', href: '/audits', icon: FileText },
        { label: 'Log Time', href: logTimeHref, icon: Clock },
      ],
    },
    {
      title: 'ENGINEER',
      color: ENGINEER_COLOR,
      icon: Wrench,
      defaultExpanded: true,
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { label: 'Projects', href: '/projects', icon: Folder },
      ],
    },
  ];

  const getActiveSection = (path: string): string | null => {
    if (path.startsWith('/goals')) return 'PILOT';
    if (path.startsWith('/audits') || path.includes('/log')) return 'PLANE';
    if (path.startsWith('/dashboard') || path.startsWith('/projects')) return 'ENGINEER';
    return null;
  };

  const activeSection = getActiveSection(pathname);

  const sidebarClasses = cn(
    "w-60 border-r bg-background transition-transform duration-300 ease-in-out overflow-y-auto",
    isMobile
      ? "fixed left-0 top-0 bottom-0 z-50"
      : "fixed left-0 top-0 bottom-0",
    isMobile && !isOpen && "-translate-x-full"
  );

  const handleNavClick = () => {
    if (isMobile) close();
  };

  return (
    <aside className={sidebarClasses}>
      <nav className="flex flex-col h-full">
        {/* Brand Logo - Header Area */}
        <Link
          href="/dashboard"
          className="flex items-center px-6 py-4 border-b hover:bg-accent/50 transition-colors"
          onClick={handleNavClick}
        >
          <h1 className="text-2xl font-bold">NYD</h1>
        </Link>

        {/* Navigation Sections - Scrollable Content */}
        <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto min-h-0">
          {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            {/* Section Header - Clickable to collapse/expand */}
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-all duration-300 group"
            >
              <div className="flex items-center gap-2">
                {/* Section Icon - shows with color when active */}
                <span
                  className={cn(
                    "transition-all duration-300 flex items-center",
                    activeSection === section.title ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )}
                  style={activeSection === section.title ? { color: section.color } : undefined}
                >
                  <section.icon className="h-4 w-4" />
                </span>

                {/* Section Label */}
                <span
                  className={cn(
                    "transition-colors duration-300",
                    activeSection === section.title ? "" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  style={{ color: activeSection === section.title ? section.color : undefined }}
                >
                  {section.title}
                </span>
              </div>

              {/* Collapse indicator */}
              {expandedSections.has(section.title) ? (
                <ChevronDown className={cn(
                  "h-3 w-3 transition-all duration-300",
                  activeSection === section.title ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                )} />
              ) : (
                <ChevronRight className={cn(
                  "h-3 w-3 transition-all duration-300",
                  activeSection === section.title ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                )} />
              )}
            </button>

            {/* Section Links - Collapsible with animation */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                expandedSections.has(section.title)
                  ? "max-h-96 opacity-100 mt-1"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 pl-6 pr-2 py-2 text-sm transition-all duration-300 rounded-lg",
                        isActive
                          ? "bg-black/4 dark:bg-white/12 backdrop-blur-xl font-medium shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <span
                        className="flex items-center"
                        style={isActive ? { color: section.color } : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0 transition-all duration-300" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        </div>

        {/* User Section - Fixed at Bottom */}
        <UserSection onNavClick={handleNavClick} />
      </nav>
    </aside>
  );
}
