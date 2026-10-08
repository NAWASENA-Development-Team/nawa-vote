'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSystemConfig } from './useSystemConfig';
import { useLiveResults, type LiveCandidate } from './useLiveResults';
import { playInterfaceSwitch } from './sounds';
import InterfaceShell from './interfaces/InterfaceShell';
import BalloonInterface from './interfaces/BalloonInterface';
import BarChartInterface from './interfaces/BarChartInterface';

interface ResultsClientProps {
  initialRawConfig: Record<string, string | undefined>;
  initialCandidates: LiveCandidate[];
  initialTotalVotesCast: number;
  isAdmin?: boolean;
}

export default function ResultsClient({
  initialRawConfig,
  initialCandidates,
  initialTotalVotesCast,
  isAdmin = false,
}: ResultsClientProps) {
  const config = useSystemConfig(initialRawConfig);
  const { candidates, totalVotesCast, lastUpdatedId } = useLiveResults(
    initialCandidates,
    initialTotalVotesCast,
    config.activeJabatan
  );

  // Admin status check (SSR prop + client-side session fallback)
  const [isAdminUser, setIsAdminUser] = useState<boolean>(Boolean(isAdmin));

  useEffect(() => {
    const checkClientAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const role = session?.user?.app_metadata?.role;
        if (role === 'admin' || role === 'supervisor') {
          setIsAdminUser(true);
        }
      } catch (err) {
        // Fallback to SSR prop value
      }
    };
    checkClientAuth();
  }, []);

  // Temporary in-memory override for presentation mode (disappears on refresh)
  const [adminModeOverride, setAdminModeOverride] = useState<'session' | 'present' | null>(null);

  const effectiveResultsMode = adminModeOverride ?? config.resultsMode;
  const effectiveRevealIdentity =
    adminModeOverride !== null
      ? adminModeOverride === 'present'
      : config.revealIdentity;

  const handleToggleResultsMode = () => {
    setAdminModeOverride((prev) => {
      const current = prev ?? config.resultsMode;
      return current === 'present' ? 'session' : 'present';
    });
  };

  const handleResetModeOverride = () => {
    setAdminModeOverride(null);
  };

  // Active displayed interface
  const [currentInterface, setCurrentInterface] = useState<'balloon' | 'barchart'>(() => {
    if (config.activeInterface === 'barchart') return 'barchart';
    return 'balloon';
  });

  const [cycleProgress, setCycleProgress] = useState(0);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when admin forces a specific interface
  useEffect(() => {
    if (config.activeInterface === 'balloon') {
      setCurrentInterface('balloon');
      setCycleProgress(0);
    } else if (config.activeInterface === 'barchart') {
      setCurrentInterface('barchart');
      setCycleProgress(0);
    }
  }, [config.activeInterface]);

  // Auto-cycle engine when active_interface === 'cycle'
  useEffect(() => {
    if (config.activeInterface !== 'cycle') {
      setCycleProgress(0);
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      return;
    }

    const intervalSeconds = Math.max(5, config.cycleInterval || 30);
    const tickMs = 200;
    const totalTicks = (intervalSeconds * 1000) / tickMs;
    let currentTick = 0;

    cycleTimerRef.current = setInterval(() => {
      currentTick += 1;
      const progress = (currentTick / totalTicks) * 100;
      setCycleProgress(progress);

      if (currentTick >= totalTicks) {
        currentTick = 0;
        setCycleProgress(0);
        setCurrentInterface((prev) => {
          const next = prev === 'balloon' ? 'barchart' : 'balloon';
          playInterfaceSwitch();
          return next;
        });
      }
    }, tickMs);

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [config.activeInterface, config.cycleInterval]);

  const handleManualToggle = () => {
    setCurrentInterface((prev) => {
      const next = prev === 'balloon' ? 'barchart' : 'balloon';
      playInterfaceSwitch();
      return next;
    });
    setCycleProgress(0);
  };

  const isCycling = config.activeInterface === 'cycle';

  if (!config.showResults) {
    return (
      <div className="min-h-screen bg-brand-navy-50 flex items-center justify-center p-6 select-none font-body">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-sm text-center max-w-lg border border-brand-navy-100"
        >
          <div className="w-16 h-16 bg-brand-amber-100 text-brand-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-brand-navy-900 mb-3 font-heading">
            Hasil Belum Dipublikasikan
          </h2>
          <p className="text-brand-navy-500 font-medium">
            Panitia belum membuka akses untuk melihat hasil pemilu live. Layar ini akan otomatis memperbarui saat akses dibuka.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <InterfaceShell
      activeJabatan={config.activeJabatan}
      activeInterface={currentInterface}
      onToggleInterface={handleManualToggle}
      totalVotesCast={totalVotesCast}
      cycleProgress={cycleProgress}
      isCycling={isCycling}
      isAdmin={isAdminUser}
      resultsMode={effectiveResultsMode}
      onToggleResultsMode={handleToggleResultsMode}
      isModeOverridden={adminModeOverride !== null}
      onResetModeOverride={handleResetModeOverride}
    >
      {candidates.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="bg-white/80 p-8 rounded-2xl border border-brand-navy-100 max-w-md shadow-sm">
            <h3 className="text-lg font-bold text-brand-navy-900 font-heading mb-2">
              Belum Ada Data Kandidat
            </h3>
            <p className="text-sm text-brand-navy-500 font-medium">
              Tidak ada kandidat terdaftar untuk kategori ini atau belum ada suara masuk.
            </p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {currentInterface === 'balloon' ? (
            <motion.div
              key="balloon-scene"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <BalloonInterface
                candidates={candidates}
                candidateColors={config.candidateColors}
                resultsMode={effectiveResultsMode}
                revealIdentity={effectiveRevealIdentity}
                lastUpdatedId={lastUpdatedId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="barchart-scene"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <BarChartInterface
                candidates={candidates}
                candidateColors={config.candidateColors}
                resultsMode={effectiveResultsMode}
                revealIdentity={effectiveRevealIdentity}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </InterfaceShell>
  );
}
