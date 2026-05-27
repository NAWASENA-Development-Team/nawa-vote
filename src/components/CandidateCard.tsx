'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
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
  isSelected?: boolean;
  showVoteButton?: boolean;
}

export default function CandidateCard({
  candidate,
  onSelect,
  isSelected = false,
  showVoteButton = true,
}: CandidateCardProps) {
  const [showMissions, setShowMissions] = React.useState(false);

  const formattedNumber = String(candidate.ordinal_number).padStart(2, '0');

  // Modern fallback for photo
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    candidate.name
  )}&backgroundColor=f8fafc&textColor=0f172a`;

  const getCategoryLabel = (cat: 'ketua' | 'wakil_1' | 'wakil_2') => {
    if (cat === 'ketua') return 'Kandidat Ketua OSIS';
    if (cat === 'wakil_1') return 'Kandidat Wakil Ketua 1';
    return 'Kandidat Wakil Ketua 2';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-300 bg-white ${
        isSelected 
          ? 'border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]'
          : 'border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'
      }`}
    >
      {/* Ordinal Number Glow Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-slate-900 font-bold text-lg border border-slate-200/50 shadow-sm">
          {formattedNumber}
        </div>
      </div>

      {/* Candidate Image Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-50 overflow-hidden">
        {candidate.photo_url ? (
          <Image
            src={candidate.photo_url}
            alt={`Kandidat ${formattedNumber}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <Image
            src={defaultAvatar}
            alt={`Kandidat ${formattedNumber}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition-transform duration-500 hover:scale-105"
          />
        )}
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

        {/* Absolute Titles on Image */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
            {getCategoryLabel(candidate.category)}
          </p>
          <h3 className="font-heading text-xl leading-tight text-white line-clamp-2">
            {candidate.name}
          </h3>
        </div>
      </div>

      {/* Content Details */}
      <div className="flex flex-col flex-grow p-6">
        {/* Vision Section */}
        {candidate.vision && (
          <div className="mb-4 flex-grow bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Visi
            </h4>
            <p className="text-slate-700 text-sm italic leading-relaxed">
              &ldquo;{candidate.vision}&rdquo;
            </p>
          </div>
        )}

        {/* Mission Section (Accordion) */}
        {candidate.mission && candidate.mission.length > 0 && (
          <div className="mb-6 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowMissions(!showMissions)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-slate-700 p-4 hover:bg-slate-50 transition-colors"
            >
              <span>{showMissions ? 'Sembunyikan Misi' : 'Lihat Misi'}</span>
              {showMissions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            <AnimatePresence initial={false}>
              {showMissions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-50/50 border-t border-slate-100"
                >
                  <ul className="space-y-3 p-4 text-sm text-slate-600">
                    {candidate.mission.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold mt-0.5">
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
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isSelected
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
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
    </motion.div>
  );
}
