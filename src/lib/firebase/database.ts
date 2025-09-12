import { ref, push, set } from 'firebase/database';
import { db } from './config';
import type { Report } from '@/types';

// Hardcoded users for login as per requirements
export const PREDEFINED_USERS = [
  { id: 'user1', username: 'citycentercharger', password: 'city@123' },
  { id: 'user2', username: 'mallcharger', password: 'mall@123' },
  { id: 'user3', username: 'thundercharger', password: 'thunder@123' },
];

/**
 * Adds a new report to the '/reports' path in Firebase Realtime Database.
 * @param report The report object to be added.
 */
export async function addReport(report: Omit<Report, 'id'>) {
  try {
    const reportsRef = ref(db, 'reports');
    const newReportRef = push(reportsRef);
    await set(newReportRef, report);
  } catch (error) {
    console.error('Error adding report to Firebase:', error);
    throw new Error('Could not save the report to the database.');
  }
}
