'use client';

import useStations from '@/hooks/use-stations';
import StationCard from './station-card';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <StationSkeleton key={i} />
        ))}
      </div>
    );
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

  if (!stations.length) {
    return <p>No stations found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {stations.map((station) => (
        <StationCard key={station.id} station={station} userId={userId} />
      ))}
    </div>
  );
}
