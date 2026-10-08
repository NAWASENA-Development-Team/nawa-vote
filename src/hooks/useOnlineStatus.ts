'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Robust active + passive network connectivity detector.
 *
 * Solves the Chromium on Windows quirk where `navigator.onLine` reports `true`
 * even when disconnected from WAN / internet (due to virtual adapters, LAN, or slow NCSI).
 *
 * Features:
 * - Passive listeners for instant 'offline' / 'online' OS events.
 * - Active low-overhead heartbeat probe (`/api/ping`) with 1.5s timeout.
 * - Periodic 3s heartbeat polling and visibility/focus checks.
 * - Exposes `checkConnectivity()` for on-demand verification before critical actions.
 */
export function useOnlineStatus(): {
  isOnline: boolean;
  wasOffline: boolean;
  checkConnectivity: () => Promise<boolean>;
} {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    // If browser OS already says offline, believe it immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isOnlineRef.current) {
        setIsOnline(false);
      }
      setWasOffline(true);
      return false;
    }

    // Active probe with 1500ms timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    try {
      const res = await fetch(`/api/ping?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      const reachable = res.ok;
      if (reachable) {
        if (!isOnlineRef.current) {
          setIsOnline(true);
        }
        return true;
      } else {
        if (isOnlineRef.current) {
          setIsOnline(false);
        }
        setWasOffline(true);
        return false;
      }
    } catch {
      clearTimeout(timer);
      if (isOnlineRef.current) {
        setIsOnline(false);
      }
      setWasOffline(true);
      return false;
    }
  }, []);

  useEffect(() => {
    // 1. Initial active probe on mount
    checkConnectivity();

    // 2. OS event listeners
    const handleOnline = () => {
      // Confirm with active probe before declaring online
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    const handleFocus = () => {
      checkConnectivity();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 3. Active heartbeat interval (every 3 seconds)
    const interval = setInterval(checkConnectivity, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [checkConnectivity]);

  return { isOnline, wasOffline, checkConnectivity };
}
