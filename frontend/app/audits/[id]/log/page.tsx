'use client';

import { useState, use, useEffect } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Audit, DayEntries, ActivityTemplate, getQuadrant, QUADRANT_INFO } from '@/types/audit';
import { GlobalHeader } from '@/components/navigation/GlobalHeader';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    throw new Error('Failed to fetch');
  }

  return response.json();
};

export default function LogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [showDateNav, setShowDateNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
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

  // Fetch all entries for this audit to get dates with data
  const { data: allEntries } = useSWR<any[]>(
    audit ? `${process.env.NEXT_PUBLIC_API_URL}/time-entries/audit/${id}` : null,
    fetcher
  );

  // Get unique dates that have entries
  const datesWithEntries = allEntries
    ? Array.from(new Set(allEntries.map(entry => entry.date)))
        .sort()
        .reverse() // Most recent first
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHour === null) return;

    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = editingEntryId
        ? `${process.env.NEXT_PUBLIC_API_URL}/time-entries/${editingEntryId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/time-entries`;

      const res = await fetch(url, {
        method: editingEntryId ? 'PATCH' : 'POST',
        headers,
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
        toast.success(`Entry ${editingEntryId ? 'updated' : 'logged'} successfully!`);
      } else {
        const error = await res.json();
        toast.error(error.message || `Failed to ${editingEntryId ? 'update' : 'create'} entry`);
      }
    } catch (err) {
      toast.error(`Failed to ${editingEntryId ? 'update' : 'create'} entry`);
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
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/time-entries/${entryId}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        mutate();
        toast.success('Entry deleted successfully');
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setShowDateNav(true);
      }
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowDateNav(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!audit) return;
    const isReadOnly = audit.status !== 'active';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape to cancel selection
      if (e.key === 'Escape' && selectedHour !== null) {
        setSelectedHour(null);
        setEditingEntryId(null);
        setFormData({ activityDescription: '', isImportant: false, isUrgent: false, notes: '' });
        return;
      }

      // Don't allow navigation shortcuts in read-only mode or when form is open
      if (isReadOnly || selectedHour !== null) return;

      // Arrow keys to navigate timeline
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentHour = selectedHour ?? new Date().getHours();
        const newHour = e.key === 'ArrowUp'
          ? Math.max(0, currentHour - 1)
          : Math.min(23, currentHour + 1);

        // Only select if hour is empty
        const hasEntry = dayData?.entries.find(entry => entry.hourSlot === newHour);
        if (!hasEntry) {
          setSelectedHour(newHour);
        }
      }

      // Navigate days with left/right arrows
      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        setSelectedDate(date.toISOString().split('T')[0]);
      }

      if (e.key === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        setSelectedDate(date.toISOString().split('T')[0]);
      }

      // Press 't' for today
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }

      // Press 'h' to toggle header visibility
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowDateNav(!showDateNav);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHour, selectedDate, dayData, audit, showDateNav]);

  if (!audit || !dayData) return (
    <>
      <GlobalHeader breadcrumbItems={[
        { label: 'Audits', href: '/audits' },
        { label: 'Loading...' }
      ]} />
      <div className="container mx-auto p-8">
        <p>Loading...</p>
      </div>
    </>
  );

  const quadrant = getQuadrant(formData.isImportant, formData.isUrgent);
  const quadrantInfo = QUADRANT_INFO[quadrant];
  const isReadOnly = audit.status !== 'active';

  const formatDateForInput = (date: string | Date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  };

  return (
    <>
      {/* Auto-hiding GlobalHeader */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-background border-b transition-transform duration-300 ${
        showDateNav ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <GlobalHeader breadcrumbItems={[
          { label: 'Audits', href: '/audits' },
          { label: audit.name, href: `/audits/${id}` },
          { label: 'Log Time' }
        ]} />
      </div>

      {/* Spacer to prevent content jump */}
      <div className={`transition-all duration-300 ${showDateNav ? 'h-16' : 'h-0'}`}></div>

      <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
      {/* Auto-hiding date navigation section */}
      <div className={`sticky ${showDateNav ? 'top-16' : 'top-0'} z-20 bg-background transition-all duration-300 ${
        showDateNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold">{audit.name}</h1>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                audit.status === 'active'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : audit.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {audit.status.toUpperCase()}
            </span>
          </div>

          {isReadOnly && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This audit is {audit.status}. You can view the data but cannot make changes.
              </p>
            </div>
          )}

          {/* Date Navigation */}
          <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Previous day"
            >
              ←
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 font-medium"
            />
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Next day"
            >
              →
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(dayData.entries.length / 24) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {dayData.entries.length}/24
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Quick date chips for days with entries */}
        {datesWithEntries.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
              Jump to logged days:
            </p>
            <div className="flex flex-wrap gap-2">
              {datesWithEntries.slice(0, 10).map((date) => {
                const entryCount = allEntries?.filter(e => e.date === date).length || 0;
                const isSelected = date === selectedDate;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    <span className="ml-1 opacity-75">({entryCount})</span>
                  </button>
                );
              })}
              {datesWithEntries.length > 10 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{datesWithEntries.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Floating button to show header when hidden */}
      {!showDateNav && (
        <button
          onClick={() => setShowDateNav(true)}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 animate-fade-in"
          title="Press H to toggle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Show Navigation
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Timeline - Scrollable container on desktop */}
        <div className="lg:col-span-2">
          <div className={`flex items-center justify-between mb-4 lg:sticky lg:bg-background lg:pb-2 lg:z-10 transition-all duration-300 ${
            showDateNav ? 'lg:top-24' : 'lg:top-2'
          }`}>
            <h2 className="text-lg font-semibold">24-Hour Timeline</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Scroll to see all hours</p>
          </div>
          <div className="space-y-1.5 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-2">
            {Array.from({ length: 24 }, (_, i) => {
              const entry = dayData.entries.find((e) => e.hourSlot === i);
              const quadrant = entry
                ? getQuadrant(entry.isImportant, entry.isUrgent)
                : null;
              const info = quadrant ? QUADRANT_INFO[quadrant] : null;

              return (
                <div
                  key={i}
                  className={`p-3 border rounded-lg transition ${
                    selectedHour === i
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-900'
                      : entry
                      ? quadrant === 1
                        ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                        : quadrant === 2
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800'
                        : quadrant === 3
                        ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800'
                        : 'border-gray-300 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700'
                      : isReadOnly
                      ? 'border-gray-200 dark:border-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-gray-200 dark:border-gray-800'
                  }`}
                  onClick={() => !entry && !isReadOnly && setSelectedHour(i)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem]">
                          {i.toString().padStart(2, '0')}:00
                        </span>
                        {entry && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              quadrant === 1
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                                : quadrant === 2
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                : quadrant === 3
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {info?.label}
                          </span>
                        )}
                      </div>
                      {entry ? (
                        <p className="text-sm font-medium ml-14">{entry.activityDescription}</p>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-14 italic">Click to log activity</span>
                      )}
                    </div>
                    {entry && !isReadOnly && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(entry);
                          }}
                          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        >
                          Del
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
        {selectedHour !== null && !isReadOnly && (
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

            {/* Form container - Modal on mobile, Sticky Sidebar on desktop */}
            <div className={`fixed inset-x-0 bottom-0 z-50 bg-background border-t-2 border-primary rounded-t-2xl max-h-[85vh] overflow-y-auto lg:static lg:border lg:rounded-lg lg:max-h-none lg:overflow-visible shadow-2xl lg:shadow-none lg:sticky transition-all duration-300 ${
              showDateNav ? 'lg:top-24' : 'lg:top-2'
            }`}>
              {/* Mobile drag handle indicator */}
              <div className="flex justify-center pt-3 pb-2 lg:hidden">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              <div className="sticky top-0 bg-background border-b lg:border-b px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {editingEntryId
                      ? `Edit ${selectedHour.toString().padStart(2, '0')}:00`
                      : `Log ${selectedHour.toString().padStart(2, '0')}:00`}
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

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Templates</label>
                    {templates && templates.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setShowAllTemplates(!showAllTemplates)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {showAllTemplates ? 'Show less' : `Show all (${templates.length})`}
                      </button>
                    )}
                  </div>
                  <div className={`flex flex-wrap gap-2 ${showAllTemplates ? 'max-h-40 overflow-y-auto' : ''}`}>
                    {(showAllTemplates ? templates : templates?.slice(0, 6))?.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          useTemplate(t);
                          setShowAllTemplates(false);
                        }}
                        className="text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition whitespace-nowrap"
                        title={t.description}
                      >
                        {t.icon} {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Activity Description</label>
                  <input
                    type="text"
                    value={formData.activityDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, activityDescription: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
                    placeholder="What did you do during this hour?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Eisenhower Matrix</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isImportant}
                      onChange={(e) =>
                        setFormData({ ...formData, isImportant: e.target.checked })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Important to your goals</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isUrgent}
                      onChange={(e) =>
                        setFormData({ ...formData, isUrgent: e.target.checked })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Urgent / Time-sensitive</span>
                  </label>
                </div>

                <div className={`p-3 rounded-lg border-2 ${
                  quadrant === 1 ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800' :
                  quadrant === 2 ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800' :
                  quadrant === 3 ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800' :
                  'bg-gray-50 border-gray-300 dark:bg-gray-900/30 dark:border-gray-700'
                }`}>
                  <p className="text-sm font-semibold">{quadrantInfo.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{quadrantInfo.description}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
                    rows={2}
                    placeholder="Any additional context or thoughts..."
                  />
                </div>

                <div className="pt-2 space-y-2 border-t">
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                  >
                    {editingEntryId ? '✓ Update Entry' : '✓ Log Hour'}
                  </button>
                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntryId(null);
                        setSelectedHour(null);
                        setFormData({ activityDescription: '', isImportant: false, isUrgent: false, notes: '' });
                      }}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
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
            <div className={`sticky p-6 border rounded-lg bg-gray-50 dark:bg-gray-900/50 transition-all duration-300 ${
              showDateNav ? 'top-24' : 'top-2'
            }`}>
              <div className="text-center">
                <div className="text-4xl mb-4">⏱️</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  {isReadOnly ? 'Viewing Mode' : 'Ready to Log'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isReadOnly
                    ? 'This audit is in read-only mode. You can browse the timeline but cannot make changes.'
                    : 'Click on any empty hour slot on the left to start logging your activity.'}
                </p>
                {!isReadOnly && (
                  <>
                    <div className="mt-6 pt-6 border-t text-left">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Tips:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                        <li>• Use templates for faster logging</li>
                        <li>• Navigate days with ← → buttons</li>
                        <li>• Click Edit to modify entries</li>
                        <li>• Track progress in the bar above</li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t text-left">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Keyboard Shortcuts:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <li><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">H</kbd> Toggle header</li>
                        <li><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">T</kbd> Go to today</li>
                        <li><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">←</kbd> Previous day</li>
                        <li><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">→</kbd> Next day</li>
                        <li><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">Esc</kbd> Close form</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
