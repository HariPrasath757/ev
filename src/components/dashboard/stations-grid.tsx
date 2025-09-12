'use client';

import useStation from '@/hooks/use-stations';
import StationCard from './station-card';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

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
  const { user } = useAuth();
  const { station, loading, error } = useStation(user?.stationId || null);

  if (loading) {
    return <StationSkeleton />;
  }

  if (error) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message} Please check your connection or Firebase setup.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!station) {
    return (
        <div className="text-center">
            <p>No station assigned to this user or station not found.</p>
        </div>
    );
  }

  return (
    <div>
        <StationCard key={station.id} station={station} userId={userId} />
    </div>
  );
}
