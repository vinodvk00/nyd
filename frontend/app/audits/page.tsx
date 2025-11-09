'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Audit } from '@/types/audit';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuditsPage() {
  const { data: audits, error, mutate } = useSWR<Audit[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/audits`,
    fetcher
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    durationDays: 7,
    goal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({ name: '', startDate: '', durationDays: 7, goal: '' });
        mutate();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to create audit');
      }
    } catch (err) {
      alert('Failed to create audit');
    }
  };

  if (error) return <div className="p-8">Failed to load audits</div>;
  if (!audits) return <div className="p-8">Loading...</div>;

  const activeAudit = audits.find((a) => a.status === 'active');

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Time Awareness Audits</h1>
        {!activeAudit && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Start New Audit
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">Create New Audit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Audit Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                placeholder="e.g., November 2024 Time Audit"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <select
                value={formData.durationDays}
                onChange={(e) =>
                  setFormData({ ...formData, durationDays: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
              >
                <option value={7}>7 days</option>
                <option value={10}>10 days</option>
              </select>
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
                Create Audit
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeAudit && (
        <div className="mb-8 p-6 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-blue-900 dark:text-blue-100">{activeAudit.name}</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {new Date(activeAudit.startDate).toLocaleDateString()} - {new Date(activeAudit.endDate).toLocaleDateString()}
              </p>
              {activeAudit.goal && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">{activeAudit.goal}</p>
              )}
            </div>
            <Link
              href={`/audits/${activeAudit.id}/log`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Log Time →
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Past Audits</h2>
        {audits
          .filter((a) => a.status !== 'active')
          .map((audit) => (
            <div key={audit.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{audit.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(audit.startDate).toLocaleDateString()} -{' '}
                    {new Date(audit.endDate).toLocaleDateString()} ({audit.durationDays} days)
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      audit.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {audit.status}
                  </span>
                </div>
                <Link
                  href={`/audits/${audit.id}/log`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}

        {audits.filter((a) => a.status !== 'active').length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 italic">No past audits yet</p>
        )}
      </div>
    </div>
  );
}
