'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COLOR_SLOTS,
  SESSION_BAR_COLOR,
  resolveSlot,
  getShuffledCandidates,
  type ColorSlot,
} from '../colorSlots';
import { playBalloonRise, playReveal } from '../sounds';
import type { LiveCandidate } from '../useLiveResults';

interface BarChartInterfaceProps {
  candidates: LiveCandidate[];
  candidateColors: Record<string, ColorSlot>;
  resultsMode: 'session' | 'present';
  revealIdentity: boolean;
}

// ── Confetti overlay ──────────────────────────────────────────────────────────
function ConfettiLayer() {
  const confettiColors = ['#1e3a5f', '#f59e0b', '#10b981', '#fbbf24', '#3b82f6', '#f43f5e'];
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {Array.from({ length: 36 }).map((_, i) => {
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
            className="absolute w-3.5 h-3.5 rounded-sm shadow-sm"
            style={{ backgroundColor: confettiColors[i % confettiColors.length] }}
          />
        );
      })}
    </div>
  );
}

export default function BarChartInterface({
  candidates,
  candidateColors,
  resultsMode,
  revealIdentity,
}: BarChartInterfaceProps) {
  const isRevealed = resultsMode === 'present' || revealIdentity;
  const [shuffleSeed] = useState(() => Math.random());
  const [confettiActive, setConfettiActive] = useState(false);

  // Progressive reveal state: tracks which candidates have been revealed (by id)
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const prevRevealRef = useRef(false);

  // Candidates sorted by votes ascending (lowest to highest) for sequential reveal
  const sortedByVotesAsc = useMemo(() => {
    return [...candidates].sort((a, b) => a.vote_count - b.vote_count);
  }, [candidates]);

  const winnerCandidate = useMemo(() => {
    if (sortedByVotesAsc.length === 0) return null;
    return sortedByVotesAsc[sortedByVotesAsc.length - 1];
  }, [sortedByVotesAsc]);

  // Sequential reveal runner when isRevealed turns true
  useEffect(() => {
    if (isRevealed && !prevRevealRef.current) {
      setRevealedIds([]);
      setConfettiActive(false);

      if (sortedByVotesAsc.length === 0) return;

      const stepDelay = 1400; // Time between each candidate reveal
      sortedByVotesAsc.forEach((cand, idx) => {
        setTimeout(() => {
          setRevealedIds((prev) => [...prev, cand.id]);

          const isLast = idx === sortedByVotesAsc.length - 1;
          if (isLast) {
            playReveal();
            setConfettiActive(true);
            setTimeout(() => setConfettiActive(false), 4000);
          } else {
            playBalloonRise(0);
          }
        }, (idx + 1) * stepDelay);
      });
    } else if (!isRevealed) {
      setRevealedIds([]);
      setConfettiActive(false);
    }
    prevRevealRef.current = isRevealed;
  }, [isRevealed, sortedByVotesAsc]);

  // Display order:
  // In presentation / revealed mode: sort by votes ascending so the crescendo moves left-to-right
  // In session mode: shuffle to prevent guessing 1, 2, 3
  const orderedCandidates = useMemo(() => {
    if (isRevealed) {
      return sortedByVotesAsc;
    }
    return getShuffledCandidates(candidates, shuffleSeed);
  }, [candidates, isRevealed, sortedByVotesAsc, shuffleSeed]);

  const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

  // Format chart data based on progressive reveal
  const chartData = useMemo(() => {
    return orderedCandidates.map((cand, idx) => {
      const slot = resolveSlot(cand.id, idx, candidateColors);
      const slotColor = COLOR_SLOTS[slot].fill;
      const percentage = totalVotes > 0 ? (cand.vote_count / totalVotes) * 100 : 0;
      const hasBeenRevealed = isRevealed && revealedIds.includes(cand.id);
      const isWinner = isRevealed && winnerCandidate?.id === cand.id && hasBeenRevealed;

      return {
        id: cand.id,
        // In reveal mode: only show name & full votes if revealed in sequence
        name: isRevealed ? (hasBeenRevealed ? cand.name : '?') : '?',
        fullName: cand.name,
        ordinal: cand.ordinal_number,
        // Bar height: 0 while awaiting its turn in the reveal sequence
        votes: isRevealed ? (hasBeenRevealed ? cand.vote_count : 0) : cand.vote_count,
        realVotes: cand.vote_count,
        percentage: Number(percentage.toFixed(1)),
        color: isRevealed ? (hasBeenRevealed ? slotColor : '#e2e8f0') : SESSION_BAR_COLOR,
        slot,
        isRevealed: hasBeenRevealed,
        isWinner,
      };
    });
  }, [orderedCandidates, candidateColors, isRevealed, revealedIds, totalVotes, winnerCandidate]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-8 max-w-6xl mx-auto overflow-hidden">
      {/* Confetti celebration layer */}
      <AnimatePresence>
        {confettiActive && <ConfettiLayer key="barchart-confetti" />}
      </AnimatePresence>

      {/* 1. Main Recharts Bar Chart Area */}
      <div className="relative flex-1 w-full min-h-[300px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
          >
            <XAxis
              dataKey="id"
              tickFormatter={(id) => {
                const item = chartData.find((d) => d.id === id);
                if (!isRevealed) return '?';
                return item?.isRevealed ? item.fullName : '?';
              }}
              tick={{
                fill: '#1e293b',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
              }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(30, 58, 95, 0.04)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const canShowDetails = !isRevealed || data.isRevealed;
                  return (
                    <div className="bg-white p-3.5 rounded-xl shadow-lg border border-brand-navy-100 text-xs">
                      <div className="font-bold text-brand-navy-900 text-sm font-heading">
                        {canShowDetails ? (isRevealed ? data.fullName : `Kandidat ${data.id.slice(0, 4)}`) : '?'}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-brand-navy-600 font-semibold">
                        <span>{data.realVotes.toLocaleString('id-ID')} suara</span>
                        <span>•</span>
                        <span className="text-brand-amber-600 font-bold">{data.percentage}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="votes"
              radius={[12, 12, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.color}
                  className="transition-all duration-700 ease-out"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Candidate Cards / Legend Bottom Section */}
      <div className="w-full shrink-0 pt-2 pb-2">
        <AnimatePresence>
          {isRevealed ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6"
            >
              {chartData.map((item) => {
                const visible = item.isRevealed;
                return (
                  <motion.div
                    key={item.id}
                    animate={
                      item.isWinner
                        ? { scale: [1, 1.03, 1], transition: { duration: 0.6 } }
                        : {}
                    }
                    className={`p-3.5 md:p-4 rounded-2xl border shadow-sm flex items-center gap-3.5 transition-all ${
                      item.isWinner
                        ? 'bg-amber-50/70 border-brand-amber-300 ring-2 ring-brand-amber-400/40'
                        : visible
                        ? 'bg-white border-brand-navy-100/90'
                        : 'bg-white/60 border-slate-200 opacity-50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{
                        backgroundColor: visible
                          ? COLOR_SLOTS[item.slot].legend
                          : '#cbd5e1',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      {item.isWinner && (
                        <div className="text-[9px] font-black uppercase tracking-widest text-brand-amber-600 font-heading">
                          Pemenang
                        </div>
                      )}
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-navy-400">
                        {visible ? `No. ${item.ordinal}` : '?'}
                      </div>
                      <div className="text-sm md:text-base font-black text-brand-navy-900 truncate font-heading">
                        {visible ? item.fullName : 'Menunggu reveal...'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm md:text-base font-black text-brand-navy-900 font-heading">
                        {visible ? item.realVotes.toLocaleString('id-ID') : '—'}
                      </div>
                      <div className="text-[11px] font-bold text-brand-amber-600">
                        {visible ? `${item.percentage}%` : ''}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-2 text-xs md:text-sm font-semibold text-brand-navy-400">
              Mode Sesi Aktif — Identitas kandidat disamarkan hingga pengumuman
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
