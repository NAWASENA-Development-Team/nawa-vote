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
  )}&backgroundColor=f4f6fa&textColor=1e3a5f`;

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
          ? 'border-2 border-brand-amber-400 shadow-xl shadow-brand-amber-500/10 scale-[1.02] ring-4 ring-brand-amber-50'
          : 'border border-brand-navy-100 shadow-sm hover:shadow-brand hover:border-brand-navy-200'
      }`}
    >
      {/* Ordinal Number Glow Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-brand-navy-900 font-black text-lg border border-brand-navy-100 shadow-sm">
          {formattedNumber}
        </div>
      </div>

      {/* Candidate Image Container */}
      <div className="relative aspect-[4/3] w-full bg-brand-navy-50 overflow-hidden group">
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
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950/90 via-brand-navy-900/30 to-transparent" />

        {/* Absolute Titles on Image */}
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[10px] font-bold text-brand-amber-400 uppercase tracking-widest mb-1.5 drop-shadow-md">
            {getCategoryLabel(candidate.category)}
          </p>
          <h3 className="font-heading font-black text-2xl leading-tight text-white line-clamp-2 drop-shadow-lg">
            {candidate.name}
          </h3>
        </div>
      </div>

      {/* Content Details */}
      <div className="flex flex-col flex-grow p-6">
        {/* Vision Section */}
        {candidate.vision && (
          <div className="mb-4 flex-grow bg-brand-navy-50/50 border border-brand-navy-100 p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-amber-400"></div>
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-brand-navy-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-amber-500" /> Visi
            </h4>
            <p className="text-brand-navy-700 text-sm font-medium italic leading-relaxed">
              &ldquo;{candidate.vision}&rdquo;
            </p>
          </div>
        )}

        {/* Mission Section (Accordion) */}
        {candidate.mission && candidate.mission.length > 0 && (
          <div className="mb-6 bg-white border border-brand-navy-100 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-brand-navy-200">
            <button
              onClick={() => setShowMissions(!showMissions)}
              className="flex items-center justify-between w-full text-left text-xs uppercase tracking-widest font-bold text-brand-navy-700 p-4 hover:bg-brand-navy-50/50 transition-colors"
            >
              <span>{showMissions ? 'Sembunyikan Misi' : 'Lihat Misi'}</span>
              {showMissions ? <ChevronUp className="w-4 h-4 text-brand-navy-400" /> : <ChevronDown className="w-4 h-4 text-brand-navy-400" />}
            </button>

            <AnimatePresence initial={false}>
              {showMissions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-brand-navy-50/30 border-t border-brand-navy-100"
                >
                  <ul className="space-y-3 p-4 text-sm text-brand-navy-600 font-medium">
                    {candidate.mission.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-navy-100 text-brand-navy-600 text-[10px] font-black mt-0.5">
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
            className={`w-full py-4 px-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
              isSelected
                ? 'bg-gradient-to-r from-brand-amber-400 to-brand-amber-500 text-brand-amber-950 shadow-brand-gold border-none'
                : 'bg-white border-2 border-brand-navy-100 text-brand-navy-600 hover:border-brand-amber-300 hover:bg-brand-amber-50'
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
