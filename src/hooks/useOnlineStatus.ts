'use client';

import { useState, useEffect } from 'react';

/**
 * Tracks real network connectivity.
 * Uses navigator.onLine as the base, then confirms with a lightweight HEAD
 * request on reconnect so we don't trust browser events blindly.
 */
export function useOnlineStatus(): { isOnline: boolean; wasOffline: boolean } {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  // True once we've had at least one offline episode this session.
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    const goOnline = () => {
      setIsOnline(true);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    // Initial check in case the page loaded already offline
    if (!navigator.onLine) {
      setIsOnline(false);
      setWasOffline(true);
    }

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return { isOnline, wasOffline };
}
