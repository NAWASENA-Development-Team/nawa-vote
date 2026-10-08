'use client';

import React, { useMemo, useState } from 'react';
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
import type { LiveCandidate } from '../useLiveResults';

interface BarChartInterfaceProps {
  candidates: LiveCandidate[];
  candidateColors: Record<string, ColorSlot>;
  resultsMode: 'session' | 'present';
  revealIdentity: boolean;
}

export default function BarChartInterface({
  candidates,
  candidateColors,
  resultsMode,
  revealIdentity,
}: BarChartInterfaceProps) {
  const isRevealed = resultsMode === 'present' || revealIdentity;
  const [shuffleSeed] = useState(() => Math.random());

  // In session mode, shuffle the display order so columns cannot be predicted
  const orderedCandidates = useMemo(() => {
    if (isRevealed) {
      return [...candidates].sort((a, b) => a.ordinal_number - b.ordinal_number);
    }
    return getShuffledCandidates(candidates, shuffleSeed);
  }, [candidates, isRevealed, shuffleSeed]);

  const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

  // Format data for Recharts
  const chartData = useMemo(() => {
    return orderedCandidates.map((cand, idx) => {
      const slot = resolveSlot(cand.id, idx, candidateColors);
      const slotColor = COLOR_SLOTS[slot].fill;
      const percentage = totalVotes > 0 ? (cand.vote_count / totalVotes) * 100 : 0;

      return {
        id: cand.id,
        name: isRevealed ? cand.name : '?',
        fullName: cand.name,
        ordinal: cand.ordinal_number,
        votes: cand.vote_count,
        percentage: Number(percentage.toFixed(1)),
        color: isRevealed ? slotColor : SESSION_BAR_COLOR,
        slot,
      };
    });
  }, [orderedCandidates, candidateColors, isRevealed, totalVotes]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-8 max-w-6xl mx-auto overflow-hidden">
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
                return isRevealed ? item?.fullName || '' : '?';
              }}
              tick={{
                fill: '#1e293b',
                fontWeight: isRevealed ? 700 : 900,
                fontSize: isRevealed ? 13 : 22,
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
                  return (
                    <div className="bg-white p-3.5 rounded-xl shadow-lg border border-brand-navy-100 text-xs">
                      <div className="font-bold text-brand-navy-900 text-sm font-heading">
                        {isRevealed ? data.fullName : '?'}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-brand-navy-600 font-semibold">
                        <span>{data.votes.toLocaleString('id-ID')} suara</span>
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
                  className="transition-colors duration-700 ease-out"
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
              {chartData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 md:p-4 rounded-2xl border border-brand-navy-100/90 shadow-sm flex items-center gap-3.5 transition-all"
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: COLOR_SLOTS[item.slot].legend }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand-navy-400">
                      No. {item.ordinal}
                    </div>
                    <div className="text-sm md:text-base font-black text-brand-navy-900 truncate font-heading">
                      {item.fullName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm md:text-base font-black text-brand-navy-900 font-heading">
                      {item.votes.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] font-bold text-brand-amber-600">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
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
