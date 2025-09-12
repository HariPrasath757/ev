'use client';

import useStations from '@/hooks/use-stations';
import StationCard from './station-card';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import type { Station } from '@/types';

const StationSkeleton = () => (
  <div className="flex flex-col space-y-3">
    <Skeleton className="h-[200px] w-full rounded-xl" />
    <div className="space-y-2 p-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

type StationsGridProps = {
  userId: string;
};

export default function StationsGrid({ userId }: StationsGridProps) {
  const { stations, loading, error } = useStations();
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);

  useEffect(() => {
    if (user && stations.length > 0) {
      const userStation = stations.find(s => s.id === user.stationId);
      setStation(userStation || null);
    }
  }, [user, stations]);

  if (loading) {
    return <StationSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load station data: {error.message}. Please check your connection or Firebase setup.
        </AlertDescription>
      </Alert>
    );
  }

  if (!station) {
    return <p>No station assigned to this user or station not found.</p>;
  }

  return (
    <div className="max-w-md mx-auto">
        <StationCard key={station.id} station={station} userId={userId} />
    </div>
  );
}
