"use client"

import { GoalsManagement } from '@/app/dashboard/components/goals-management';

export default function GoalsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Goals</h1>
        <p className="text-muted-foreground mt-2">
          Define who you want to become and track your progress
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg">
        <span className="font-medium">Under Development</span>
        <span className="text-amber-600/80 dark:text-amber-400/80">— This feature is being actively built. Some functionality may be limited.</span>
      </div>

      <GoalsManagement />
    </div>
  );
}
