'use client';

import { useEffect } from 'react';
import { seedDatabase } from '@/lib/seed';

export function SeedClient() {
  useEffect(() => {
    seedDatabase().catch((err) => console.error('seed failed', err));
  }, []);
  return null;
}
