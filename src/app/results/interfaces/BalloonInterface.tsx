'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLOR_SLOTS,
  resolveSlot,
  type ColorSlot,
  type SlotColors,
} from '../colorSlots';
import { playBalloonRise, playBalloonPop, playReveal } from '../sounds';
import type { LiveCandidate } from '../useLiveResults';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BalloonInterfaceProps {
  candidates: LiveCandidate[];
  candidateColors: Record<string, ColorSlot>;
  resultsMode: 'session' | 'present';
  revealIdentity: boolean;
  lastUpdatedId: string | null;
}

interface BalloonInstance {
  uid: string;
  candidateId: string;
  /** Short 4-char alphanumeric code representing the token used for this vote. */
  tokenCode: string;
  /** Horizontal start position as a left% value (5–85). */
  x: number;
  /** Total rise duration in seconds (8–13). */
  duration: number;
  /** Horizontal sway amplitude in px (12–28). */
  swayAmount: number;
  popped: boolean;
  /** Container-relative px position where pop was triggered. */
  popX?: number;
  popY?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let uidCounter = 0;
function nextUid(): string {
  return `b-${++uidCounter}-${Date.now()}`;
}

function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomToken(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function makeBalloon(candidateId: string): BalloonInstance {
  return {
    uid: nextUid(),
    candidateId,
    tokenCode: randomToken(),
    x: rnd(5, 85),
    duration: rnd(8, 13),
    swayAmount: rnd(12, 28),
    popped: false,
  };
}

// ── BalloonActor ──────────────────────────────────────────────────────────────
// Renders a single flying balloon. The outer motion.div handles vertical rise;
// the inner motion.div handles independent horizontal sway.

interface BalloonActorProps {
  balloon: BalloonInstance;
  cand: LiveCandidate;
  colors: SlotColors;
  tokenTextColor: string;
  isRevealed: boolean;
  onPop: (uid: string, e: React.MouseEvent) => void;
  onComplete: (uid: string) => void;
}

function BalloonActor({
  balloon,
  cand,
  colors,
  tokenTextColor,
  isRevealed,
  onPop,
  onComplete,
}: BalloonActorProps) {
  const gradId = `bshine-${balloon.uid}`;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${balloon.x}%`, bottom: '72px' }}
      initial={{ y: 60 }}
      animate={{ y: -2400 }}
      transition={{ duration: balloon.duration, ease: 'linear' }}
      onAnimationComplete={() => onComplete(balloon.uid)}
    >
      {/* Sway layer — independent duration, loops for the full flight */}
      <motion.div
        animate={{
          x: [0, balloon.swayAmount, -balloon.swayAmount * 0.7, balloon.swayAmount * 0.4, 0],
        }}
        transition={{
          duration: balloon.duration * 0.55,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="flex flex-col items-center cursor-pointer pointer-events-auto select-none"
        onClick={(e) => onPop(balloon.uid, e)}
        title="Klik untuk letupkan!"
      >
        {/* Revealed candidate name tag */}
        {isRevealed && (
          <div className="mb-0.5 text-center bg-white/90 px-2 py-0.5 rounded-md shadow-sm max-w-[110px]">
            <div className="text-[8px] font-bold uppercase tracking-wide text-brand-navy-500 font-heading">
              No. {cand.ordinal_number}
            </div>
            <div className="text-[10px] font-black text-brand-navy-900 truncate font-heading">
              {cand.name}
            </div>
          </div>
        )}

        {/* Balloon body SVG */}
        <svg viewBox="0 0 100 130" className="w-20 h-28 md:w-24 md:h-32 drop-shadow-md">
          <defs>
            <radialGradient id={gradId} cx="35%" cy="30%" r="60%">
              <stop offset="0%"   stopColor={colors.shine} />
              <stop offset="85%"  stopColor={colors.fill}  />
              <stop offset="100%" stopColor={colors.knot}  />
            </radialGradient>
          </defs>
          {/* Oval balloon body */}
          <path
            d="M 50 8 C 22 8 8 28 8 58 C 8 88 28 108 46 114 L 46 116 L 54 116 L 54 114 C 72 108 92 88 92 58 C 92 28 78 8 50 8 Z"
            fill={`url(#${gradId})`}
          />
          {/* Shine highlight ellipse */}
          <ellipse
            cx="32" cy="36" rx="12" ry="20"
            transform="rotate(-22 32 36)"
            fill="#ffffff" opacity={0.32}
          />
          {/* Secondary glint */}
          <circle cx="24" cy="62" r="3.5" fill="#ffffff" opacity={0.22} />
          {/* Tie knot */}
          <polygon points="44,116 56,116 53,123 47,123" fill={colors.knot} />
        </svg>

        {/* String */}
        <svg
          viewBox="0 0 20 56"
          className="w-3 h-10 fill-none -mt-0.5"
          style={{ stroke: colors.string, strokeWidth: 1.5 }}
        >
          <path d="M 10 0 Q 14 14 8 28 T 10 56" />
        </svg>

        {/* Token tag — physically tied to the bottom of the string */}
        <div
          className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow border border-black/10 -mt-0.5 whitespace-nowrap"
          style={{ backgroundColor: colors.fill, color: tokenTextColor }}
        >
          {balloon.tokenCode}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PoppedBalloon ─────────────────────────────────────────────────────────────
// Renders the pop burst + falling token at the position the balloon was clicked.
// Token falls and fades; onComplete fires when the fall animation finishes.

interface PoppedBalloonProps {
  balloon: BalloonInstance;
  colors: SlotColors;
  tokenTextColor: string;
  onComplete: (uid: string) => void;
}

function PoppedBalloon({ balloon, colors, tokenTextColor, onComplete }: PoppedBalloonProps) {
  // Capture random fall rotation once on mount so it stays stable across renders
  const fallRotation = useRef(rnd(-40, 40)).current;

  const popX = balloon.popX ?? 200;
  const popY = balloon.popY ?? 300;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${popX}px`, top: `${popY}px` }}
    >
      {/* 8 radial burst particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const dist = 52;
        return (
          <motion.span
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.fill }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        );
      })}

      {/* Token falls away as if gravity pulled it free from the burst */}
      <motion.div
        className="absolute px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow border border-black/10 whitespace-nowrap"
        style={{ backgroundColor: colors.fill, color: tokenTextColor, left: '-20px', top: '8px' }}
        initial={{ y: 0, rotate: 0, opacity: 1 }}
        animate={{ y: 340, rotate: fallRotation, opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeIn' }}
        onAnimationComplete={() => onComplete(balloon.uid)}
      >
        {balloon.tokenCode}
      </motion.div>
    </div>
  );
}

// ── BalloonInterface ──────────────────────────────────────────────────────────
// Manages the full balloon canvas. Spawns one balloon per candidate on mount
// and one new balloon per incoming vote (tracked via vote_count deltas).

export default function BalloonInterface({
  candidates,
  candidateColors,
  resultsMode,
  revealIdentity,
  lastUpdatedId,
}: BalloonInterfaceProps) {
  const [balloons, setBalloons] = useState<BalloonInstance[]>([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRevealRef = useRef(false);
  const prevVoteCountsRef = useRef<Record<string, number>>({});
  const initializedRef = useRef(false);

  const isRevealed = resultsMode === 'present' || revealIdentity;

  const spawnBalloon = useCallback((candidateId: string) => {
    setBalloons(prev => [...prev, makeBalloon(candidateId)]);
    playBalloonRise(0);
  }, []);

  const removeBalloon = useCallback((uid: string) => {
    setBalloons(prev => prev.filter(b => b.uid !== uid));
  }, []);

  const handlePop = useCallback((uid: string, e: React.MouseEvent) => {
    let popX: number | undefined;
    let popY: number | undefined;
    const containerEl = containerRef.current;
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect();
      popX = e.clientX - rect.left;
      popY = e.clientY - rect.top;
    }
    setBalloons(prev =>
      prev.map(b => b.uid === uid ? { ...b, popped: true, popX, popY } : b)
    );
    playBalloonPop();
  }, []);

  // Welcome wave — one balloon per candidate, staggered, on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    candidates.forEach((cand, idx) => {
      prevVoteCountsRef.current[cand.id] = cand.vote_count;
      setTimeout(() => spawnBalloon(cand.id), idx * 350);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-vote balloon spawn — watch vote_count deltas across all candidates
  useEffect(() => {
    if (!initializedRef.current) return;
    candidates.forEach(cand => {
      const prev = prevVoteCountsRef.current[cand.id];
      if (prev === undefined) {
        prevVoteCountsRef.current[cand.id] = cand.vote_count;
        return;
      }
      if (cand.vote_count > prev) {
        // Spawn one balloon per new vote, capped at 5 per update to avoid flood
        const delta = Math.min(cand.vote_count - prev, 5);
        for (let i = 0; i < delta; i++) {
          setTimeout(() => spawnBalloon(cand.id), i * 280);
        }
        prevVoteCountsRef.current[cand.id] = cand.vote_count;
      }
    });
  }, [candidates, spawnBalloon]);

  // Reveal sound + confetti burst
  useEffect(() => {
    const revealed = resultsMode === 'present' || revealIdentity;
    if (revealed && !prevRevealRef.current) {
      playReveal();
      setConfettiActive(true);
      const t = setTimeout(() => setConfettiActive(false), 3500);
      return () => clearTimeout(t);
    }
    prevRevealRef.current = revealed;
  }, [resultsMode, revealIdentity]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Confetti layer — fires once on presentation reveal */}
      <AnimatePresence>
        {confettiActive && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {Array.from({ length: 28 }).map((_, i) => {
              const confettiColors = ['#1e3a5f', '#f59e0b', '#10b981', '#fbbf24', '#3b82f6'];
              const left = 20 + (i % 6) * 12 + Math.random() * 8;
              const delay = (i % 5) * 0.12;
              const duration = 2.2 + Math.random() * 1.2;
              const rotate = Math.random() * 720 - 360;
              return (
                <motion.div
                  key={i}
                  initial={{
                    top: '-5%',
                    left: `${left}%`,
                    opacity: 1,
                    scale: Math.random() * 0.4 + 0.8,
                    rotate: 0,
                  }}
                  animate={{ top: '105%', opacity: [1, 1, 0], rotate }}
                  transition={{ duration, delay, ease: 'easeIn' }}
                  className="absolute w-3.5 h-3.5 rounded-sm shadow-sm"
                  style={{ backgroundColor: confettiColors[i % confettiColors.length] }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Balloon canvas — each instance is independent */}
      {balloons.map(balloon => {
        const cand = candidates.find(c => c.id === balloon.candidateId);
        if (!cand) return null;

        const slotIndex = candidates.findIndex(c => c.id === balloon.candidateId);
        const slot = resolveSlot(balloon.candidateId, slotIndex, candidateColors);
        const colors = COLOR_SLOTS[slot];
        // Amber (#f59e0b) is a light fill — use dark navy text for WCAG AA contrast
        const tokenTextColor = slot === 'B' ? '#1e3a5f' : '#ffffff';

        if (balloon.popped) {
          return (
            <PoppedBalloon
              key={balloon.uid}
              balloon={balloon}
              colors={colors}
              tokenTextColor={tokenTextColor}
              onComplete={removeBalloon}
            />
          );
        }

        return (
          <BalloonActor
            key={balloon.uid}
            balloon={balloon}
            cand={cand}
            colors={colors}
            tokenTextColor={tokenTextColor}
            isRevealed={isRevealed}
            onPop={handlePop}
            onComplete={removeBalloon}
          />
        );
      })}
    </div>
  );
}
