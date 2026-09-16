'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { castSplitVote } from '@/lib/actions/vote';
import { logout } from '@/lib/actions/auth';
import CandidateCard, { Candidate } from '@/components/CandidateCard';
import { LogOut, Check, ArrowRight, ArrowLeft, Loader2, Sparkles, ShieldCheck, Flame, Vote, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';

// Extend Candidate type for categories
export interface CategorizedCandidate extends Candidate {
  category: 'ketua' | 'wakil_1' | 'wakil_2';
}

interface VoteWizardProps {
  candidates: CategorizedCandidate[];
  voterToken: string;
}

export default function VoteWizard({ candidates, voterToken }: VoteWizardProps) {
  const router = useRouter();

  // Step Wizard States: 1 = Ketua, 2 = Wakil 1, 3 = Wakil 2
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selections
  const [selectedKetua, setSelectedKetua] = useState<CategorizedCandidate | null>(null);
  const [selectedWakil1, setSelectedWakil1] = useState<CategorizedCandidate | null>(null);
  const [selectedWakil2, setSelectedWakil2] = useState<CategorizedCandidate | null>(null);

  // Confirmation Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getFilteredCandidates = () => {
    if (step === 1) return candidates.filter(c => c.category === 'ketua');
    if (step === 2) return candidates.filter(c => c.category === 'wakil_1');
    return candidates.filter(c => c.category === 'wakil_2');
  };

  const getSelectedForCurrentStep = () => {
    if (step === 1) return selectedKetua;
    if (step === 2) return selectedWakil1;
    return selectedWakil2;
  };

  const handleSelect = (candidate: Candidate) => {
    const catCand = candidate as CategorizedCandidate;
    if (step === 1) setSelectedKetua(catCand);
    else if (step === 2) setSelectedWakil1(catCand);
    else setSelectedWakil2(catCand);
  };

  const handleNext = () => {
    if (step === 1 && selectedKetua) setStep(2);
    else if (step === 2 && selectedWakil1) setStep(3);
    else if (step === 3 && selectedWakil2) setIsConfirmOpen(true);
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedKetua || !selectedWakil1 || !selectedWakil2) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await castSplitVote(selectedKetua.id, selectedWakil1.id, selectedWakil2.id);

    if (res.success && res.token) {
      setIsConfirmOpen(false);
      router.push(`/success?token=${res.token}`);
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Gagal mengirimkan pilihan suara Anda.');
      setIsLoading(false);
    }
  };

  const stepLabels = [
    { no: 1, name: 'Ketua OSIS' },
    { no: 2, name: 'Wakil Ketua 1' },
    { no: 3, name: 'Wakil Ketua 2' },
  ];

  const currentCandidates = getFilteredCandidates();
  const currentSelection = getSelectedForCurrentStep();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">

      {/* Top Header metadata bar */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-brand-navy-100 rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-glass-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-amber-50 rounded-full blur-[40px] -z-10 opacity-60"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-navy-50 text-brand-navy-600 border border-brand-navy-100">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy-400">Sesi Voting Aktif</p>
            <h2 className="font-bold text-brand-navy-900 flex items-center gap-2 mt-0.5">
              Token:{' '}
              <span className="font-mono text-sm bg-brand-amber-50 text-brand-amber-700 px-2 py-0.5 rounded-md border border-brand-amber-100">
                {voterToken}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="hidden sm:flex items-center gap-2 py-2 px-4 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Kerahasiaan Terjamin
          </div>

          <button
            onClick={() => logout()}
            className="py-2.5 px-4 rounded-xl text-brand-navy-600 bg-white hover:bg-brand-navy-50 hover:text-brand-navy-900 border border-brand-navy-200 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Batalkan Sesi
          </button>
        </div>
      </motion.div>

      {/* Progress wizard state steps indicator bar */}
      <div className="mb-12 max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative mb-2">
          {/* Connector bar background */}
          <div className="absolute left-6 right-6 top-6 h-1 bg-brand-navy-100 rounded-full z-0" />

          {/* Connector bar fill progress */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            className="absolute left-6 top-6 h-1 bg-brand-navy-600 rounded-full z-0 transition-all duration-500 ease-out"
          />

          {stepLabels.map((lbl) => {
            const isCompleted = step > lbl.no;
            const isActive = step === lbl.no;

            return (
              <div key={lbl.no} className="flex flex-col items-center z-10 relative">
                <button
                  type="button"
                  disabled={lbl.no > step && !isCompleted}
                  onClick={() => setStep(lbl.no as 1 | 2 | 3)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-heading font-black text-lg transition-all duration-300 ${
                    isCompleted
                      ? 'bg-brand-navy-700 text-white shadow-md shadow-brand-navy-900/20 border border-brand-navy-800'
                      : isActive
                      ? 'bg-white text-brand-amber-500 border-2 border-brand-amber-400 shadow-brand-gold scale-110'
                      : 'bg-white text-brand-navy-300 border-2 border-brand-navy-200 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6 text-white" /> : lbl.no}
                </button>
                <span className={`text-[11px] font-bold mt-3 tracking-widest uppercase ${
                  isActive ? 'text-brand-amber-600' : isCompleted ? 'text-brand-navy-700' : 'text-brand-navy-300'
                }`}>
                  {lbl.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Title Section */}
      <div className="text-center mb-10 max-w-xl mx-auto mt-8">
        <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-brand-amber-50 text-brand-amber-700 text-[10px] font-bold uppercase tracking-widest mb-4 border border-brand-amber-100/50">
          <Flame className="w-3.5 h-3.5" /> Tahap {step} dari 3
        </span>
        <h1 className="font-heading text-4xl font-black text-brand-navy-900 tracking-tight leading-tight mb-3">
          Pilih {stepLabels[step - 1].name}
        </h1>
        <p className="text-brand-navy-500 text-sm font-medium">
          Pilih kandidat terbaik menurut Anda. Anda dapat melihat visi dan misi tiap kandidat dengan mengklik detail.
        </p>
      </div>

      {/* Candidates Selection Grid layout */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-stretch mt-4 px-2"
        >
          {currentCandidates.map((cand) => (
            <CandidateCard
              key={cand.id}
              candidate={cand}
              onSelect={handleSelect}
              isSelected={currentSelection?.id === cand.id}
              compact={true}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Persistent Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 py-4 px-6 flex justify-between items-center z-30 bg-white/90 backdrop-blur-xl border-t border-brand-navy-100 shadow-[0_-10px_40px_rgba(30,58,95,0.05)]"
      >
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          {/* Back button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="py-3 px-6 rounded-xl bg-white border border-brand-navy-200 text-brand-navy-600 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all hover:bg-brand-navy-50 hover:text-brand-navy-800 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" /> Sebelumnya
          </button>

          {/* Next Action button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentSelection}
            className={`py-3 px-8 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 3 ? 'primary-button' : 'bg-brand-navy-900 text-white hover:bg-brand-navy-800 shadow-brand'
            }`}
          >
            {step === 3 ? (
              <>
                Tinjau Pilihan <Sparkles className="w-4 h-4 opacity-80" />
              </>
            ) : (
              <>
                Lanjut <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unified 3-Step Confirmation Overlay Modal */}
      <AnimatePresence>
        {isConfirmOpen && selectedKetua && selectedWakil1 && selectedWakil2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={isLoading ? undefined : () => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-brand-navy-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl z-10 flex flex-col p-8 max-h-[90vh] overflow-y-auto glass-card bg-white/95"
            >
              <button
                disabled={isLoading}
                onClick={() => setIsConfirmOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-brand-navy-50 hover:bg-brand-navy-100 text-brand-navy-400 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mt-2 mb-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4 self-center mx-auto bg-brand-amber-50 text-brand-amber-500 border border-brand-amber-100/50">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="font-heading font-black text-2xl text-brand-navy-900 tracking-tight">
                  Tinjau Pilihan
                </h2>
                <p className="text-brand-navy-500 text-xs mt-2 px-2 font-medium">
                  Pastikan pilihan Anda untuk semua kategori sudah benar sebelum mengirimkan suara.
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-600 border border-red-100 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Choices Summary board */}
              <div className="space-y-3 mb-6 text-sm text-left">
                {/* Ketua Display */}
                <div className="rounded-2xl p-4 flex items-center justify-between bg-brand-navy-50/50 border border-brand-navy-100/80">
                  <div>
                    <span className="text-[10px] font-bold text-brand-navy-400 uppercase tracking-widest block mb-1">Calon Ketua OSIS</span>
                    <span className="font-heading font-bold text-base text-brand-navy-900 block truncate max-w-[200px]">{selectedKetua.name}</span>
                  </div>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-brand-navy-600 text-xs font-bold border border-brand-navy-200 shadow-sm shrink-0">
                    {String(selectedKetua.ordinal_number).padStart(2, '0')}
                  </span>
                </div>

                {/* Wakil 1 Display */}
                <div className="rounded-2xl p-4 flex items-center justify-between bg-brand-navy-50/50 border border-brand-navy-100/80">
                  <div>
                    <span className="text-[10px] font-bold text-brand-navy-400 uppercase tracking-widest block mb-1">Calon Wakil Ketua 1</span>
                    <span className="font-heading font-bold text-base text-brand-navy-900 block truncate max-w-[200px]">{selectedWakil1.name}</span>
                  </div>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-brand-navy-600 text-xs font-bold border border-brand-navy-200 shadow-sm shrink-0">
                    {String(selectedWakil1.ordinal_number).padStart(2, '0')}
                  </span>
                </div>

                {/* Wakil 2 Display */}
                <div className="rounded-2xl p-4 flex items-center justify-between bg-brand-navy-50/50 border border-brand-navy-100/80">
                  <div>
                    <span className="text-[10px] font-bold text-brand-navy-400 uppercase tracking-widest block mb-1">Calon Wakil Ketua 2</span>
                    <span className="font-heading font-bold text-base text-brand-navy-900 block truncate max-w-[200px]">{selectedWakil2.name}</span>
                  </div>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-brand-navy-600 text-xs font-bold border border-brand-navy-200 shadow-sm shrink-0">
                    {String(selectedWakil2.ordinal_number).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Warning Alert box */}
              <div className="flex items-start gap-3 rounded-2xl p-4 mb-6 text-left text-xs bg-brand-amber-50/80 text-brand-amber-800 border border-brand-amber-200/50 font-medium">
                <Check className="w-4 h-4 text-brand-amber-600 mt-0.5 flex-shrink-0" />
                <p>
                  Setelah dikirim, token Anda akan dikunci dan pilihan tidak dapat diubah lagi.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-white border border-brand-navy-200 text-brand-navy-600 font-bold text-xs uppercase tracking-widest transition-all hover:bg-brand-navy-50"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-3.5 px-4 rounded-xl primary-button text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengirim
                    </>
                  ) : (
                    'Kirim Suara'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extra space at bottom to avoid bottom bar overlap */}
      <div className="h-24" />

    </div>
  );
}
