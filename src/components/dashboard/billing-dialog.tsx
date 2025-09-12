'use client';

import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
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

export default function BillingDialog({ open, onOpenChange, station, driver, vehicle }: BillingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const billingDetails = useMemo(() => {
    if (!driver || !station || !vehicle) return null;

    const unitsConsumed = Math.round(Math.random() * (vehicle.capacityKWh * 0.8)) + 5; // Placeholder logic
    const cost = unitsConsumed * station.pricePerKWh;
    const platformFee = cost * 0.05; // 5% partner fee
    const totalBill = cost + platformFee;
    const endTime = new Date().toISOString();

    return {
      unitsConsumed,
      cost,
      platformFee,
      totalBill,
      startTime: driver.joinedAt,
      endTime,
    };
  }, [driver, station, vehicle]);

  const handleConfirmBill = async () => {
    if (!billingDetails) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot calculate bill.' });
        return;
    }
    
    setIsSubmitting(true);
    
    const ledgerDetails: Omit<LedgerEntry, 'id' | 'stationId' | 'receiptSent'> = {
        userId: driver.userId,
        vehicleId: driver.vehicleId,
        vehicleName: driver.vehicleName,
        startTime: billingDetails.startTime,
        endTime: billingDetails.endTime,
        unitsConsumed: billingDetails.unitsConsumed,
        cost: billingDetails.cost,
        platformFee: billingDetails.platformFee,
        totalBill: billingDetails.totalBill,
    };

    const result = await removeDriverFromQueue(station.id, driver, ledgerDetails);
    
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Billing complete and receipt sent.' });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  if (!billingDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
                <span className="text-muted-foreground">Driver (User ID):</span>
                <span className="font-semibold">{driver.userId}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-semibold">{driver.vehicleName}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Session:</span>
                <span className="font-semibold text-xs">
                    {new Date(billingDetails.startTime).toLocaleString()} - {new Date(billingDetails.endTime).toLocaleString()}
                </span>
            </div>
            <div className="border-t my-2" />
            <div className="flex justify-between">
                <span className="text-muted-foreground">Units Consumed:</span>
                <span className="font-semibold">{billingDetails.unitsConsumed.toFixed(2)} kWh</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-semibold">₹{billingDetails.cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Partner Fee (5%):</span>
                <span className="font-semibold">₹{billingDetails.platformFee.toFixed(2)}</span>
            </div>
             <div className="border-t my-2" />
            <div className="flex justify-between text-base font-bold text-primary">
                <span>Total Bill:</span>
                <span>₹{billingDetails.totalBill.toFixed(2)}</span>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmBill} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
