"use client";

import { useState, use, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Audit,
  DayEntries,
  ActivityTemplate,
  getQuadrant,
  QUADRANT_INFO,
  getEntryTimeRange,
  getEntryStartTime,
  getEntryEndTime,
} from "@/types/audit";
import { GlobalHeader } from "@/components/navigation/GlobalHeader";

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Authentication failed, redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new Error("Failed to fetch");
  }

  return response.json();
};

export default function LogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState<string>(
    dateParam || new Date().toISOString().split("T")[0]
  );
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [selectedGap, setSelectedGap] = useState<{
    startMinutes: number;
    endMinutes: number;
  } | null>(null);
  const [templateUsageKey, setTemplateUsageKey] = useState(0); // Trigger re-render on template use
  const [formData, setFormData] = useState({
    activityDescription: "",
    startMinute: 0,
    durationMinutes: 60,
    isImportant: false,
    isUrgent: false,
    notes: "",
  });

  const { data: audit } = useSWR<Audit>(
    `${process.env.NEXT_PUBLIC_API_URL}/audits/${id}`,
    fetcher
  );

  const {
    data: dayData,
    mutate,
    isLoading: isDayDataLoading,
  } = useSWR<DayEntries>(
    selectedDate
      ? `${process.env.NEXT_PUBLIC_API_URL}/time-entries/audit/${id}/day/${selectedDate}`
      : null,
    fetcher,
    { keepPreviousData: true } // Keep old data while fetching new data
  );

  const { data: templates } = useSWR<ActivityTemplate[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/templates`,
    fetcher
  );

  const getSmartTemplates = (): ActivityTemplate[] => {
    if (!templates) return [];

    const key = "template_usage";
    const stored = localStorage.getItem(key);
    const usage = stored ? JSON.parse(stored) : {};

    const byUsage = [...templates]
      .filter((t) => usage[t.id]?.count > 0)
      .sort((a, b) => (usage[b.id]?.count || 0) - (usage[a.id]?.count || 0))
      .slice(0, 3);

    const byRecency = [...templates]
      .filter((t) => usage[t.id]?.lastUsed)
      .sort((a, b) => {
        const aTime = new Date(usage[a.id].lastUsed).getTime();
        const bTime = new Date(usage[b.id].lastUsed).getTime();
        return bTime - aTime;
      })
      .slice(0, 3);

    const smartTemplates = [...byUsage];
    byRecency.forEach((t) => {
      if (!smartTemplates.find((st) => st.id === t.id)) {
        smartTemplates.push(t);
      }
    });

    if (smartTemplates.length < 6) {
      const remaining = templates.filter(
        (t) => !smartTemplates.find((st) => st.id === t.id)
      );
      smartTemplates.push(...remaining.slice(0, 6 - smartTemplates.length));
    }

    return smartTemplates;
  };

  const smartTemplates = getSmartTemplates();

  const getTemplateStats = (templateId: string) => {
    const key = "template_usage";
    const stored = localStorage.getItem(key);
    const usage = stored ? JSON.parse(stored) : {};
    return usage[templateId] || { count: 0, lastUsed: null };
  };

  const { data: allEntries } = useSWR<any[]>(
    audit
      ? `${process.env.NEXT_PUBLIC_API_URL}/time-entries/audit/${id}`
      : null,
    fetcher
  );

  const datesWithEntries = allEntries
    ? Array.from(new Set(allEntries.map((entry) => entry.date)))
        .sort()
        .reverse()
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHour === null) return;

    try {
      const url = editingEntryId
        ? `${process.env.NEXT_PUBLIC_API_URL}/time-entries/${editingEntryId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/time-entries`;

      const res = await fetch(url, {
        method: editingEntryId ? "PATCH" : "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          editingEntryId
            ? formData
            : {
                auditId: id,
                date: selectedDate,
                hourSlot: selectedHour,
                ...formData,
              }
        ),
      });

      if (res.ok) {
        setSelectedHour(null);
        setSelectedGap(null);
        setEditingEntryId(null);
        setFormData({
          activityDescription: "",
          startMinute: 0,
          durationMinutes: 60,
          isImportant: false,
          isUrgent: false,
          notes: "",
        });
        mutate();
        toast.success(
          `Entry ${editingEntryId ? "updated" : "logged"} successfully!`
        );
      } else {
        const error = await res.json();
        toast.error(
          error.message ||
            `Failed to ${editingEntryId ? "update" : "create"} entry`
        );
      }
    } catch (err) {
      toast.error(`Failed to ${editingEntryId ? "update" : "create"} entry`);
    }
  };

  const trackTemplateUsage = (templateId: string) => {
    const key = "template_usage";
    const stored = localStorage.getItem(key);
    const usage = stored ? JSON.parse(stored) : {};

    if (!usage[templateId]) {
      usage[templateId] = { count: 0, lastUsed: null };
    }

    usage[templateId].count += 1;
    usage[templateId].lastUsed = new Date().toISOString();

    localStorage.setItem(key, JSON.stringify(usage));
    setTemplateUsageKey((prev) => prev + 1);
  };

  const useTemplate = (template: ActivityTemplate) => {
    setFormData({
      ...formData,
      activityDescription: template.name,
      isImportant: template.isImportant,
      isUrgent: template.isUrgent,
    });
    trackTemplateUsage(template.id);
  };

  const handleEditEntry = (entry: any) => {
    setSelectedHour(entry.hourSlot);
    setEditingEntryId(entry.id);
    setFormData({
      activityDescription: entry.activityDescription,
      startMinute: entry.startMinute || 0,
      durationMinutes: entry.durationMinutes || 60,
      isImportant: entry.isImportant,
      isUrgent: entry.isUrgent,
      notes: entry.notes || "",
    });
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/time-entries/${entryId}`,
        {
          method: "DELETE",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        mutate();
        toast.success("Entry deleted successfully");
      } else {
        toast.error("Failed to delete entry");
      }
    } catch (err) {
      toast.error("Failed to delete entry");
    }
  };

  useEffect(() => {
    if (!audit) return;
    const isReadOnly = audit.status !== "active";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Escape" && selectedHour !== null) {
        setSelectedHour(null);
        setSelectedGap(null);
        setEditingEntryId(null);
        setFormData({
          activityDescription: "",
          startMinute: 0,
          durationMinutes: 60,
          isImportant: false,
          isUrgent: false,
          notes: "",
        });
        return;
      }

      if (isReadOnly || selectedHour !== null) return;

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentHour = selectedHour ?? new Date().getHours();
        const newHour =
          e.key === "ArrowUp"
            ? Math.max(0, currentHour - 1)
            : Math.min(23, currentHour + 1);

        const hasEntry = dayData?.entries.find(
          (entry) => entry.hourSlot === newHour
        );
        if (!hasEntry) {
          setSelectedHour(newHour);
        }
      }

      if (e.key === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault();
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        setSelectedDate(date.toISOString().split("T")[0]);
      }

      if (e.key === "ArrowRight" && e.ctrlKey) {
        e.preventDefault();
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        setSelectedDate(date.toISOString().split("T")[0]);
      }

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setSelectedDate(new Date().toISOString().split("T")[0]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHour, selectedDate, dayData, audit]);

  if (!audit)
    return (
      <>
        <GlobalHeader
          breadcrumbItems={[
            { label: "Audits", href: "/audits" },
            { label: "Loading..." },
          ]}
        />
        <div className="container mx-auto p-8">
          <p>Loading...</p>
        </div>
      </>
    );

  const quadrant = getQuadrant(formData.isImportant, formData.isUrgent);
  const quadrantInfo = QUADRANT_INFO[quadrant];
  const isReadOnly = audit.status !== "active";

  type TimeBlock =
    | { type: "entry"; entry: any }
    | { type: "gap"; startMinutes: number; endMinutes: number };

  const buildTimeline = (entries: any[]): TimeBlock[] => {
    if (!entries || entries.length === 0) {
      return [{ type: "gap", startMinutes: 0, endMinutes: 1440 }];
    }

    const sortedEntries = [...entries].sort((a, b) => {
      const aStart = a.hourSlot * 60 + (a.startMinute || 0);
      const bStart = b.hourSlot * 60 + (b.startMinute || 0);
      return aStart - bStart;
    });

    const blocks: TimeBlock[] = [];
    let currentMinute = 0;

    for (const entry of sortedEntries) {
      const entryStart = entry.hourSlot * 60 + (entry.startMinute || 0);
      const entryEnd = entryStart + entry.durationMinutes;

      if (currentMinute < entryStart) {
        blocks.push({
          type: "gap",
          startMinutes: currentMinute,
          endMinutes: entryStart,
        });
      }

      blocks.push({ type: "entry", entry });

      currentMinute = entryEnd;
    }

    if (currentMinute < 1440) {
      blocks.push({
        type: "gap",
        startMinutes: currentMinute,
        endMinutes: 1440,
      });
    }

    return blocks;
  };

  const timelineBlocks = buildTimeline(dayData?.entries || []);

  const calculateMaxDuration = (): number => {
    if (selectedHour === null) return 1440;

    const currentStartMinutes = selectedHour * 60 + formData.startMinute;

    const minutesUntilEndOfDay = 1440 - currentStartMinutes;

    if (selectedGap) {
      const maxFromGap = selectedGap.endMinutes - currentStartMinutes;
      return Math.min(maxFromGap, minutesUntilEndOfDay);
    }

    if (dayData?.entries) {
      const entriesAfter = dayData.entries
        .map((e) => e.hourSlot * 60 + (e.startMinute || 0))
        .filter((startMin) => startMin > currentStartMinutes)
        .sort((a, b) => a - b);

      if (entriesAfter.length > 0) {
        const nextEntryStart = entriesAfter[0];
        return Math.min(
          nextEntryStart - currentStartMinutes,
          minutesUntilEndOfDay
        );
      }
    }

    return minutesUntilEndOfDay;
  };

  const maxAllowedDuration = calculateMaxDuration();

  const formatDateForInput = (date: string | Date) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString().split("T")[0];
  };

  return (
    <>
      <GlobalHeader
        breadcrumbItems={[
          { label: "Audits", href: "/audits" },
          { label: audit.name, href: `/audits/${id}` },
          { label: "Log Time" },
        ]}
      />
      <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold">{audit.name}</h1>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                audit.status === "active"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : audit.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {audit.status.toUpperCase()}
            </span>
          </div>

          {isReadOnly && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This audit is {audit.status}. You can view the data but cannot
                make changes.
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
                  setSelectedDate(date.toISOString().split("T")[0]);
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
                  setSelectedDate(date.toISOString().split("T")[0]);
                }}
                className="px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Next day"
              >
                →
              </button>
              <button
                onClick={() =>
                  setSelectedDate(new Date().toISOString().split("T")[0])
                }
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
                    style={{ width: `${((dayData?.entries.length || 0) / 24) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {dayData?.entries.length || 0}/24
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(audit.startDate).toLocaleDateString()} -{" "}
                {new Date(audit.endDate).toLocaleDateString()}
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
                  const entryCount =
                    allEntries?.filter((e) => e.date === date).length || 0;
                  const isSelected = date === selectedDate;
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`px-2 py-1 rounded text-xs font-medium transition ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {new Date(date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">24-Hour Timeline</h2>
              <div className="flex items-center gap-3">
                {isDayDataLoading && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click empty slot to log
                </p>
              </div>
            </div>
            <div
              className={`space-y-1.5 transition-opacity ${
                isDayDataLoading ? "opacity-50" : "opacity-100"
              }`}
            >
              {timelineBlocks.map((block, index) => {
                if (block.type === "entry") {
                  const entry = block.entry;
                  const quadrant = getQuadrant(
                    entry.isImportant,
                    entry.isUrgent
                  );
                  const info = QUADRANT_INFO[quadrant];

                  return (
                    <div
                      key={`entry-${entry.id}`}
                      className={`p-3 border rounded-lg transition ${
                        quadrant === 1
                          ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800"
                          : quadrant === 2
                          ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800"
                          : quadrant === 3
                          ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800"
                          : "border-gray-300 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {getEntryTimeRange(entry)}
                            </span>
                            {entry.durationMinutes !== 60 && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                {entry.durationMinutes}m
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                quadrant === 1
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                                  : quadrant === 2
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                  : quadrant === 3
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {info?.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {entry.activityDescription}
                          </p>
                        </div>
                        {!isReadOnly && (
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
                } else {
                  const { startMinutes, endMinutes } = block;
                  const startHour = Math.floor(startMinutes / 60);
                  const startMinute = startMinutes % 60;
                  const endHour = Math.floor(endMinutes / 60);
                  const endMinute = endMinutes % 60;
                  const gapDuration = endMinutes - startMinutes;

                  const isSelected =
                    selectedHour === startHour &&
                    formData.startMinute === startMinute;

                  return (
                    <div
                      key={`gap-${index}`}
                      className={`p-3 border rounded-lg transition cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-900"
                          : isReadOnly
                          ? "border-gray-200 dark:border-gray-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800"
                      }`}
                      onClick={() => {
                        if (!isReadOnly) {
                          setSelectedHour(startHour);
                          setSelectedGap({ startMinutes, endMinutes });
                          setFormData((prev) => ({
                            ...prev,
                            startMinute: startMinute,
                            durationMinutes: Math.min(gapDuration, 60), // Default to max 60 mins or gap size
                          }));
                        }
                      }}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {`${startHour
                                .toString()
                                .padStart(2, "0")}:${startMinute
                                .toString()
                                .padStart(2, "0")} - ${endHour
                                .toString()
                                .padStart(2, "0")}:${endMinute
                                .toString()
                                .padStart(2, "0")}`}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded">
                              Available ({gapDuration}m)
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            Click to log activity
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
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
                  setSelectedGap(null);
                  setEditingEntryId(null);
                  setFormData({
                    activityDescription: "",
                    startMinute: 0,
                    durationMinutes: 60,
                    isImportant: false,
                    isUrgent: false,
                    notes: "",
                  });
                }}
              />

              {/* Form container - Modal on mobile, Sticky Sidebar on desktop */}
              <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t-2 border-primary rounded-t-2xl max-h-[85vh] overflow-y-auto lg:border-t lg:border lg:border-border lg:rounded-lg lg:max-h-none lg:overflow-visible shadow-2xl lg:shadow-none lg:static lg:top-24 lg:z-10">
                {/* Mobile drag handle indicator */}
                <div className="flex justify-center pt-3 pb-2 lg:hidden">
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                <div className="sticky top-0 bg-background py-4 z-10">
                  <div className="border-b pb-4 mx-6">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">
                          {editingEntryId
                            ? `Edit Entry`
                            : selectedGap
                            ? (() => {
                                const startH = Math.floor(
                                  selectedGap.startMinutes / 60
                                );
                                const startM = selectedGap.startMinutes % 60;
                                const endH = Math.floor(
                                  selectedGap.endMinutes / 60
                                );
                                const endM = selectedGap.endMinutes % 60;
                                return `Log ${startH
                                  .toString()
                                  .padStart(2, "0")}:${startM
                                  .toString()
                                  .padStart(2, "0")} - ${endH
                                  .toString()
                                  .padStart(2, "0")}:${endM
                                  .toString()
                                  .padStart(2, "0")}`;
                              })()
                            : `Log Activity`}
                        </h2>
                        {!editingEntryId && selectedGap && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {selectedGap.endMinutes - selectedGap.startMinutes}{" "}
                            minutes available
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHour(null);
                          setSelectedGap(null);
                          setEditingEntryId(null);
                          setFormData({
                            activityDescription: "",
                            startMinute: 0,
                            durationMinutes: 60,
                            isImportant: false,
                            isUrgent: false,
                            notes: "",
                          });
                        }}
                        className="lg:hidden text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">
                        Templates
                        {!showAllTemplates && smartTemplates.length > 0 && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (Smart picks)
                          </span>
                        )}
                      </label>
                      {templates && templates.length > 6 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTemplates(!showAllTemplates)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {showAllTemplates
                            ? "Show smart picks"
                            : `Show all (${templates.length})`}
                        </button>
                      )}
                    </div>
                    <div
                      className={`flex flex-wrap gap-2 ${
                        showAllTemplates ? "max-h-40 overflow-y-auto" : ""
                      }`}
                    >
                      {(showAllTemplates ? templates : smartTemplates)?.map(
                        (t) => {
                          const stats = getTemplateStats(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                useTemplate(t);
                                setShowAllTemplates(false);
                              }}
                              className="text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition whitespace-nowrap flex items-center gap-1"
                              title={`${t.description || t.name}${
                                stats.count > 0 ? ` (used ${stats.count}x)` : ""
                              }`}
                            >
                              {t.icon} {t.name}
                              {!showAllTemplates && stats.count > 0 && (
                                <span className="ml-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-[10px] font-medium">
                                  {stats.count}
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Time picker section */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Start Time
                      </label>
                      <div className="flex items-center gap-1">
                        <select
                          value={selectedHour ?? 0}
                          onChange={(e) =>
                            setSelectedHour(parseInt(e.target.value))
                          }
                          className="px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm font-semibold">:</span>
                        <select
                          value={formData.startMinute}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startMinute: parseInt(e.target.value),
                            })
                          }
                          className="flex-1 px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Duration
                        <span className="ml-1 text-xs text-gray-500">
                          (max: {maxAllowedDuration}m)
                        </span>
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formData.durationMinutes}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setFormData({
                              ...formData,
                              durationMinutes: Math.min(
                                val,
                                maxAllowedDuration
                              ),
                            });
                          }}
                          min="1"
                          max={maxAllowedDuration}
                          className={`w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm font-mono ${
                            formData.durationMinutes > maxAllowedDuration
                              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                              : ""
                          }`}
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick duration buttons */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 self-center">
                      Quick:
                    </span>
                    {[15, 30, 45, 60, 90, 120]
                      .filter((mins) => mins <= maxAllowedDuration)
                      .map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, durationMinutes: mins })
                          }
                          className={`px-2.5 py-1 text-xs border rounded-md transition ${
                            formData.durationMinutes === mins
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    {maxAllowedDuration < 15 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 self-center italic">
                        Limited space available
                      </span>
                    )}
                  </div>

                  {/* Display end time */}
                  {selectedHour !== null && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-900 dark:text-blue-200">
                        <span className="font-semibold">Time Range:</span>{" "}
                        {selectedHour.toString().padStart(2, "0")}:
                        {formData.startMinute.toString().padStart(2, "0")} -{" "}
                        {(() => {
                          const totalMinutes =
                            selectedHour * 60 +
                            formData.startMinute +
                            formData.durationMinutes;
                          const endHour = Math.floor(totalMinutes / 60);
                          const endMinute = totalMinutes % 60;
                          return `${endHour
                            .toString()
                            .padStart(2, "0")}:${endMinute
                            .toString()
                            .padStart(2, "0")}`;
                        })()}{" "}
                        ({formData.durationMinutes} min)
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Activity Description
                    </label>
                    <input
                      type="text"
                      value={formData.activityDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activityDescription: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
                      placeholder="What did you do during this time?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Eisenhower Matrix
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isImportant}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isImportant: e.target.checked,
                          })
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
                          setFormData({
                            ...formData,
                            isUrgent: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">Urgent / Time-sensitive</span>
                    </label>
                  </div>

                  <div
                    className={`p-3 rounded-lg border-2 ${
                      quadrant === 1
                        ? "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800"
                        : quadrant === 2
                        ? "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800"
                        : quadrant === 3
                        ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800"
                        : "bg-gray-50 border-gray-300 dark:bg-gray-900/30 dark:border-gray-700"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {quadrantInfo.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {quadrantInfo.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
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
                      {editingEntryId ? "✓ Update Entry" : "✓ Log Hour"}
                    </button>
                    {editingEntryId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEntryId(null);
                          setSelectedHour(null);
                          setSelectedGap(null);
                          setFormData({
                            activityDescription: "",
                            startMinute: 0,
                            durationMinutes: 60,
                            isImportant: false,
                            isUrgent: false,
                            notes: "",
                          });
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
              <div className="sticky top-24 z-10 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <div className="text-center">
                  <div className="text-4xl mb-4">⏱️</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    {isReadOnly ? "Viewing Mode" : "Ready to Log"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isReadOnly
                      ? "This audit is in read-only mode. You can browse the timeline but cannot make changes."
                      : "Click on any empty hour slot on the left to start logging your activity."}
                  </p>
                  {!isReadOnly && (
                    <>
                      <div className="mt-6 pt-6 border-t text-left">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Quick Tips:
                        </p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                          <li>• Use templates for faster logging</li>
                          <li>• Navigate days with ← → buttons</li>
                          <li>• Click Edit to modify entries</li>
                          <li>• Track progress in the bar above</li>
                        </ul>
                      </div>
                      <div className="mt-4 pt-4 border-t text-left">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Keyboard Shortcuts:
                        </p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <li>
                            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">
                              T
                            </kbd>{" "}
                            Go to today
                          </li>
                          <li>
                            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">
                              Ctrl
                            </kbd>{" "}
                            +{" "}
                            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">
                              ←
                            </kbd>{" "}
                            Previous day
                          </li>
                          <li>
                            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">
                              Ctrl
                            </kbd>{" "}
                            +{" "}
                            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">
                              →
                            </kbd>{" "}
                            Next day
                          </li>
                          <li>
                            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px]">
                              Esc
                            </kbd>{" "}
                            Close form
                          </li>
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
