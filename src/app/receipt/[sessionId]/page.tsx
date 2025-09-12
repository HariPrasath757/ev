'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, AlertCircle, Zap } from 'lucide-react';
import type { LedgerEntry } from '@/types';

const ReceiptDetail = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between py-2 border-b border-dashed">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-medium text-foreground">{value}</p>
  </div>
);

export default function ReceiptPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [receipt, setReceipt] = useState<LedgerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided.');
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        const receiptRef = ref(db, `ledger/${sessionId}`);
        const snapshot = await get(receiptRef);

        if (snapshot.exists()) {
          setReceipt({ id: sessionId, ...snapshot.val() });
        } else {
          setError('Receipt not found. Please check the session ID.');
        }
      } catch (err) {
        setError('Failed to fetch receipt data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [sessionId]);

  const ReceiptSkeleton = () => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <div className="border-t pt-4 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
        </div>
        <div className="border-t pt-4">
             <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 font-sans">
       <div className="flex flex-col items-center gap-2 mb-6">
        <div className="bg-primary text-primary-foreground rounded-full p-3">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-primary">EvolveNet Platform</h1>
      </div>

      {loading && <ReceiptSkeleton />}
      
      {error && !loading && (
         <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {receipt && !loading && (
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center">
             <div className="mx-auto bg-green-100 dark:bg-green-900/50 p-3 rounded-full w-fit mb-2">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Charging Receipt</CardTitle>
            <CardDescription>Session ID: {receipt.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <ReceiptDetail label="Vehicle" value={receipt.vehicleName} />
                <ReceiptDetail label="User ID" value={receipt.userId} />
                <ReceiptDetail 
                    label="Session Start" 
                    value={new Date(receipt.startTime).toLocaleString()} 
                />
                <ReceiptDetail 
                    label="Session End" 
                    value={new Date(receipt.endTime).toLocaleString()} 
                />
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <ReceiptDetail label="Energy Delivered" value={`${receipt.kWhDelivered.toFixed(2)} kWh`} />
                <ReceiptDetail label="Price" value={`₹${receipt.pricePerKWh.toFixed(2)} / kWh`} />
                <ReceiptDetail label="Base Cost" value={`₹${receipt.cost.toFixed(2)}`} />
                <ReceiptDetail label="Partner Fee" value={`₹${receipt.platformFee.toFixed(2)}`} />
            </div>

            <div className="flex justify-between items-center bg-primary/10 text-primary font-bold p-4 rounded-lg text-lg">
              <span>Total Bill</span>
              <span>₹{receipt.totalAmount.toFixed(2)}</span>
            </div>
             <p className="text-center text-xs text-muted-foreground pt-4">
                Thank you for choosing EvolveNet! A copy of this receipt is saved to your account.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
