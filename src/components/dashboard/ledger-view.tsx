'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import type { LedgerEntry } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, FileText, Calendar, User, Car } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

type LedgerViewProps = {
  stationId: string;
};

const LedgerEntryCard = ({ entry }: { entry: LedgerEntry }) => (
  <Card className="transition-all hover:shadow-md">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Session: {entry.id?.slice(-6)}
          </CardTitle>
          <CardDescription>
            {new Date(entry.endTime).toLocaleString()}
          </CardDescription>
        </div>
        <div className="text-right">
            <p className="text-xl font-bold text-primary">₹{entry.totalAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{entry.kWhDelivered.toFixed(2)} kWh</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="text-sm space-y-2">
       <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>User ID: {entry.userId}</span>
       </div>
        <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>Vehicle: {entry.vehicleName}</span>
        </div>
    </CardContent>
    <CardFooter>
      <Link href={`/receipt/${entry.id}`} passHref legacyBehavior>
        <Button asChild variant="outline" size="sm">
            <a>View Receipt</a>
        </Button>
      </Link>
    </CardFooter>
  </Card>
);


const LedgerSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
             <Card key={i}>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-8 w-24" />
                </CardFooter>
             </Card>
        ))}
    </div>
);

export default function LedgerView({ stationId }: LedgerViewProps) {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationId) {
      setLoading(false);
      setError('No station ID provided.');
      return;
    }

    const ledgerRef = query(ref(db, 'ledger'), orderByChild('stationId'), equalTo(stationId));

    const listener = onValue(
      ledgerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const entries: LedgerEntry[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
          })).sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()); // Sort by most recent
          setLedgerEntries(entries);
        } else {
          setLedgerEntries([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to fetch ledger data.');
        setLoading(false);
      }
    );

    return () => off(ledgerRef, 'value', listener);
  }, [stationId]);

  if (loading) {
    return <LedgerSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {ledgerEntries.length > 0 ? (
        ledgerEntries.map(entry => (
          <LedgerEntryCard key={entry.id} entry={entry} />
        ))
      ) : (
        <Card className="text-center p-8">
            <CardTitle>No History Found</CardTitle>
            <CardDescription className="mt-2">There are no completed charging sessions for this station yet.</CardDescription>
        </Card>
      )}
    </div>
  );
}
