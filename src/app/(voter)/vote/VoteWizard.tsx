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
  const [clientIp, setClientIp] = useState('127.0.0.1');

  // Fetch client IP on mount
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch(() => setClientIp('127.0.0.1'));
  }, []);

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

    const res = await castSplitVote(selectedKetua.id, selectedWakil1.id, selectedWakil2.id, clientIp);

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
        className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Sesi Voting Aktif</p>
            <h2 className="font-medium text-slate-800 flex items-center gap-2 mt-0.5">
              Token:{' '}
              <span className="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                {voterToken}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 py-2 px-4 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" /> Kerahasiaan Terjamin
          </div>

          <button
            onClick={() => logout()}
            className="py-2.5 px-4 rounded-xl text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Batalkan Sesi
          </button>
        </div>
      </motion.div>

      {/* Progress wizard state steps indicator bar */}
      <div className="mb-12 max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative mb-2">
          {/* Connector bar background */}
          <div className="absolute left-6 right-6 top-6 h-1 bg-slate-100 rounded-full z-0" />

          {/* Connector bar fill progress */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            className="absolute left-6 top-6 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-300"
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-lg transition-all duration-300 ${
                    isCompleted
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : isActive
                      ? 'bg-white text-indigo-600 border-2 border-indigo-500 shadow-md scale-110'
                      : 'bg-white text-slate-300 border-2 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : lbl.no}
                </button>
                <span className={`text-[11px] font-semibold mt-3 ${
                  isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'
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
        <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-100">
          <Flame className="w-3.5 h-3.5" /> Tahap {step} dari 3
        </span>
        <h1 className="font-heading text-4xl text-slate-900 tracking-tight leading-tight mb-3">
          Pilih {stepLabels[step - 1].name}
        </h1>
        <p className="text-slate-500 text-sm">
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
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Persistent Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 py-4 px-6 flex justify-between items-center z-30 bg-white/80 backdrop-blur-md border-t border-slate-200"
      >
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          {/* Back button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="py-3 px-6 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold flex items-center gap-2 transition-all hover:bg-slate-50 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" /> Sebelumnya
          </button>

          {/* Next Action button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentSelection}
            className={`py-3 px-8 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 3 ? 'primary-button' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {step === 3 ? (
              <>
                Tinjau Pilihan <Sparkles className="w-4 h-4" />
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl z-10 flex flex-col p-8 max-h-[90vh] overflow-y-auto glass-card bg-white"
            >
              <button
                disabled={isLoading}
                onClick={() => setIsConfirmOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mt-2 mb-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4 self-center mx-auto bg-indigo-50 text-indigo-500">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="font-heading text-2xl text-slate-900">
                  Tinjau Pilihan
                </h2>
                <p className="text-slate-500 text-xs mt-2 px-2">
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
                <div className="rounded-xl p-4 flex items-center justify-between bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Calon Ketua OSIS</span>
                    <span className="font-heading text-base text-slate-900 block">{selectedKetua.name}</span>
                  </div>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-200">
                    {String(selectedKetua.ordinal_number).padStart(2, '0')}
                  </span>
                </div>

                {/* Wakil 1 Display */}
                <div className="rounded-xl p-4 flex items-center justify-between bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Calon Wakil Ketua 1</span>
                    <span className="font-heading text-base text-slate-900 block">{selectedWakil1.name}</span>
                  </div>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-200">
                    {String(selectedWakil1.ordinal_number).padStart(2, '0')}
                  </span>
                </div>

                {/* Wakil 2 Display */}
                <div className="rounded-xl p-4 flex items-center justify-between bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Calon Wakil Ketua 2</span>
                    <span className="font-heading text-base text-slate-900 block">{selectedWakil2.name}</span>
                  </div>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-200">
                    {String(selectedWakil2.ordinal_number).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Warning Alert box */}
              <div className="flex items-start gap-3 rounded-xl p-4 mb-6 text-left text-xs bg-amber-50 text-amber-700 border border-amber-100">
                <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
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
                  className="flex-1 py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm transition-all hover:bg-slate-50"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-3 px-4 rounded-xl primary-button text-sm flex items-center justify-center gap-2"
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
