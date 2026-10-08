'use client';

import React from 'react';
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
  compact = false,
}: CandidateCardProps) {
  const [showMissions, setShowMissions] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // If local expansion is triggered, override compact mode
  const isCompact = compact && !isExpanded;

  const formattedNumber = String(candidate.ordinal_number).padStart(2, '0');

  // Modern fallback for photo
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    candidate.name
  )}&backgroundColor=f4f6fa&textColor=1e3a5f`;

  const getCategoryLabel = (cat: 'ketua' | 'wakil_1' | 'wakil_2') => {
    if (cat === 'ketua') return 'Kandidat Ketua OSIS';
    if (cat === 'wakil_1') return 'Kandidat Wakil Ketua 1';
    return 'Kandidat Wakil Ketua 2';
  };

  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900 ${
        isSelected 
          ? 'border-2 border-brand-amber-500 shadow-lg shadow-brand-amber-500/10 ring-2 ring-brand-amber-400/20'
          : 'border border-brand-navy-100 dark:border-slate-800 shadow-sm hover:border-brand-navy-200 dark:hover:border-slate-700'
      }`}
    >
      {/* Ordinal Number Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-brand-navy-900 dark:text-white font-black border border-brand-navy-100 dark:border-slate-800 shadow-sm w-10 h-10 text-lg">
          {formattedNumber}
        </div>
      </div>

      {/* Candidate Image Container */}
      <div className="relative w-full bg-brand-navy-50 dark:bg-slate-950 overflow-hidden group transition-all duration-500 aspect-[3/4]">
        {candidate.photo_url ? (
          <Image
            src={candidate.photo_url}
            alt={`Kandidat ${formattedNumber}`}
            fill
            priority={true}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <Image
            src={defaultAvatar}
            alt={`Kandidat ${formattedNumber}`}
            fill
            priority={true}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        )}
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950/90 via-brand-navy-900/30 to-transparent dark:from-slate-950 dark:via-slate-950/40" />

        {/* Absolute Titles on Image */}
        <div className="absolute left-5 right-5 transition-all duration-300 bottom-5">
          <p className="text-[11px] font-bold text-brand-amber-400 uppercase tracking-wide mb-1.5 drop-shadow-md">
            {getCategoryLabel(candidate.category)}
          </p>
          <h3 className="font-heading font-black leading-tight text-white line-clamp-2 drop-shadow-lg transition-all duration-300 text-2xl">
            {candidate.name}
          </h3>
        </div>
      </div>

      {/* Content Details */}
      <div className="flex flex-col flex-grow transition-all duration-300 p-6">
        
        {/* Compact Mode: View Details Link */}
        {isCompact && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs font-semibold text-brand-navy-500 dark:text-slate-400 hover:text-brand-navy-800 dark:hover:text-white mb-4 flex items-center justify-center gap-1 transition-colors"
          >
            Lihat Visi & Misi
          </button>
        )}

        {/* Expanded View: Hide Button */}
        {!isCompact && compact && (
           <button
            onClick={() => setIsExpanded(false)}
            className="text-xs font-semibold text-brand-navy-500 dark:text-slate-400 hover:text-brand-navy-800 dark:hover:text-white mb-4 flex items-center justify-center gap-1 transition-colors"
          >
            Sembunyikan
          </button>
        )}

        {/* Vision Section */}
        {!isCompact && candidate.vision && (
          <div className="mb-4 flex-grow bg-brand-navy-50/50 dark:bg-slate-800/40 border border-brand-navy-100 dark:border-slate-800 p-4 rounded-xl relative overflow-hidden">
            <h4 className="text-xs uppercase tracking-wide font-bold text-brand-navy-500 dark:text-slate-400 mb-2">
              Visi
            </h4>
            <p className="text-brand-navy-800 dark:text-slate-200 text-sm font-medium leading-relaxed">
              &ldquo;{candidate.vision}&rdquo;
            </p>
          </div>
        )}

        {/* Mission Section (Accordion) */}
        {!isCompact && candidate.mission && candidate.mission.length > 0 && (
          <div className="mb-6 bg-white dark:bg-slate-900 border border-brand-navy-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all hover:border-brand-navy-200 dark:hover:border-slate-700">
            <button
              onClick={() => setShowMissions(!showMissions)}
              className="flex items-center justify-between w-full text-left text-xs uppercase tracking-wide font-bold text-brand-navy-700 dark:text-slate-300 p-4 hover:bg-brand-navy-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span>{showMissions ? 'Sembunyikan Misi' : 'Lihat Misi'}</span>
              {showMissions ? <ChevronUp className="w-4 h-4 text-brand-navy-400 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-brand-navy-400 dark:text-slate-400" />}
            </button>

            <AnimatePresence initial={false}>
              {showMissions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-brand-navy-50/30 dark:bg-slate-950/40 border-t border-brand-navy-100 dark:border-slate-800"
                >
                  <ul className="space-y-3 p-4 text-sm text-brand-navy-700 dark:text-slate-300 font-medium">
                    {candidate.mission.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-navy-100 dark:bg-slate-800 text-brand-navy-700 dark:text-slate-300 text-[10px] font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Select Button */}
        {showVoteButton && onSelect && (
          <button
            onClick={() => onSelect(candidate)}
            className={`w-full px-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-200 flex items-center justify-center gap-2 mt-auto py-3.5 ${
              isSelected
                ? 'bg-brand-amber-500 text-brand-navy-950 font-bold border-none shadow-md'
                : 'bg-white dark:bg-slate-800 border-2 border-brand-navy-100 dark:border-slate-700 text-brand-navy-700 dark:text-slate-200 hover:border-brand-amber-400 hover:bg-brand-amber-50/50 dark:hover:bg-slate-700'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" /> Terpilih
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
