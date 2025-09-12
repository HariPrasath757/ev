'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import type { Station } from '@/types';

export default function useStation(stationId: string | null) {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!stationId) {
      setLoading(false);
      setStation(null);
      return;
    }

    setLoading(true);
    const stationRef = ref(db, `stations/${stationId}`);

    const listener = onValue(
      stationRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            setStation({ id: stationId, ...data });
          } else {
            setStation(null);
            setError(new Error(`Station with ID "${stationId}" not found.`));
          }
        } catch (e) {
          setError(e instanceof Error ? e : new Error('Failed to parse station data.'));
          setStation(null);
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
      off(stationRef, 'value', listener);
    };
  }, [stationId]);

  return { station, loading, error };
}
