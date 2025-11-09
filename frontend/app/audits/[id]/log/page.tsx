'use client';

import { useState, use } from 'react';
import useSWR from 'swr';
import { Audit, DayEntries, ActivityTemplate, getQuadrant, QUADRANT_INFO } from '@/types/audit';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    activityDescription: '',
    isImportant: false,
    isUrgent: false,
    notes: '',
  });

  const { data: audit } = useSWR<Audit>(
    `${process.env.NEXT_PUBLIC_API_URL}/audits/${id}`,
    fetcher
  );

  const { data: dayData, mutate } = useSWR<DayEntries>(
    selectedDate
      ? `${process.env.NEXT_PUBLIC_API_URL}/time-entries/audit/${id}/day/${selectedDate}`
      : null,
    fetcher
  );

  const { data: templates } = useSWR<ActivityTemplate[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/templates`,
    fetcher
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHour === null) return;

    try {
      const url = editingEntryId
        ? `${process.env.NEXT_PUBLIC_API_URL}/time-entries/${editingEntryId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/time-entries`;

      const res = await fetch(url, {
        method: editingEntryId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingEntryId
            ? formData 
            : {
                auditId: id,
                date: selectedDate,
                hourSlot: selectedHour,
                ...formData,
                durationMinutes: 60,
              }
        ),
      });

      if (res.ok) {
        setSelectedHour(null);
        setEditingEntryId(null);
        setFormData({ activityDescription: '', isImportant: false, isUrgent: false, notes: '' });
        mutate(); // Refresh the day's data
      } else {
        const error = await res.json();
        alert(error.message || `Failed to ${editingEntryId ? 'update' : 'create'} entry`);
      }
    } catch (err) {
      alert(`Failed to ${editingEntryId ? 'update' : 'create'} entry`);
    }
  };

  const useTemplate = (template: ActivityTemplate) => {
    setFormData({
      activityDescription: template.name,
      isImportant: template.isImportant,
      isUrgent: template.isUrgent,
      notes: '',
    });
  };

  const handleEditEntry = (entry: any) => {
    setSelectedHour(entry.hourSlot);
    setEditingEntryId(entry.id);
    setFormData({
      activityDescription: entry.activityDescription,
      isImportant: entry.isImportant,
      isUrgent: entry.isUrgent,
      notes: entry.notes || '',
    });
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/time-entries/${entryId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        mutate();
      } else {
        alert('Failed to delete entry');
      }
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  if (!audit || !dayData) return <div className="p-8">Loading...</div>;

  const quadrant = getQuadrant(formData.isImportant, formData.isUrgent);
  const quadrantInfo = QUADRANT_INFO[quadrant];

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{audit.name}</h1>
        <div className="flex gap-4 items-center">
          <label className="font-medium">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={audit.startDate.split('T')[0]}
            max={audit.endDate.split('T')[0]}
            className="px-3 py-2 border rounded bg-white dark:bg-gray-800"
          />
          <span className="text-sm text-gray-600">
            {dayData.entries.length} / 24 hours logged
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">24-Hour Timeline</h2>
          <div className="space-y-2">
            {Array.from({ length: 24 }, (_, i) => {
              const entry = dayData.entries.find((e) => e.hourSlot === i);
              const quadrant = entry
                ? getQuadrant(entry.isImportant, entry.isUrgent)
                : null;
              const info = quadrant ? QUADRANT_INFO[quadrant] : null;

              return (
                <div
                  key={i}
                  className={`p-4 border rounded transition ${
                    selectedHour === i
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : entry
                      ? quadrant === 1
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : quadrant === 2
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : quadrant === 3
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                        : 'border-gray-500 bg-gray-50 dark:bg-gray-900'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                  }`}
                  onClick={() => !entry && setSelectedHour(i)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="font-mono font-semibold">
                        {i.toString().padStart(2, '0')}:00
                      </span>
                      {entry ? (
                        <div className="ml-4 inline-block">
                          <span className="font-medium">{entry.activityDescription}</span>
                          <span
                            className={`ml-2 text-xs px-2 py-1 rounded ${
                              quadrant === 1
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : quadrant === 2
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : quadrant === 3
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {info?.label}
                          </span>
                        </div>
                      ) : (
                        <span className="ml-4 text-gray-400 dark:text-gray-500">Empty</span>
                      )}
                    </div>
                    {entry && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(entry);
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form - Modal on mobile, Sidebar on desktop */}
        {selectedHour !== null && (
          <>
            {/* Mobile overlay backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => {
                setSelectedHour(null);
                setEditingEntryId(null);
                setFormData({ activityDescription: '', isImportant: false, isUrgent: false, notes: '' });
              }}
            />

            {/* Form container - Modal on mobile, Sidebar on desktop */}
            <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t-2 border-primary rounded-t-2xl max-h-[85vh] overflow-y-auto lg:static lg:border-0 lg:rounded-none lg:max-h-none lg:overflow-visible shadow-2xl lg:shadow-none">
              {/* Mobile drag handle indicator */}
              <div className="flex justify-center pt-3 pb-2 lg:hidden">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              <div className="sticky top-0 bg-background border-b lg:border-0 px-6 py-4 lg:px-0 lg:py-0 lg:mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {editingEntryId
                      ? `Edit Hour ${selectedHour.toString().padStart(2, '0')}:00`
                      : `Log Hour ${selectedHour.toString().padStart(2, '0')}:00`}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHour(null);
                      setEditingEntryId(null);
                      setFormData({ activityDescription: '', isImportant: false, isUrgent: false, notes: '' });
                    }}
                    className="lg:hidden text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 lg:px-0 lg:pb-0">
                <div>
                  <label className="block text-sm font-medium mb-2">Quick Templates</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {templates?.slice(0, 6).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => useTemplate(t)}
                        className="text-sm px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title={t.description}
                      >
                        {t.icon} {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Activity</label>
                  <input
                    type="text"
                    value={formData.activityDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, activityDescription: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                    placeholder="What did you do?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isImportant}
                      onChange={(e) =>
                        setFormData({ ...formData, isImportant: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Important to your goals?</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isUrgent}
                      onChange={(e) =>
                        setFormData({ ...formData, isUrgent: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Urgent/Time-sensitive?</span>
                  </label>
                </div>

                <div className="p-3 rounded bg-gray-100 dark:bg-gray-800">
                  <p className="text-sm font-semibold">Quadrant: {quadrantInfo.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{quadrantInfo.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingEntryId ? 'Update Entry' : 'Log Hour'}
                  </button>
                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntryId(null);
                        setSelectedHour(null);
                        setFormData({ activityDescription: '', isImportant: false, isUrgent: false, notes: '' });
                      }}
                      className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}

        {/* Desktop placeholder when no hour selected */}
        {selectedHour === null && (
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Select an hour</h2>
              <p className="text-sm text-muted-foreground">Click on any empty hour slot to log your activity, or click Edit on an existing entry to modify it.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
