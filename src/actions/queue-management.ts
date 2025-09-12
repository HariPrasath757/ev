'use server';

import { db } from '@/lib/firebase/config';
import type { Station, LedgerEntry, Vehicle, DriverInQueue } from '@/types';
import { get, ref, set, push, remove, update } from 'firebase/database';
import { sendReceipt } from '@/ai/flows/send-receipt-flow';

async function getVehiclePriority(vehicleId: string): Promise<Vehicle['priority']> {
  const vehicleRef = ref(db, `vehicles/${vehicleId}`);
  const snapshot = await get(vehicleRef);
  if (snapshot.exists()) {
    return snapshot.val().priority || 'normal';
  }
  return 'normal';
}

/**
 * Adds a driver to the station's queue.
 */
export async function addDriverToQueue(
  stationId: string,
  vehicleInfo: { userId: string; vehicleId: string; vehicleName: string }
) {
  const stationRef = ref(db, `stations/${stationId}`);
  const snapshot = await get(stationRef);

  if (!snapshot.exists()) {
    return { success: false, message: 'Station not found.' };
  }

  const station: Station = { id: stationId, ...snapshot.val() };
  
  const newDriverRef = push(ref(db, `stations/${stationId}/queue`));
  const newDriver: Omit<DriverInQueue, 'driverId' | 'priority'> = {
    ...vehicleInfo,
    joinedAt: new Date().toISOString(),
    chargingStatus: station.availablePorts > 0 ? 'charging' : 'waiting',
  };
  
  await set(newDriverRef, newDriver);
  
  const updates: Partial<Station> = {};

  if (newDriver.chargingStatus === 'charging') {
    updates.availablePorts = station.availablePorts - 1;
    if (updates.availablePorts === 0) {
      updates.status = 'occupied';
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(stationRef, updates);
  }

  return { success: true, message: 'Driver added successfully.' };
}

/**
 * Removes a driver from the station's queue, creates a ledger entry, and sends a receipt.
 * This function no longer auto-promotes; it just frees up a port.
 */
export async function removeDriverFromQueue(stationId: string, driver: DriverInQueue, ledgerDetails: Omit<LedgerEntry, 'stationId' | 'receiptSent'>) {
  const stationRef = ref(db, `stations/${stationId}`);
  const stationSnapshot = await get(stationRef);

  if (!stationSnapshot.exists()) {
    return { success: false, message: 'Station not found.' };
  }

  const station: Station = { id: stationId, ...stationSnapshot.val() };

  // 1. Create Ledger Entry
  const ledgerEntry: Omit<LedgerEntry, 'id'> = {
    ...ledgerDetails,
    stationId,
    receiptSent: false, // Will be updated after email is sent
  };
  
  const ledgerRef = push(ref(db, 'ledger'));
  await set(ledgerRef, ledgerEntry);
  const ledgerId = ledgerRef.key!;

  // 2. Send Receipt Email via Genkit Flow
  try {
    const driverSnapshot = await get(ref(db, `drivers/${driver.userId}`));
    if (driverSnapshot.exists()) {
      const driverData = driverSnapshot.val();
      await sendReceipt({
        stationName: station.name,
        driverName: driverData.name,
        driverEmail: driverData.email,
        vehicleName: driver.vehicleName,
        ...ledgerDetails,
      });
      // Mark receipt as sent
      await update(ref(db, `ledger/${ledgerId}`), { receiptSent: true });
    }
  } catch (error) {
    console.error("Failed to send receipt, but continuing process.", error);
    // You might want to add more robust error handling here, like a retry mechanism.
  }

  // 3. Remove the driver from queue
  await remove(ref(db, `stations/${stationId}/queue/${driver.driverId}`));

  // 4. Free up port if the driver was charging
  if (driver.chargingStatus === 'charging') {
    const newAvailablePorts = Math.min(station.totalPorts, (station.availablePorts || 0) + 1);
    const updates: Partial<Pick<Station, 'availablePorts' | 'status'>> = {
      availablePorts: newAvailablePorts,
    };
    if (newAvailablePorts > 0 && station.status !== 'offline') {
      updates.status = 'available';
    }
     await update(stationRef, updates);
  }

  return { success: true, message: 'Driver session completed and billed.' };
}

/**
 * Manually promotes a waiting driver to charging status.
 */
export async function promoteDriverToCharging(stationId: string, driverId: string) {
  const stationRef = ref(db, `stations/${stationId}`);
  const stationSnapshot = await get(stationRef);

  if (!stationSnapshot.exists()) {
    return { success: false, message: 'Station not found.' };
  }

  const station: Station = { id: stationId, ...stationSnapshot.val() };

  if ((station.availablePorts || 0) <= 0) {
    return { success: false, message: 'No available ports to start charging.' };
  }

  const driverRef = ref(db, `stations/${stationId}/queue/${driverId}`);
  const driverSnapshot = await get(driverRef);

  if (!driverSnapshot.exists() || driverSnapshot.val().chargingStatus !== 'waiting') {
    return { success: false, message: 'Driver is not waiting or does not exist.' };
  }
  
  // Promote driver
  await update(driverRef, { chargingStatus: 'charging' });

  // Update station ports and status
  const newAvailablePorts = station.availablePorts - 1;
  const updates: Partial<Pick<Station, 'availablePorts' | 'status'>> = {
    availablePorts: newAvailablePorts,
    status: newAvailablePorts > 0 ? 'available' : 'occupied',
  };
  await update(stationRef, updates);

  return { success: true, message: 'Driver promoted to charging.' };
}
