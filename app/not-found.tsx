'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    window.location.href = 'https://bangdb.com';
  }, []);

  return null;
}
