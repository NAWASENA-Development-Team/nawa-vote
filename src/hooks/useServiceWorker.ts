'use client';

import { useEffect } from 'react';

/**
 * Registers the NAWA-VOTE service worker for offline voter support.
 *
 * Call this hook once in any voter-facing client component (e.g. VoteWizard).
 * It is a no-op in:
 *   - SSR environments (no window)
 *   - Browsers without SW support
 *   - Subsequent renders (registration is idempotent per origin)
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Trigger an update check silently — no UI impact
        reg.update().catch(() => {});
      })
      .catch(() => {
        // SW registration failure is non-fatal; app still works online
      });
  }, []);
}
