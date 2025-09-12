'use server';

import { db } from '@/lib/firebase/config';
import type { Station, QueueEntry, LedgerEntry, Vehicle } from '@/types';
import { get, ref, set, push, remove, update } from 'firebase/database';

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
  const newDriver: QueueEntry = {
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
 * Removes a driver from the station's queue, creates a ledger entry, and promotes the next waiting driver if applicable.
 */
export async function removeDriverFromQueue(stationId: string, driverId: string) {
  const stationRef = ref(db, `stations/${stationId}`);
  const stationSnapshot = await get(stationRef);

  if (!stationSnapshot.exists()) {
    return { success: false, message: 'Station not found.' };
  }

  const station: Station = { id: stationId, ...stationSnapshot.val() };
  const queue = station.queue || {};
  const driverToRemove = queue[driverId];

  if (!driverToRemove) {
    return { success: false, message: 'Driver not found in queue.' };
  }

  // Create Ledger Entry
  const unitsConsumed = Math.round(Math.random() * 50) + 5; // Placeholder
  const cost = unitsConsumed * station.pricePerKWh;
  const platformFee = 5;
  const totalBill = cost + platformFee;
  
  const ledgerEntry: Omit<LedgerEntry, 'id'> = {
    stationId,
    userId: driverToRemove.userId,
    vehicleId: driverToRemove.vehicleId,
    vehicleName: driverToRemove.vehicleName,
    unitsConsumed,
    cost,
    platformFee,
    totalBill,
    startTime: driverToRemove.joinedAt,
    endTime: new Date().toISOString(),
    receiptSent: false,
  };
  
  const ledgerRef = push(ref(db, 'ledger'));
  await set(ledgerRef, ledgerEntry);

  // Remove the driver from queue
  await remove(ref(db, `stations/${stationId}/queue/${driverId}`));

  // If the removed driver was charging, we might need to promote someone.
  if (driverToRemove.chargingStatus === 'charging') {
      const remainingQueue = (await get(ref(db, `stations/${stationId}/queue`))).val() || {};
      const waitingDrivers = [];
      for (const id in remainingQueue) {
        if (remainingQueue[id].chargingStatus === 'waiting') {
          const priority = await getVehiclePriority(remainingQueue[id].vehicleId);
          waitingDrivers.push({ id, ...remainingQueue[id], priority });
        }
      }

      waitingDrivers.sort((a, b) => {
        if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
        if (a.priority !== 'emergency' && b.priority === 'emergency') return 1;
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      });

      if (waitingDrivers.length > 0) {
        const [nextDriver] = waitingDrivers;
        // Promote the next driver to charging. Port count remains same.
        await update(ref(db, `stations/${stationId}/queue/${nextDriver.id}`), {
          chargingStatus: 'charging',
        });
      } else {
        // No one is waiting, so a port becomes available.
        const newAvailablePorts = Math.min(station.totalPorts, (station.availablePorts || 0) + 1);
        const updates: Partial<Pick<Station, 'availablePorts' | 'status'>> = {
          availablePorts: newAvailablePorts,
        };
        if (newAvailablePorts > 0 && station.status !== 'offline') {
          updates.status = 'available';
        }
        await update(stationRef, updates);
      }
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
