'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLOR_SLOTS, resolveSlot, type ColorSlot } from '../colorSlots';
import { playBalloonRise, playBalloonPop, playReveal } from '../sounds';
import type { LiveCandidate } from '../useLiveResults';

interface BalloonInterfaceProps {
  candidates: LiveCandidate[];
  candidateColors: Record<string, ColorSlot>;
  resultsMode: 'session' | 'present';
  revealIdentity: boolean;
  lastUpdatedId: string | null;
}

interface PoppedState {
  [candidateId: string]: boolean;
}

export default function BalloonInterface({
  candidates,
  candidateColors,
  resultsMode,
  revealIdentity,
  lastUpdatedId,
}: BalloonInterfaceProps) {
  const [popped, setPopped] = useState<PoppedState>({});
  const [confettiActive, setConfettiActive] = useState(false);
  const prevRevealRef = useRef(false);

  // Play entry sound on mount
  useEffect(() => {
    candidates.forEach((_, idx) => {
      playBalloonRise(idx * 200);
    });
  }, []);

  // Trigger reveal sound and confetti when revealIdentity flips to true
  useEffect(() => {
    const isRevealed = resultsMode === 'present' || revealIdentity;
    if (isRevealed && !prevRevealRef.current) {
      playReveal();
      setConfettiActive(true);
      const timer = setTimeout(() => setConfettiActive(false), 3500);
      return () => clearTimeout(timer);
    }
    prevRevealRef.current = isRevealed;
  }, [resultsMode, revealIdentity]);

  // Calculate vote totals and max for relative balloon altitude
  const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
  const maxVotes = Math.max(...candidates.map((c) => c.vote_count || 0), 0);
  const leadingCandidateId =
    totalVotes > 0
      ? candidates.slice().sort((a, b) => b.vote_count - a.vote_count)[0]?.id
      : null;

  const handlePop = (id: string) => {
    if (popped[id]) return;
    playBalloonPop();
    setPopped((prev) => ({ ...prev, [id]: true }));

    // Re-inflate after exactly 2 seconds as decided in plan
    setTimeout(() => {
      setPopped((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const isRevealed = resultsMode === 'present' || revealIdentity;

  return (
    <div className="relative w-full h-full flex flex-col justify-end overflow-hidden px-4 md:px-12 pb-6">
      {/* 1. Confetti Layer (fires on presentation reveal) */}
      <AnimatePresence>
        {confettiActive && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {Array.from({ length: 28 }).map((_, i) => {
              const colors = ['#1e3a5f', '#f59e0b', '#10b981', '#fbbf24', '#3b82f6'];
              const randomLeft = 20 + (i % 6) * 12 + Math.random() * 8;
              const randomDelay = (i % 5) * 0.12;
              const randomDuration = 2.2 + Math.random() * 1.2;
              const randomRotate = Math.random() * 720 - 360;
              const color = colors[i % colors.length];

              return (
                <motion.div
                  key={i}
                  initial={{
                    top: '-5%',
                    left: `${randomLeft}%`,
                    opacity: 1,
                    scale: Math.random() * 0.4 + 0.8,
                    rotate: 0,
                  }}
                  animate={{
                    top: '105%',
                    opacity: [1, 1, 0],
                    rotate: randomRotate,
                  }}
                  transition={{
                    duration: randomDuration,
                    delay: randomDelay,
                    ease: 'easeIn',
                  }}
                  className="absolute w-3.5 h-3.5 rounded-sm shadow-sm"
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* 2. Balloon Stage Grid (Exactly 3 slots evenly spaced) */}
      <div className="relative w-full h-full flex items-end justify-around max-w-5xl mx-auto z-10 pb-16">
        {candidates.map((cand, idx) => {
          const slot = resolveSlot(cand.id, idx, candidateColors);
          const colors = COLOR_SLOTS[slot];
          const isPopped = !!popped[cand.id];
          const isUpdated = lastUpdatedId === cand.id;
          const isLeader = isRevealed && cand.id === leadingCandidateId && cand.vote_count > 0;

          // Altitude calculation:
          // height_pct clamped to [10%, 80%]
          // bottom_position = 12vh + (height_pct * 0.48vh)
          const voteShare = totalVotes > 0 ? (cand.vote_count / totalVotes) * 100 : 0;
          const heightRatio = maxVotes > 0 ? cand.vote_count / maxVotes : 0;
          const altitudeVh = cand.vote_count === 0 ? 6 : 10 + heightRatio * 46;

          return (
            <div
              key={cand.id}
              className="relative flex flex-col items-center justify-end h-full w-1/3 max-w-[280px]"
            >
              {/* Floating Balloon Container with dynamic bottom altitude */}
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  bottom: `${altitudeVh}vh`,
                }}
                transition={{
                  bottom: { type: 'spring', stiffness: 45, damping: 15 },
                  duration: 0.8,
                  delay: idx * 0.15,
                }}
                className="absolute flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
                style={{ bottom: `${altitudeVh}vh` }}
              >
                {/* Framer-motion Draggable Wrapper */}
                <motion.div
                  drag
                  dragSnapToOrigin
                  dragElastic={0.4}
                  whileTap={{ cursor: 'grabbing' }}
                  animate={
                    isUpdated
                      ? { scale: [1, 1.2, 1], transition: { duration: 0.45 } }
                      : isLeader
                      ? { scale: 1.1 }
                      : { scale: cand.vote_count === 0 ? 0.75 : 1.0 }
                  }
                  className="relative flex flex-col items-center"
                >
                  {/* Balloon Pop Particles or Balloon SVG */}
                  <AnimatePresence mode="wait">
                    {isPopped ? (
                      <div className="relative w-32 h-40 flex items-center justify-center">
                        {/* 8 Radial Exploding Particles */}
                        {Array.from({ length: 8 }).map((_, pIdx) => {
                          const angle = (pIdx / 8) * 2 * Math.PI;
                          const distance = 48;
                          const x = Math.cos(angle) * distance;
                          const y = Math.sin(angle) * distance;

                          return (
                            <motion.span
                              key={pIdx}
                              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                              animate={{ x, y, opacity: 0, scale: 0.3 }}
                              transition={{ duration: 0.35, ease: 'easeOut' }}
                              className="absolute w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: colors.fill }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <motion.div
                        onClick={() => handlePop(cand.id)}
                        className="animate-balloon-sway relative flex flex-col items-center group"
                        title="Klik untuk letupkan!"
                      >
                        {/* Balloon SVG */}
                        <svg
                          viewBox="0 0 100 130"
                          className="w-28 h-36 md:w-36 md:h-48 drop-shadow-md transition-transform group-hover:scale-105"
                        >
                          <defs>
                            <radialGradient
                              id={`balloon-shine-${cand.id}`}
                              cx="35%"
                              cy="30%"
                              r="60%"
                            >
                              <stop offset="0%" stopColor={colors.shine} />
                              <stop offset="85%" stopColor={colors.fill} />
                              <stop offset="100%" stopColor={colors.knot} />
                            </radialGradient>
                          </defs>

                          {/* Oval Balloon Body */}
                          <path
                            d="M 50 8 C 22 8 8 28 8 58 C 8 88 28 108 46 114 L 46 116 L 54 116 L 54 114 C 72 108 92 88 92 58 C 92 28 78 8 50 8 Z"
                            fill={`url(#balloon-shine-${cand.id})`}
                          />

                          {/* Depth Shine Highlight Ellipse */}
                          <ellipse
                            cx="32"
                            cy="36"
                            rx="12"
                            ry="20"
                            transform="rotate(-22 32 36)"
                            fill="#ffffff"
                            opacity={0.32}
                          />

                          {/* Small secondary shine glint */}
                          <circle cx="24" cy="62" r="3.5" fill="#ffffff" opacity={0.22} />

                          {/* Balloon Tie Knot */}
                          <polygon
                            points="44,116 56,116 53,123 47,123"
                            fill={colors.knot}
                          />
                        </svg>

                        {/* Floating String */}
                        <svg
                          viewBox="0 0 20 80"
                          className="w-4 h-16 md:h-20 -mt-1 stroke-slate-400 fill-none"
                          style={{ strokeWidth: 1.5 }}
                        >
                          <path d="M 10 0 Q 15 20 8 40 T 10 80" />
                        </svg>

                        {/* Percentage Pill */}
                        <div
                          className="mt-1 px-2.5 py-1 rounded-full text-xs md:text-sm font-black font-heading text-white shadow-md transition-all"
                          style={{ backgroundColor: colors.fill }}
                        >
                          {voteShare.toFixed(1)}%
                        </div>

                        {/* Name Tag (presentation mode reveal) */}
                        <AnimatePresence>
                          {isRevealed ? (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="mt-2 text-center bg-white/95 px-3 py-1.5 rounded-xl border border-brand-navy-200/80 shadow-sm max-w-[200px]"
                            >
                              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-navy-400 font-heading">
                                No. {cand.ordinal_number}
                              </div>
                              <div className="text-xs md:text-sm font-black text-brand-navy-900 truncate font-heading">
                                {cand.name}
                              </div>
                              <div className="text-[11px] font-bold text-brand-navy-600 mt-0.5">
                                {cand.vote_count.toLocaleString('id-ID')} suara
                              </div>
                            </motion.div>
                          ) : (
                            <div className="mt-2 text-center bg-white/60 px-2.5 py-1 rounded-lg border border-brand-navy-100 text-brand-navy-400 text-[11px] font-bold">
                              Slot {slot}
                            </div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Ground Anchor Plate */}
              <div className="absolute bottom-2 flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: colors.fill }}
                />
                <span className="text-[10px] font-bold text-brand-navy-400 mt-1 uppercase font-heading">
                  {isRevealed ? `Kandidat ${cand.ordinal_number}` : `Warna ${slot}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Stage Ground Line */}
      <div className="absolute bottom-12 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-navy-200 to-transparent z-0" />
    </div>
  );
}
