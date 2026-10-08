'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

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
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-200 text-left bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-amber-400/40 ${
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

      {/* Selection Status Badge (Top-right) */}
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

      {/* Candidate Photo Container (Fixed aspect ratio) */}
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

        {/* Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950/90 via-brand-navy-900/30 to-transparent dark:from-slate-950 dark:via-slate-950/40" />

        {/* Candidate Title & Category Overlay */}
        <div className="absolute left-5 right-5 bottom-5">
          <p className="text-[11px] font-bold text-brand-amber-400 uppercase tracking-wide mb-1.5 drop-shadow-md">
            {getCategoryLabel(candidate.category)}
          </p>
          <h3 className="font-heading font-black leading-tight text-white line-clamp-2 drop-shadow-lg text-2xl">
            {candidate.name}
          </h3>
        </div>
      </div>

      {/* Card Body & In-Card Visi Misi Accordion */}
      <div className="flex flex-col p-5 gap-3">
        {/* Toggle Button for Inline Visi & Misi */}
        {hasVisiMisi && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-navy-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between border border-slate-200 dark:border-slate-700/60"
          >
            <span>{isExpanded ? 'Sembunyikan Visi & Misi' : 'Lihat Visi & Misi'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-brand-amber-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-brand-amber-500" />
            )}
          </button>
        )}

        {/* In-Card Expandable Details (Animated, only expands THIS card) */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden space-y-3 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Visi */}
              {candidate.vision && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 p-3.5 rounded-xl text-xs text-brand-navy-900 dark:text-slate-100 leading-relaxed italic">
                  <span className="not-italic font-black text-[10px] uppercase tracking-wider block text-brand-amber-600 dark:text-brand-amber-400 mb-1">
                    Visi
                  </span>
                  &ldquo;{candidate.vision}&rdquo;
                </div>
              )}

              {/* Misi */}
              {candidate.mission && candidate.mission.length > 0 && (
                <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-3.5 rounded-xl text-xs">
                  <span className="font-black text-[10px] uppercase tracking-wider block text-brand-navy-500 dark:text-slate-400 mb-2">
                    Misi ({candidate.mission.length} Poin)
                  </span>
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {candidate.mission.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-slate-700 dark:text-slate-200 leading-relaxed font-medium"
                      >
                        <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-brand-amber-500 text-brand-navy-950 text-[9px] font-black mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Vote Selection Button */}
        {showVoteButton && onSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(candidate);
            }}
            className={`w-full px-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-200 flex items-center justify-center gap-2 py-3.5 mt-1 ${
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
  );
}
