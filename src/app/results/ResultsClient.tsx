'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

export default function ResultsClient({
  initialRawConfig,
  initialCandidates,
  initialTotalVotesCast,
}: ResultsClientProps) {
  const config = useSystemConfig(initialRawConfig);
  const { candidates, totalVotesCast, lastUpdatedId } = useLiveResults(
    initialCandidates,
    initialTotalVotesCast,
    config.activeJabatan
  );

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

  return (
    <InterfaceShell
      activeJabatan={config.activeJabatan}
      activeInterface={currentInterface}
      onToggleInterface={handleManualToggle}
      totalVotesCast={totalVotesCast}
      cycleProgress={cycleProgress}
      isCycling={isCycling}
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
                resultsMode={config.resultsMode}
                revealIdentity={config.revealIdentity}
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
                resultsMode={config.resultsMode}
                revealIdentity={config.revealIdentity}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </InterfaceShell>
  );
}
