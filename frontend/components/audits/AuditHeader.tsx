"use client";

import { MoreVertical, BarChart2, Edit2, Trash2, Download, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Audit } from '@/types/audit';

interface AuditHeaderProps {
  audit: Audit;
  currentView?: 'log' | 'analytics';
  onViewChange?: (view: 'log' | 'analytics') => void;
  onComplete?: () => void;
  onAbandon?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export function AuditHeader({
  audit,
  currentView,
  onViewChange,
  onComplete,
  onAbandon,
  onEdit,
  onDelete,
  onExport,
}: AuditHeaderProps) {
  const totalExpectedHours = audit.durationDays * 24;
  const stats = (audit as any).stats;
  const hoursLogged = stats?.hoursLogged || 0;
  const completionPercentage = stats?.completionPercentage || 0;

  const now = new Date();
  const endDate = new Date(audit.endDate);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const statusColor =
    audit.status === 'active' ? 'bg-info/20 text-info border-info/30' :
    audit.status === 'completed' ? 'bg-success/20 text-success border-success/30' :
    'bg-muted text-muted-foreground';

  return (
    <div className="space-y-4 pb-6 border-b">
      {/* Title Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
          <BarChart2 className="h-6 w-6 sm:h-8 sm:w-8 text-info shrink-0 mt-1 sm:mt-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold break-words">{audit.name}</h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm text-muted-foreground">
              <span className="whitespace-nowrap">
                {new Date(audit.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {new Date(audit.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {audit.status === 'active' && daysRemaining > 0 && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>{daysRemaining}d left</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Badge className={`${statusColor} text-xs sm:text-sm`}>
            {audit.status.toUpperCase()}
          </Badge>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onViewChange && currentView && (
                <>
                  <DropdownMenuItem onClick={() => onViewChange(currentView === 'log' ? 'analytics' : 'log')}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    <span>
                      {currentView === 'log' ? 'View Analytics' : 'View Log'}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {audit.status === 'active' && onComplete && (
                <DropdownMenuItem onClick={onComplete}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Complete Audit</span>
                </DropdownMenuItem>
              )}

              {audit.status === 'active' && onAbandon && (
                <DropdownMenuItem onClick={onAbandon}>
                  <XCircle className="mr-2 h-4 w-4" />
                  <span>Abandon Audit</span>
                </DropdownMenuItem>
              )}

              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Export Data</span>
                </DropdownMenuItem>
              )}

              {(audit.status === 'active' && onComplete || onExport) && (onEdit || onDelete) && (
                <DropdownMenuSeparator />
              )}

              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span>Edit Details</span>
                </DropdownMenuItem>
              )}

              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Audit</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {Math.round(completionPercentage)}% Complete
          </span>
          <span className="text-muted-foreground">
            {hoursLogged.toFixed(1)} / {totalExpectedHours}h
          </span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Goal (if provided) */}
      {audit.goal && (
        <div className="text-sm text-muted-foreground italic">
          <span className="font-medium text-foreground">Goal:</span> {audit.goal}
        </div>
      )}
    </div>
  );
}
