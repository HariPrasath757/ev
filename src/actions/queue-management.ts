'use server';

import { db } from '@/lib/firebase/config';
import type { Station, QueueEntry } from '@/types';
import { get, ref, set, push, remove } from 'firebase/database';

/**
 * Adds a driver to the station's queue.
 */
export async function addDriverToQueue(
  stationId: string,
  vehicleInfo: { userId: string; vehicle: string }
) {
  const stationRef = ref(db, `stations/${stationId}`);
  const snapshot = await get(stationRef);

  if (!snapshot.exists()) {
    return { success: false, message: 'Station not found.' };
  }

  const station: Station = { id: stationId, ...snapshot.val() };
  
  if (station.availablePorts <= 0) {
    return { success: false, message: 'No available ports to add a new driver.' };
  }

  const newDriverRef = push(ref(db, `stations/${stationId}/queue`));
  const newDriver: Omit<QueueEntry, 'chargingStatus'> & { chargingStatus: 'charging' | 'waiting' } = {
    ...vehicleInfo,
    joinedAt: new Date().toISOString(),
    chargingStatus: 'charging', 
  };
  
  await set(newDriverRef, newDriver);

  // Decrement available ports
  await set(ref(db, `stations/${stationId}/availablePorts`), station.availablePorts - 1);
  
  // Update station status if it was fully available
  if (station.availablePorts - 1 === 0) {
    await set(ref(db, `stations/${stationId}/status`), 'occupied');
  }

  return { success: true, message: 'Driver added successfully.' };
}

/**
 * Removes a driver from the station's queue.
 */
export async function removeDriverFromQueue(stationId: string, driverId: string) {
  const driverRef = ref(db, `stations/${stationId}/queue/${driverId}`);
  const stationRef = ref(db, `stations/${stationId}`);
  
  const stationSnapshot = await get(stationRef);
  if (!stationSnapshot.exists()) {
    return { success: false, message: 'Station not found.' };
  }
  const station: Station = { id: stationId, ...stationSnapshot.val() };

  await remove(driverRef);

  // Increment available ports, ensuring it doesn't exceed totalPorts
  const newAvailablePorts = Math.min(station.totalPorts, station.availablePorts + 1);
  await set(ref(db, `stations/${stationId}/availablePorts`), newAvailablePorts);
  
  // Update station status if it was occupied and now has ports
  if (newAvailablePorts > 0 && station.status !== 'offline') {
     await set(ref(db, `stations/${stationId}/status`), 'available');
  }

  return { success: true, message: 'Driver removed successfully.' };
}
