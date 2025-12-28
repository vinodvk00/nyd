"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkAuth } = useAuth();
  const token = searchParams.get('token');

  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/magic-link/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Verification failed');
        }

        await checkAuth();
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setVerifying(false);
      }
    };

    verify();
  }, [token, checkAuth, router]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="py-8">
            <p className="text-gray-300 text-center">Verifying your email...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-100">Verification Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded text-center">
            {error}
          </div>
          <p className="text-gray-400 text-center text-sm">
            The link may have expired or already been used.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/register" className="block">
              <Button className="w-full">Try Again</Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="py-8">
            <p className="text-gray-300 text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
