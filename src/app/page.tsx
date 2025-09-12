'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/dashboard/header';
import StationsGrid from '@/components/dashboard/stations-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LedgerView from '@/components/dashboard/ledger-view';
import { SlidersHorizontal, History } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="station" className="mx-auto max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="station">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Station View
            </TabsTrigger>
            <TabsTrigger value="ledger">
              <History className="mr-2 h-4 w-4" />
              Ledger
            </TabsTrigger>
          </TabsList>
          <TabsContent value="station" className="mt-6">
            <StationsGrid userId={user.id} />
          </TabsContent>
          <TabsContent value="ledger" className="mt-6">
            {user.stationId && <LedgerView stationId={user.stationId} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
