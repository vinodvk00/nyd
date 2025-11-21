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

  // Status badge variant
  const statusVariant =
    audit.status === 'active' ? 'default' :
    audit.status === 'completed' ? 'secondary' :
    'outline';

  const statusColor =
    audit.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
    audit.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

  return (
    <div className="space-y-4 pb-6 border-b">
      {/* Title Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">{audit.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {new Date(audit.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' - '}
                {new Date(audit.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {audit.status === 'active' && daysRemaining > 0 && (
                <>
                  <span>•</span>
                  <span>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={statusColor}>
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
                <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
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
          <span className="text-gray-600 dark:text-gray-400">
            {Math.round(completionPercentage)}% Complete
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {hoursLogged.toFixed(1)} / {totalExpectedHours}h
          </span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Goal (if provided) */}
      {audit.goal && (
        <div className="text-sm text-gray-600 dark:text-gray-400 italic">
          <span className="font-medium text-gray-900 dark:text-gray-100">Goal:</span> {audit.goal}
        </div>
      )}
    </div>
  );
}
