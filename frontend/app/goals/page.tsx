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

      <GoalsManagement />
    </div>
  );
}
