"use client";

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Audit } from '@/types/audit';
import { GlobalHeader } from '@/components/navigation/GlobalHeader';
import { AuditHeader } from '@/components/audits/AuditHeader';
import { ViewToggle } from '@/components/audits/ViewToggle';

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
    throw new Error('Failed to fetch');
  }

  return response.json();
};

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'log' | 'analytics'>('log');

  const { data: audit, error, mutate } = useSWR<Audit>(
    `${process.env.NEXT_PUBLIC_API_URL}/audits/${id}`,
    fetcher
  );

  const handleComplete = async () => {
    if (!confirm('Mark this audit as complete?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audits/${id}/complete`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        toast.success('Audit marked as complete!');
        mutate();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to complete audit');
      }
    } catch (err) {
      toast.error('Failed to complete audit');
    }
  };

  const handleAbandon = async () => {
    if (!confirm('Abandon this audit? This cannot be undone.')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audits/${id}/abandon`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        toast.success('Audit abandoned');
        mutate();
        router.push('/audits');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to abandon audit');
      }
    } catch (err) {
      toast.error('Failed to abandon audit');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this audit permanently? This cannot be undone.')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audits/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        toast.success('Audit deleted');
        router.push('/audits');
      } else {
        toast.error('Failed to delete audit');
      }
    } catch (err) {
      toast.error('Failed to delete audit');
    }
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon!');
  };

  if (error) return (
    <>
      <GlobalHeader breadcrumbItems={[
        { label: 'Audits', href: '/audits' },
        { label: 'Audit' }
      ]} />
      <div className="container mx-auto p-8">
        <p className="text-red-600">Failed to load audit</p>
      </div>
    </>
  );

  if (!audit) return (
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

  return (
    <>
      <GlobalHeader breadcrumbItems={[
        { label: 'Audits', href: '/audits' },
        { label: audit.name }
      ]} />

      <div className="container mx-auto p-6 lg:p-8">
        <AuditHeader
          audit={audit}
          currentView={currentView}
          onViewChange={setCurrentView}
          onComplete={audit.status === 'active' ? handleComplete : undefined}
          onAbandon={audit.status === 'active' ? handleAbandon : undefined}
          onDelete={handleDelete}
          onExport={handleExport}
        />

        <div className="mt-6">
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>

        <div className="mt-8">
          {currentView === 'log' ? (
            <div>
              <p className="text-gray-500">Redirecting to log view...</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Analytics view coming soon!</p>
              <p className="text-gray-400 text-sm mt-2">
                Charts, insights, and productivity analysis will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
