'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import type { Station } from '@/types';

export default function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const stationsRef = ref(db, 'stations');

    const listener = onValue(
      stationsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const stationsArray: Station[] = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
            setStations(stationsArray);
          } else {
            setStations([]);
          }
        } catch (e) {
          setError(e instanceof Error ? e : new Error('Failed to parse station data.'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      off(stationsRef, 'value', listener);
    };
  }, []);

  return { stations, loading, error };
}
