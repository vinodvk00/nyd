"use client";

import { Edit3, BarChart2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ViewToggleProps {
  currentView: 'log' | 'analytics';
  onViewChange: (view: 'log' | 'analytics') => void;
  disabled?: boolean;
}

export function ViewToggle({ currentView, onViewChange, disabled = false }: ViewToggleProps) {
  return (
    <Tabs value={currentView} onValueChange={(value) => onViewChange(value as 'log' | 'analytics')}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="log" disabled={disabled} className="gap-2">
          <Edit3 className="h-4 w-4" />
          <span>Log Time</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" disabled={disabled} className="gap-2">
          <BarChart2 className="h-4 w-4" />
          <span>Analytics</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
