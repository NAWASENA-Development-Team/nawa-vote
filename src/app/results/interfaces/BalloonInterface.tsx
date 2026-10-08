'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
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
  tokenLabel: string;
  x: number;
  duration: number;
  swayAmount: number;
  popped: boolean;
  popX?: number;
  popY?: number;
}

// Reveal sequence: candidates sorted asc by votes.
// Roles: everything except last two = 'pop', second-to-last = 'flyoff', last = 'winner'.
type RevealRole = 'pop' | 'flyoff' | 'winner';
interface RevealCandidate {
  cand: LiveCandidate;
  colors: SlotColors;
  tokenTextColor: string;
  role: RevealRole;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let uidCounter = 0;
function nextUid(): string { return `b-${++uidCounter}-${Date.now()}`; }
function rnd(min: number, max: number): number { return min + Math.random() * (max - min); }
function makeBalloon(candidateId: string): BalloonInstance {
  return {
    uid: nextUid(),
    candidateId,
    tokenLabel: '✓ TOKEN',
    x: rnd(5, 85),
    duration: rnd(8, 13),
    swayAmount: rnd(12, 28),
    popped: false,
  };
}

// ── Presentation Reveal Components ────────────────────────────────────────────

/** Large balloon used in reveal sequences — no flying behaviour. */
function RevealBalloonShape({
  colors, gradId, size = 'lg',
}: { colors: SlotColors; gradId: string; size?: 'lg' | 'xl' }) {
  const cls = size === 'xl'
    ? 'w-36 h-48 md:w-48 md:h-64 drop-shadow-xl'
    : 'w-28 h-40 md:w-36 md:h-48 drop-shadow-lg';
  return (
    <svg viewBox="0 0 100 130" className={cls}>
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="60%">
          <stop offset="0%"   stopColor={colors.shine} />
          <stop offset="85%"  stopColor={colors.fill} />
          <stop offset="100%" stopColor={colors.knot} />
        </radialGradient>
      </defs>
      <path
        d="M 50 8 C 22 8 8 28 8 58 C 8 88 28 108 46 114 L 46 116 L 54 116 L 54 114 C 72 108 92 88 92 58 C 92 28 78 8 50 8 Z"
        fill={`url(#${gradId})`}
      />
      <ellipse cx="32" cy="36" rx="12" ry="20" transform="rotate(-22 32 36)" fill="#ffffff" opacity={0.32} />
      <circle cx="24" cy="62" r="3.5" fill="#ffffff" opacity={0.22} />
      <polygon points="44,116 56,116 53,123 47,123" fill={colors.knot} />
    </svg>
  );
}

/** Name card hung below the balloon. */
function NameCard({ cand, rank }: { cand: LiveCandidate; rank?: string }) {
  return (
    <div className="flex flex-col items-center bg-white rounded-2xl border-2 border-brand-navy-100 shadow-lg px-4 py-2.5 min-w-[140px] md:min-w-[180px] text-center mt-1">
      {rank && (
        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-amber-500 font-heading mb-0.5">
          {rank}
        </div>
      )}
      <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-brand-navy-400 font-heading">
        No. {cand.ordinal_number}
      </div>
      <div className="text-sm md:text-base font-black text-brand-navy-900 font-heading leading-tight">
        {cand.name}
      </div>
      <div className="text-xs font-bold text-brand-navy-500 mt-0.5">
        {cand.vote_count.toLocaleString('id-ID')} suara
      </div>
    </div>
  );
}

/** String SVG connecting balloon to name card. */
function String({ colors }: { colors: SlotColors }) {
  return (
    <svg viewBox="0 0 20 64" className="w-3 h-14 fill-none -mt-0.5" style={{ stroke: colors.string, strokeWidth: 1.5 }}>
      <path d="M 10 0 Q 14 16 8 32 T 10 64" />
    </svg>
  );
}

// ── Pop balloon (loser): rises to top, pops, name falls ─────────────────────
function PopRevealBalloon({
  rc, position, onComplete,
}: { rc: RevealCandidate; position: number; onComplete: () => void }) {
  const [scope, animate] = useAnimate();
  const [phase, setPhase] = useState<'rising' | 'popped'>('rising');
  const fallRotation = useRef(rnd(-45, 45)).current;
  const gradId = `rev-pop-${rc.cand.id}`;

  useEffect(() => {
    playBalloonRise(0);

    async function run() {
      // Rise to near the top (hits header area)
      await animate(scope.current, { y: [600, -520] }, {
        duration: 2.8, ease: [0.25, 0.46, 0.45, 0.94],
      });
      playBalloonPop();
      setPhase('popped');
    }
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Horizontal position: stagger multiple losers across the stage
  const leftPct = 20 + position * 30;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {phase === 'rising' && (
        <div ref={scope} className="absolute flex flex-col items-center" style={{ left: `${leftPct}%`, bottom: '10%' }}>
          <RevealBalloonShape colors={rc.colors} gradId={gradId} />
        </div>
      )}

      {phase === 'popped' && (
        <div className="absolute" style={{ left: `${leftPct}%`, top: '8%', transform: 'translateX(-50%)' }}>
          {/* Burst particles */}
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i / 10) * 2 * Math.PI;
            const dist = 60;
            return (
              <motion.span
                key={i}
                className="absolute w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: rc.colors.fill }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.2 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            );
          })}
          {/* Name card falls */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{ y: 500, rotate: fallRotation, opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeIn', delay: 0.2 }}
            onAnimationComplete={onComplete}
          >
            <NameCard cand={rc.cand} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── Fly-off balloon (runner-up): rises showing name, then flies away ─────────
function FlyoffRevealBalloon({
  rc, onComplete,
}: { rc: RevealCandidate; onComplete: () => void }) {
  const [scope, animate] = useAnimate();
  const gradId = `rev-flyoff-${rc.cand.id}`;

  useEffect(() => {
    playBalloonRise(0);

    async function run() {
      // Rise to mid-screen
      await animate(scope.current, { y: [700, -120] }, {
        duration: 2.6, ease: [0.25, 0.46, 0.45, 0.94],
      });
      // Brief pause at mid-height
      await new Promise<void>(r => setTimeout(r, 900));
      // Fly off to upper-right with a tilt
      await animate(scope.current, { y: -1400, x: 380, rotate: 22 }, {
        duration: 1.4, ease: [0.55, 0, 1, 0.45],
      });
      onComplete();
    }
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div ref={scope} className="absolute flex flex-col items-center" style={{ left: '42%', bottom: '10%' }}>
        <RevealBalloonShape colors={rc.colors} gradId={gradId} />
        <String colors={rc.colors} />
        <NameCard cand={rc.cand} rank="Peringkat 2" />
      </div>
    </div>
  );
}

// ── Winner balloon: rises to center, hovers, confetti ────────────────────────
function WinnerRevealBalloon({
  rc, onConfetti,
}: { rc: RevealCandidate; onConfetti: () => void }) {
  const [scope, animate] = useAnimate();
  const [confettiReady, setConfettiReady] = useState(false);
  const gradId = `rev-winner-${rc.cand.id}`;

  useEffect(() => {
    playBalloonRise(0);

    async function run() {
      // Rise to center
      await animate(scope.current, { y: [800, -200] }, {
        duration: 3, ease: [0.22, 1, 0.36, 1],
      });
      // Trigger reveal sound + confetti
      playReveal();
      setConfettiReady(true);
      onConfetti();
      // Hover loop (runs indefinitely)
      animate(scope.current, { y: [-200, -226, -200] }, {
        duration: 3.2, repeat: Infinity, ease: 'easeInOut',
      });
    }
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <div ref={scope} className="absolute flex flex-col items-center" style={{ left: '50%', bottom: '12%', transform: 'translateX(-50%)' }}>
        <RevealBalloonShape colors={rc.colors} gradId={gradId} size="xl" />
        <String colors={rc.colors} />
        {/* Winner name card with gold accent */}
        <div className="flex flex-col items-center bg-white rounded-2xl border-2 border-brand-amber-400 shadow-xl px-5 py-3 min-w-[160px] md:min-w-[220px] text-center mt-1">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-amber-500 font-heading mb-0.5">
            Pemenang
          </div>
          <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-brand-navy-400 font-heading">
            No. {rc.cand.ordinal_number}
          </div>
          <div className="text-base md:text-xl font-black text-brand-navy-900 font-heading leading-tight">
            {rc.cand.name}
          </div>
          <div className="text-xs font-bold text-brand-navy-500 mt-0.5">
            {rc.cand.vote_count.toLocaleString('id-ID')} suara
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Confetti overlay (shared) ─────────────────────────────────────────────────
function ConfettiLayer() {
  const confettiColors = ['#1e3a5f', '#f59e0b', '#10b981', '#fbbf24', '#3b82f6', '#f43f5e'];
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {Array.from({ length: 38 }).map((_, i) => {
        const left = 5 + (i % 8) * 11.5 + Math.random() * 8;
        const delay = (i % 7) * 0.1;
        const duration = 2.4 + Math.random() * 1.4;
        const rotate = Math.random() * 720 - 360;
        return (
          <motion.div
            key={i}
            initial={{ top: '-5%', left: `${left}%`, opacity: 1, scale: Math.random() * 0.5 + 0.7, rotate: 0 }}
            animate={{ top: '110%', opacity: [1, 1, 0], rotate }}
            transition={{ duration, delay, ease: 'easeIn' }}
            className="absolute w-4 h-4 rounded-sm shadow-sm"
            style={{ backgroundColor: confettiColors[i % confettiColors.length] }}
          />
        );
      })}
    </div>
  );
}

// ── Normal flying balloon actors (session mode) ───────────────────────────────

function BalloonActor({
  balloon, cand, colors, tokenTextColor, isRevealed, onPop, onComplete,
}: {
  balloon: BalloonInstance; cand: LiveCandidate; colors: SlotColors;
  tokenTextColor: string; isRevealed: boolean;
  onPop: (uid: string, e: React.MouseEvent) => void;
  onComplete: (uid: string) => void;
}) {
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
      <motion.div
        animate={{ x: [0, balloon.swayAmount, -balloon.swayAmount * 0.7, balloon.swayAmount * 0.4, 0] }}
        transition={{ duration: balloon.duration * 0.55, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center cursor-pointer pointer-events-auto select-none"
        onClick={(e) => onPop(balloon.uid, e)}
        title="Klik untuk letupkan!"
      >
        {isRevealed && (
          <div className="mb-0.5 text-center bg-white/90 px-2 py-0.5 rounded-md shadow-sm max-w-[110px]">
            <div className="text-[8px] font-bold uppercase tracking-wide text-brand-navy-500 font-heading">No. {cand.ordinal_number}</div>
            <div className="text-[10px] font-black text-brand-navy-900 truncate font-heading">{cand.name}</div>
          </div>
        )}
        <svg viewBox="0 0 100 130" className="w-20 h-28 md:w-24 md:h-32 drop-shadow-md">
          <defs>
            <radialGradient id={gradId} cx="35%" cy="30%" r="60%">
              <stop offset="0%"   stopColor={colors.shine} />
              <stop offset="85%"  stopColor={colors.fill}  />
              <stop offset="100%" stopColor={colors.knot}  />
            </radialGradient>
          </defs>
          <path d="M 50 8 C 22 8 8 28 8 58 C 8 88 28 108 46 114 L 46 116 L 54 116 L 54 114 C 72 108 92 88 92 58 C 92 28 78 8 50 8 Z" fill={`url(#${gradId})`} />
          <ellipse cx="32" cy="36" rx="12" ry="20" transform="rotate(-22 32 36)" fill="#ffffff" opacity={0.32} />
          <circle cx="24" cy="62" r="3.5" fill="#ffffff" opacity={0.22} />
          <polygon points="44,116 56,116 53,123 47,123" fill={colors.knot} />
        </svg>
        <svg viewBox="0 0 20 56" className="w-3 h-10 fill-none -mt-0.5" style={{ stroke: colors.string, strokeWidth: 1.5 }}>
          <path d="M 10 0 Q 14 14 8 28 T 10 56" />
        </svg>
        <div
          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-xs border border-black/10 -mt-0.5 whitespace-nowrap flex items-center gap-1"
          style={{ backgroundColor: colors.fill, color: tokenTextColor }}
        >
          <span>{balloon.tokenLabel}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PoppedBalloon({
  balloon, colors, tokenTextColor, onComplete,
}: { balloon: BalloonInstance; colors: SlotColors; tokenTextColor: string; onComplete: (uid: string) => void; }) {
  const fallRotation = useRef(rnd(-40, 40)).current;
  const popX = balloon.popX ?? 200;
  const popY = balloon.popY ?? 300;
  return (
    <div className="absolute pointer-events-none" style={{ left: `${popX}px`, top: `${popY}px` }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const dist = 52;
        return (
          <motion.span
            key={i} className="absolute w-3 h-3 rounded-full" style={{ backgroundColor: colors.fill }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        );
      })}
      <motion.div
        className="absolute px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-xs border border-black/10 whitespace-nowrap flex items-center gap-1"
        style={{ backgroundColor: colors.fill, color: tokenTextColor, left: '-20px', top: '8px' }}
        initial={{ y: 0, rotate: 0, opacity: 1 }}
        animate={{ y: 340, rotate: fallRotation, opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeIn' }}
        onAnimationComplete={() => onComplete(balloon.uid)}
      >
        <span>{balloon.tokenLabel}</span>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BalloonInterface({
  candidates, candidateColors, resultsMode, revealIdentity,
}: BalloonInterfaceProps) {
  const [balloons, setBalloons] = useState<BalloonInstance[]>([]);
  const [confettiActive, setConfettiActive] = useState(false);

  // Presentation reveal state
  const [revealQueue, setRevealQueue] = useState<RevealCandidate[]>([]);
  const [revealStep, setRevealStep] = useState(-1); // -1 = not started
  const [revealDone, setRevealDone] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevRevealRef = useRef(false);
  const prevVoteCountsRef = useRef<Record<string, number>>({});
  const initializedRef = useRef(false);

  const isRevealed = resultsMode === 'present' || revealIdentity;
  const inRevealSequence = revealStep >= 0 && !revealDone;

  // Build reveal queue: sorted asc by votes, assign roles
  const buildRevealQueue = useCallback((): RevealCandidate[] => {
    const sorted = [...candidates].sort((a, b) => a.vote_count - b.vote_count);
    return sorted.map((cand, i) => {
      const slot = resolveSlot(cand.id, candidates.findIndex(c => c.id === cand.id), candidateColors);
      const colors = COLOR_SLOTS[slot];
      const tokenTextColor = slot === 'B' ? '#1e3a5f' : '#ffffff';
      let role: RevealRole;
      if (i === sorted.length - 1) role = 'winner';
      else if (i === sorted.length - 2 && sorted.length > 1) role = 'flyoff';
      else role = 'pop';
      return { cand, colors, tokenTextColor, role };
    });
  }, [candidates, candidateColors]);

  const spawnBalloon = useCallback((candidateId: string) => {
    setBalloons(prev => [...prev, makeBalloon(candidateId)]);
    playBalloonRise(0);
  }, []);

  const removeBalloon = useCallback((uid: string) => {
    setBalloons(prev => prev.filter(b => b.uid !== uid));
  }, []);

  const handlePop = useCallback((uid: string, e: React.MouseEvent) => {
    let popX: number | undefined, popY: number | undefined;
    const el = containerRef.current;
    if (el) { const r = el.getBoundingClientRect(); popX = e.clientX - r.left; popY = e.clientY - r.top; }
    setBalloons(prev => prev.map(b => b.uid === uid ? { ...b, popped: true, popX, popY } : b));
    playBalloonPop();
  }, []);

  // Initialize baseline vote counts on mount — DO NOT spawn any balloons.
  // Realtime rule: If no new votes come in, there are NO balloons floating.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    candidates.forEach((cand) => {
      prevVoteCountsRef.current[cand.id] = cand.vote_count;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vote delta spawner (session mode only)
  useEffect(() => {
    if (!initializedRef.current || inRevealSequence) return;
    candidates.forEach(cand => {
      const prev = prevVoteCountsRef.current[cand.id];
      if (prev === undefined) { prevVoteCountsRef.current[cand.id] = cand.vote_count; return; }
      if (cand.vote_count > prev) {
        const delta = Math.min(cand.vote_count - prev, 5);
        for (let i = 0; i < delta; i++) setTimeout(() => spawnBalloon(cand.id), i * 280);
        prevVoteCountsRef.current[cand.id] = cand.vote_count;
      }
    });
  }, [candidates, spawnBalloon, inRevealSequence]);

  // Detect reveal flip → start presentation sequence
  useEffect(() => {
    if (isRevealed && !prevRevealRef.current) {
      // Clear all flying balloons and start reveal sequence
      setBalloons([]);
      const queue = buildRevealQueue();
      setRevealQueue(queue);
      setRevealStep(0);
    }
    prevRevealRef.current = isRevealed;
  }, [isRevealed, buildRevealQueue]);

  // Advance reveal step
  const handleRevealStepComplete = useCallback(() => {
    setRevealStep(prev => {
      const next = prev + 1;
      if (next >= revealQueue.length) {
        setRevealDone(true);
        return prev;
      }
      return next;
    });
  }, [revealQueue.length]);

  const handleWinnerConfetti = useCallback(() => {
    setConfettiActive(true);
  }, []);

  // Count loser pop balloons for horizontal staggering
  const losers = revealQueue.filter(r => r.role === 'pop');

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Confetti */}
      <AnimatePresence>
        {confettiActive && <ConfettiLayer key="confetti" />}
      </AnimatePresence>

      {/* ── Presentation reveal sequence ── */}
      {inRevealSequence && revealQueue.map((rc, i) => {
        if (i > revealStep) return null;

        if (rc.role === 'pop') {
          const loserIndex = losers.findIndex(l => l.cand.id === rc.cand.id);
          return (
            <PopRevealBalloon
              key={rc.cand.id}
              rc={rc}
              position={loserIndex}
              onComplete={i === revealStep ? handleRevealStepComplete : () => {}}
            />
          );
        }
        if (rc.role === 'flyoff') {
          return (
            <FlyoffRevealBalloon
              key={rc.cand.id}
              rc={rc}
              onComplete={handleRevealStepComplete}
            />
          );
        }
        if (rc.role === 'winner') {
          return (
            <WinnerRevealBalloon
              key={rc.cand.id}
              rc={rc}
              onConfetti={handleWinnerConfetti}
            />
          );
        }
        return null;
      })}

      {/* ── Normal flying balloons (session mode / post-reveal) ── */}
      {!inRevealSequence && balloons.map(balloon => {
        const cand = candidates.find(c => c.id === balloon.candidateId);
        if (!cand) return null;
        const slotIndex = candidates.findIndex(c => c.id === balloon.candidateId);
        const slot = resolveSlot(balloon.candidateId, slotIndex, candidateColors);
        const colors = COLOR_SLOTS[slot];
        const tokenTextColor = slot === 'B' ? '#1e3a5f' : '#ffffff';

        if (balloon.popped) {
          return <PoppedBalloon key={balloon.uid} balloon={balloon} colors={colors} tokenTextColor={tokenTextColor} onComplete={removeBalloon} />;
        }
        return (
          <BalloonActor
            key={balloon.uid} balloon={balloon} cand={cand} colors={colors}
            tokenTextColor={tokenTextColor} isRevealed={isRevealed}
            onPop={handlePop} onComplete={removeBalloon}
          />
        );
      })}
    </div>
  );
}
