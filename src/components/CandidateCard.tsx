'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, BookOpen, X, Users2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Candidate {
  id: string;
  ordinal_number: number;
  name: string;
  photo_url?: string | null;
  vision?: string | null;
  mission: string[];
  category: 'ketua' | 'wakil_1' | 'wakil_2';
  vote_count?: number;
}

interface CandidateCardProps {
  candidate: Candidate;
  onSelect?: (candidate: Candidate) => void;
  onViewDetails?: (candidate: Candidate) => void;
  isSelected?: boolean;
  showVoteButton?: boolean;
  compact?: boolean;
}

export default function CandidateCard({
  candidate,
  onSelect,
  isSelected = false,
  showVoteButton = true,
}: CandidateCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Auto-recover image when candidate changes or browser goes back online
  useEffect(() => {
    setImgError(false);
  }, [candidate.id, candidate.photo_url]);

  useEffect(() => {
    const handleOnline = () => {
      setImgError(false);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const formattedNumber = String(candidate.ordinal_number).padStart(2, '0');

  const getCategoryLabel = (cat: 'ketua' | 'wakil_1' | 'wakil_2') => {
    if (cat === 'ketua') return 'Kandidat Ketua OSIS';
    if (cat === 'wakil_1') return 'Kandidat Wakil Ketua 1';
    return 'Kandidat Wakil Ketua 2';
  };

  const initials = candidate.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const hasVisiMisi = Boolean(
    candidate.vision || (candidate.mission && candidate.mission.length > 0)
  );

  return (
    <>
      {/* ── Main Interactive Card ────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(candidate)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.(candidate);
          }
        }}
        className={`group relative flex flex-col h-full rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-200 text-left bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-amber-400/40 ${
          isSelected
            ? 'border-2 border-brand-amber-500 shadow-xl shadow-brand-amber-500/15 ring-2 ring-brand-amber-400/30'
            : 'border border-brand-navy-100 dark:border-slate-800 shadow-sm hover:border-brand-navy-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        {/* Ordinal Number Badge (Top-left) */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-brand-navy-900 dark:text-white font-black border border-brand-navy-100 dark:border-slate-800 shadow-sm w-10 h-10 text-lg">
            {formattedNumber}
          </div>
        </div>

        {/* Selection Indicator Badge (Top-right) */}
        <div className="absolute top-4 right-4 z-10 transition-transform duration-200 group-hover:scale-105">
          {isSelected ? (
            <div className="flex items-center justify-center rounded-full bg-brand-amber-500 text-brand-navy-950 font-black shadow-md border-2 border-white dark:border-slate-900 w-10 h-10">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border-2 border-white/50 text-white opacity-60 group-hover:opacity-100 group-hover:border-brand-amber-400 group-hover:text-brand-amber-400 w-10 h-10 transition-all">
              <span className="text-[10px] font-bold">PILIH</span>
            </div>
          )}
        </div>

        {/* Candidate Image Container (Fixed Aspect Ratio) */}
        <div className="relative w-full bg-brand-navy-900 dark:bg-slate-950 overflow-hidden aspect-[3/4]">
          {candidate.photo_url && !imgError ? (
            <Image
              src={candidate.photo_url}
              alt={`Kandidat ${formattedNumber}`}
              fill
              unoptimized={true}
              priority={true}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-navy-800 via-brand-navy-900 to-slate-950 text-white p-6">
              <div className="w-20 h-20 rounded-2xl bg-brand-amber-500/10 border-2 border-brand-amber-400/30 flex items-center justify-center font-heading font-black text-2xl text-brand-amber-400 mb-3 shadow-inner">
                {initials || formattedNumber}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center">
                {getCategoryLabel(candidate.category)}
              </span>
            </div>
          )}

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950/90 via-brand-navy-900/30 to-transparent dark:from-slate-950 dark:via-slate-950/40" />

          {/* Candidate Name & Category on Image */}
          <div className="absolute left-5 right-5 bottom-5">
            <p className="text-[11px] font-bold text-brand-amber-400 uppercase tracking-wide mb-1.5 drop-shadow-md">
              {getCategoryLabel(candidate.category)}
            </p>
            <h3 className="font-heading font-black leading-tight text-white line-clamp-2 drop-shadow-lg text-2xl">
              {candidate.name}
            </h3>
          </div>
        </div>

        {/* Content & Action Area (Consistent uniform height) */}
        <div className="flex flex-col flex-grow p-5 justify-between gap-3">
          {/* Lihat Visi & Misi Button (Opens clean modal, never stretches card) */}
          {hasVisiMisi && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-navy-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700/60"
            >
              <BookOpen className="w-3.5 h-3.5 text-brand-amber-500" />
              <span>Lihat Visi & Misi</span>
            </button>
          )}

          {/* Select Candidate Button */}
          {showVoteButton && onSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(candidate);
              }}
              className={`w-full px-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-200 flex items-center justify-center gap-2 py-3.5 ${
                isSelected
                  ? 'bg-brand-amber-500 text-brand-navy-950 font-black border-none shadow-md'
                  : 'bg-white dark:bg-slate-800 border-2 border-brand-navy-100 dark:border-slate-700 text-brand-navy-800 dark:text-slate-200 group-hover:border-brand-amber-400 group-hover:text-brand-navy-900 dark:group-hover:text-white group-hover:bg-brand-amber-50/40 dark:group-hover:bg-slate-700/70'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Terpilih
                </>
              ) : (
                'Pilih Kandidat Ini'
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Visi & Misi Modal Dialog (Prevents grid stretching) ──────────── */}
      <AnimatePresence>
        {isDetailModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailModalOpen(false);
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Body Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Tutup Visi & Misi"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6 pr-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-navy-900 dark:bg-slate-800 text-brand-amber-400 font-heading font-black text-xl border border-brand-navy-700 dark:border-slate-700 flex-shrink-0 shadow-sm">
                  {formattedNumber}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-amber-500">
                    {getCategoryLabel(candidate.category)}
                  </span>
                  <h3 className="text-xl font-heading font-black text-brand-navy-900 dark:text-white leading-tight">
                    {candidate.name}
                  </h3>
                </div>
              </div>

              {/* Visi Section */}
              {candidate.vision && (
                <div className="mb-6">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-navy-500 dark:text-slate-400 mb-2">
                    Visi
                  </h4>
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 p-4 rounded-2xl text-brand-navy-900 dark:text-slate-100 text-sm font-medium leading-relaxed italic">
                    &ldquo;{candidate.vision}&rdquo;
                  </div>
                </div>
              )}

              {/* Misi Section */}
              {candidate.mission && candidate.mission.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-navy-500 dark:text-slate-400 mb-3">
                    Misi ({candidate.mission.length} Poin)
                  </h4>
                  <ul className="space-y-3">
                    {candidate.mission.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm text-brand-navy-800 dark:text-slate-200 leading-relaxed font-medium"
                      >
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-amber-500 text-brand-navy-950 text-[10px] font-black mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modal Actions */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
                {onSelect && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(candidate);
                      setIsDetailModalOpen(false);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-brand-amber-500 text-brand-navy-950 font-black shadow-md'
                        : 'primary-button'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" /> Terpilih
                      </>
                    ) : (
                      'Pilih Kandidat Ini'
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
