'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { Audit } from '@/types/audit';
import { LoggedDaysCalendar } from '@/components/audits/LoggedDaysCalendar';

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error('Failed to fetch audits');
  }

  return response.json();
};

export default function AuditsPage() {
  const { data: audits, error, mutate } = useSWR<Audit[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/audits`,
    fetcher
  );


  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const now = new Date();
  const [formData, setFormData] = useState({
    name: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    goal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAudit
        ? `${process.env.NEXT_PUBLIC_API_URL}/audits/${editingAudit.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/audits`;

      const res = await fetch(url, {
        method: editingAudit ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setEditingAudit(null);
        const now = new Date();
        setFormData({ name: '', month: now.getMonth() + 1, year: now.getFullYear(), goal: '' });
        mutate();
        toast.success(editingAudit ? 'Audit updated successfully!' : 'Audit created successfully!');
      } else {
        const error = await res.json();
        toast.error(error.message || `Failed to ${editingAudit ? 'update' : 'create'} audit`);
      }
    } catch (err) {
      toast.error(`Failed to ${editingAudit ? 'update' : 'create'} audit. Please try again.`);
    }
  };

  const handleEdit = (audit: Audit) => {
    setEditingAudit(audit);
    setFormData({
      name: audit.name,
      month: (audit as any).month || new Date(audit.startDate).getMonth() + 1,
      year: (audit as any).year || new Date(audit.startDate).getFullYear(),
      goal: audit.goal || '',
    });
    setShowCreateForm(true);
  };

  if (error) return <div className="p-8">Failed to load audits</div>;
  if (!audits) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Time Awareness Audits</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and analyze how you spend your time using the Eisenhower Matrix framework
          </p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Create Audit for Different Month
          </button>
        </div>

      {showCreateForm && (
        <div className="mb-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">{editingAudit ? 'Edit Audit' : 'Create New Audit'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Audit Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                placeholder={`Auto-generated: ${new Date(formData.year, formData.month - 1).toLocaleDateString('en-US', { month: 'long' })} ${formData.year} Audit`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to auto-generate based on month/year
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <select
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                  required
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <span className="font-semibold">Audit Period:</span>{' '}
                {new Date(formData.year, formData.month - 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' - '}
                {new Date(formData.year, formData.month, 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' '}
                ({new Date(formData.year, formData.month, 0).getDate()} days)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Goal (optional)</label>
              <textarea
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                placeholder="What do you hope to discover from this audit?"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingAudit ? 'Update Audit' : 'Create Audit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingAudit(null);
                  const now = new Date();
                  setFormData({ name: '', month: now.getMonth() + 1, year: now.getFullYear(), goal: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">All Audits</h2>
        {audits.map((audit, index) => {
          const isCurrentMonth = index === 0; // First audit is always current month (sorted desc)

          return (
            <div
              key={audit.id}
              className={`p-6 border rounded-lg ${
                isCurrentMonth
                  ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className={`text-xl font-semibold ${isCurrentMonth ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                      {audit.name}
                    </h3>
                    {isCurrentMonth && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
                        Current Month
                      </span>
                    )}
                    <button
                      onClick={() => handleEdit(audit)}
                      className="text-sm px-3 py-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <p className={`text-sm mt-1 ${isCurrentMonth ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()} ({audit.durationDays} days)
                  </p>
                  {audit.goal && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">{audit.goal}</p>
                  )}
                </div>
                <Link
                  href={`/audits/${audit.id}/log`}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    isCurrentMonth
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {isCurrentMonth ? 'Log Time →' : 'View →'}
                </Link>
              </div>

              {/* Show calendar for all audits */}
              <LoggedDaysCalendar
                auditId={audit.id}
                startDate={audit.startDate}
                endDate={audit.endDate}
              />
            </div>
          );
        })}

        {audits.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 italic">No audits yet. Start logging time to create your first audit!</p>
        )}
      </div>
    </div>
  );
}
