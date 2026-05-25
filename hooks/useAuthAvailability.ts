'use client';

import { useEffect, useState } from 'react';

interface Availability {
  google: boolean;
  apple: boolean;
}

export function useAuthAvailability(): Availability {
  const [data, setData] = useState<Availability>({ google: true, apple: false });

  useEffect(() => {
    fetch('/api/auth/availability')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData({ google: Boolean(d.google), apple: Boolean(d.apple) });
      })
      .catch(() => {});
  }, []);

  return data;
}
