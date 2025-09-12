'use client';

import { useState, useMemo } from 'react';
import { Loader2, QrCode, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { removeDriverFromQueue } from '@/actions/queue-management';
import type { Station, DriverInQueue, Vehicle, LedgerEntry } from '@/types';

type BillingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station;
  driver: DriverInQueue;
  vehicle?: Vehicle;
};

// Simulate an average charging rate in kWh per minute.
const AVG_CHARGING_RATE_KWH_PER_MINUTE = 0.3; 

export default function BillingDialog({ open, onOpenChange, station, driver, vehicle }: BillingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const { toast } = useToast();

  const billingDetails = useMemo(() => {
    if (!driver || !station) return null;

    const startTime = new Date(driver.joinedAt);
    const endTime = new Date();
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    // Calculate kWh delivered based on duration.
    // If vehicle capacity is available, use it as a cap. Otherwise, just use the calculated value.
    const calculatedKWh = durationMinutes * AVG_CHARGING_RATE_KWH_PER_MINUTE;
    const kWhDelivered = vehicle?.capacityKWh 
      ? Math.min(calculatedKWh, vehicle.capacityKWh) 
      : calculatedKWh;

    const cost = kWhDelivered * station.pricePerKWh;
    const platformFee = cost * 0.05; // 5% partner fee
    const totalAmount = cost + platformFee;

    return {
      kWhDelivered,
      pricePerKWh: station.pricePerKWh,
      cost,
      platformFee,
      totalAmount,
      startTime: driver.joinedAt,
      endTime: endTime.toISOString(),
    };
  }, [driver, station, vehicle]);
  
  const receiptUrl = useMemo(() => {
    if (!ledgerId) return null;
    // This needs to be the full public URL of your application
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/receipt/${ledgerId}`;
  }, [ledgerId]);


  const handleConfirmBill = async () => {
    if (!billingDetails) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot calculate bill.' });
        return;
    }
    
    setIsSubmitting(true);
    
    const ledgerDetails: Omit<LedgerEntry, 'id' | 'stationId'> = {
        userId: driver.userId,
        vehicleId: driver.vehicleId,
        vehicleName: driver.vehicleName,
        startTime: billingDetails.startTime,
        endTime: billingDetails.endTime,
        kWhDelivered: billingDetails.kWhDelivered,
        pricePerKWh: billingDetails.pricePerKWh,
        cost: billingDetails.cost,
        platformFee: billingDetails.platformFee,
        totalAmount: billingDetails.totalAmount,
        receiptSent: true,
    };

    const result = await removeDriverFromQueue(station.id, driver, ledgerDetails);
    
    setIsSubmitting(false);

    if (result.success && result.ledgerId) {
      toast({ title: 'Success', description: 'Billing complete. QR code generated.' });
      setLedgerId(result.ledgerId); // This will trigger the QR code view
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a delay to allow for closing animation
    setTimeout(() => {
        setLedgerId(null);
        setIsSubmitting(false);
    }, 300);
  }

  if (!billingDetails) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {receiptUrl ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Session Completed
              </DialogTitle>
              <DialogDescription>
                Scan the QR code to view and download the receipt.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-4">
                <div className="p-4 bg-white rounded-lg">
                    <QRCode value={receiptUrl} size={200} />
                </div>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {receiptUrl}
                </a>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete Charging & Bill</DialogTitle>
              <DialogDescription>
                Confirm the details below to complete the session and generate the bill.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Station:</span>
                    <span className="font-semibold">{station.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-semibold">{driver.vehicleName}</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Units Consumed:</span>
                    <span className="font-semibold">{billingDetails.kWhDelivered.toFixed(2)} kWh</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost (at ₹{billingDetails.pricePerKWh.toFixed(2)}/kWh):</span>
                    <span className="font-semibold">₹{billingDetails.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Partner Fee (5%):</span>
                    <span className="font-semibold">₹{billingDetails.platformFee.toFixed(2)}</span>
                </div>
                 <div className="border-t my-2" />
                <div className="flex justify-between text-base font-bold text-primary">
                    <span>Total Bill:</span>
                    <span>₹{billingDetails.totalAmount.toFixed(2)}</span>
                </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleConfirmBill} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <QrCode className="mr-2 h-4 w-4"/>
                Confirm & Generate QR
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
