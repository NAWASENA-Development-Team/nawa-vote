'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeftRight } from 'lucide-react';
import NawaLogo from '@/components/NawaLogo';
import { JABATAN_LABELS } from '../colorSlots';
import { unlockAudio, muteAudio, isMuted } from '../sounds';

interface InterfaceShellProps {
  activeJabatan: string;
  activeInterface: 'balloon' | 'barchart';
  onToggleInterface: () => void;
  totalVotesCast: number;
  cycleProgress?: number;
  isCycling?: boolean;
  children: React.ReactNode;
}

export default function InterfaceShell({
  activeJabatan,
  activeInterface,
  onToggleInterface,
  totalVotesCast,
  cycleProgress = 0,
  isCycling = false,
  children,
}: InterfaceShellProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [soundActive, setSoundActive] = useState<boolean>(false);

  // Live clock with seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    if (isMuted()) {
      unlockAudio();
      setSoundActive(true);
    } else {
      muteAudio();
      setSoundActive(false);
    }
  };

  const jabatanTitle = JABATAN_LABELS[activeJabatan] || 'Ketua OSIS 2025/2026';

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-gradient-to-b from-brand-navy-50/80 via-white to-brand-navy-50/40 select-none text-brand-navy-950 font-body">
      {/* 1. Top Header Strip (16:9 optimized, responsive down to phone) */}
      <header className="h-16 md:h-18 px-4 md:px-8 border-b border-brand-navy-100/80 bg-white/90 backdrop-blur-sm flex items-center justify-between shrink-0 z-20 shadow-sm">
        {/* Left: Brand & Jabatan */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand-navy-900 text-white shadow-sm shrink-0">
            <NawaLogo className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-amber-600 font-heading truncate">
              NAWA-VOTE LIVE
            </div>
            <h1 className="text-base md:text-xl font-black text-brand-navy-900 font-heading truncate tracking-tight">
              {jabatanTitle}
            </h1>
          </div>
        </div>

        {/* Center: Live Clock (Readable at IFP distance) */}
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-brand-navy-100/60 border border-brand-navy-200/60 font-mono text-sm md:text-lg font-bold text-brand-navy-800 shadow-inner">
          <span className="text-xs md:text-sm text-brand-navy-500">🕐</span>
          <span>{timeStr || '--:--:--'}</span>
        </div>

        {/* Right: Audio Toggle & Interface Switch */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleToggleSound}
            aria-label={soundActive ? 'Mute audio' : 'Unmute audio'}
            className={`p-2 md:px-3 md:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              soundActive
                ? 'bg-brand-emerald-50 text-brand-emerald-700 border-brand-emerald-200 shadow-sm'
                : 'bg-white text-brand-navy-500 border-brand-navy-200 hover:bg-brand-navy-50'
            }`}
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-brand-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundActive ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          <button
            onClick={onToggleInterface}
            aria-label="Ganti tampilan visual"
            className="px-2.5 py-2 md:px-3.5 md:py-2 rounded-xl text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-brand-amber-400" />
            <span className="hidden sm:inline">
              {activeInterface === 'balloon' ? 'Lihat Bar Chart' : 'Lihat Balon'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Canvas */}
      <main className="relative flex-1 w-full overflow-hidden flex flex-col justify-between">
        {children}
      </main>

      {/* 3. Bottom Counter Strip */}
      <footer className="h-12 md:h-14 px-4 md:px-8 border-t border-brand-navy-100/80 bg-white/95 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-navy-600">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-emerald-500 animate-pulse" />
          <span>Suara Masuk:</span>
          <span className="font-heading font-black text-brand-navy-900 text-sm md:text-base">
            {totalVotesCast.toLocaleString('id-ID')}
          </span>
          <span className="text-brand-navy-400">pemilih telah berpartisipasi</span>
        </div>

        {isCycling && (
          <div className="text-[11px] md:text-xs font-semibold text-brand-navy-400 flex items-center gap-1.5">
            <span>Auto-siklus</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-navy-300" />
          </div>
        )}
      </footer>

      {/* 4. Bottom Cycle Progress Bar */}
      {isCycling && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-navy-100 z-30">
          <div
            className="h-full bg-brand-amber-500 transition-all duration-300 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, cycleProgress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
