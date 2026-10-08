'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, ArrowLeftRight } from 'lucide-react';
import NawaLogo from '@/components/NawaLogo';
import { JABATAN_LABELS } from '../colorSlots';
import { unlockAudio, muteAudio, isMuted } from '../sounds';

// ── Cartoon cloud definitions ─────────────────────────────────────────────────
// Each cloud drifts independently. Amplitude controls how far it drifts left/right.
// Reason: independent durations prevent synchronized movement that reads as a looping template.
const CLOUDS = [
  { id: 'c1', x: 4,  y: 6,  scale: 1.3,  duration: 28, delay: 0,  amplitude: 55 },
  { id: 'c2', x: 32, y: 13, scale: 0.85, duration: 22, delay: 7,  amplitude: 38 },
  { id: 'c3', x: 58, y: 4,  scale: 1.05, duration: 34, delay: 2,  amplitude: 48 },
  { id: 'c4', x: 76, y: 16, scale: 0.72, duration: 20, delay: 11, amplitude: 32 },
] as const;

function CartoonCloud({
  x, y, scale, duration, delay, amplitude,
}: (typeof CLOUDS)[number]) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, scale }}
      animate={{ x: [0, amplitude, 0, -amplitude * 0.55, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Puffy cartoon cloud built from overlapping ellipses */}
      <svg
        viewBox="0 0 150 75"
        className="w-40 h-20 opacity-90"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="75"  cy="60"  rx="62" ry="22" />
        <ellipse cx="48"  cy="46"  rx="34" ry="26" />
        <ellipse cx="88"  cy="38"  rx="32" ry="24" />
        <ellipse cx="64"  cy="32"  rx="28" ry="22" />
        <ellipse cx="108" cy="50"  rx="26" ry="20" />
      </svg>
    </motion.div>
  );
}

// ── Grass strip SVG (static, deterministic spike positions) ──────────────────
// Wavy top edge gives the hand-drawn cartoon look without an image file.
function GrassStrip() {
  return (
    <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-20 md:h-28"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back grass layer — brighter green */}
        <path
          d="M0,45 Q80,28 160,40 T320,34 T480,42 T640,30 T800,38 T960,28 T1120,36 T1280,32 T1440,38 L1440,120 L0,120 Z"
          fill="#4ade80"
        />
        {/* Front grass layer — darker green, gives depth */}
        <path
          d="M0,62 Q80,46 160,58 T320,52 T480,60 T640,48 T800,56 T960,46 T1120,54 T1280,50 T1440,56 L1440,120 L0,120 Z"
          fill="#22c55e"
        />
        {/* Tuft spikes along the front edge — deterministic via Math.sin */}
        {Array.from({ length: 24 }).map((_, i) => {
          const bx = (i / 23) * 1440;
          const by = 58 - Math.abs(Math.sin(i * 1.9)) * 9;
          return (
            <polygon
              key={i}
              points={`${bx - 7},${by + 12} ${bx},${by - 5} ${bx + 7},${by + 12}`}
              fill="#16a34a"
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── InterfaceShell ────────────────────────────────────────────────────────────
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
  const isBalloon = activeInterface === 'balloon';

  return (
    <div
      className={`relative flex flex-col h-screen w-screen overflow-hidden select-none text-brand-navy-950 font-body transition-colors duration-500 ${
        isBalloon
          ? 'bg-[#87CEEB]'
          : 'bg-gradient-to-b from-brand-navy-50/80 via-white to-brand-navy-50/40'
      }`}
    >
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

        {/* Center: Live Clock (readable at IFP distance) */}
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
        {/* Cartoon scenery layer (balloon mode only) — clouds behind balloons, grass in front */}
        {isBalloon && (
          <>
            {/* Sky clouds (z-0 — behind everything) */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {CLOUDS.map(cloud => (
                <CartoonCloud key={cloud.id} {...cloud} />
              ))}
            </div>

            {/* Grass strip (z-20 — in front of balloons, creating launch-from-ground illusion) */}
            <GrassStrip />
          </>
        )}

        {/* Content (children: BalloonInterface or BarChartInterface) */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
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
