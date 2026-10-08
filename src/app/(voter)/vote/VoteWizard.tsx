'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { castSplitVote } from '@/lib/actions/vote';
import { logout } from '@/lib/actions/auth';
import CandidateCard, { Candidate } from '@/components/CandidateCard';
import { LogOut, Check, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Vote, X, WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveVoteOffline, pendingCount } from '@/lib/offline/offlineQueue';
import { syncOfflineVotes } from '@/lib/offline/syncVotes';

// Extend Candidate type for categories
export interface CategorizedCandidate extends Candidate {
  category: 'ketua' | 'wakil_1' | 'wakil_2';
}

interface VoteWizardProps {
  candidates: CategorizedCandidate[];
  voterToken: string;
  voterId: string;
}

export default function VoteWizard({ candidates, voterToken, voterId }: VoteWizardProps) {
  const router = useRouter();
  const { isOnline, wasOffline } = useOnlineStatus();

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

  // Sync state — shown as a brief toast when reconnecting
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [pendingVotes, setPendingVotes] = useState(0);

  // Auto-sync when connectivity is restored
  const runSync = useCallback(async () => {
    const count = pendingCount();
    if (count === 0) return;

    setSyncStatus('syncing');
    setPendingVotes(count);
    const result = await syncOfflineVotes();

    if (result.failed === 0) {
      setSyncStatus('done');
    } else {
      setSyncStatus('error');
    }

    // Update pending count after sync
    setPendingVotes(pendingCount());

    // Auto-dismiss the done/error toast after 4 seconds
    setTimeout(() => setSyncStatus('idle'), 4000);
  }, []);

  // On mount: if already online and there are pending votes from a previous session
  // (e.g. device rebooted), sync immediately without waiting for a reconnect event.
  useEffect(() => {
    if (isOnline && pendingCount() > 0) {
      runSync();
    }
    // Refresh the pending badge count regardless
    setPendingVotes(pendingCount());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — mount only

  // Mid-session reconnect: wasOffline flips true after an offline episode in this session.
  useEffect(() => {
    if (isOnline && wasOffline) {
      runSync();
    }
  }, [isOnline, wasOffline, runSync]);

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

    if (!isOnline) {
      // Offline path: save locally and redirect to offline success page
      const localId = saveVoteOffline(
        voterToken,
        voterId,
        selectedKetua.id,
        selectedWakil1.id,
        selectedWakil2.id
      );
      setPendingVotes(pendingCount());
      setIsConfirmOpen(false);
      router.push(`/success?token=${localId}&offline=true`);
      return;
    }

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

  // Offline colour scheme: amber warning palette replaces navy
  const offline = !isOnline;

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 relative transition-colors duration-500`}>

      {/* Offline Banner — fixed top strip */}
      <AnimatePresence>
        {offline && (
          <motion.div
            key="offline-banner"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 text-amber-950 text-xs font-bold uppercase tracking-wider shadow-md"
          >
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            Mode Offline — Suara akan disimpan lokal dan disinkronkan saat koneksi pulih
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync toast — shown on reconnect */}
      <AnimatePresence>
        {syncStatus !== 'idle' && (
          <motion.div
            key="sync-toast"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider shadow-md ${
              syncStatus === 'syncing'
                ? 'bg-brand-navy-600 text-white'
                : syncStatus === 'done'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {syncStatus === 'syncing' && <><Loader2 className="w-4 h-4 animate-spin" /> Menyinkronkan {pendingVotes} suara offline...</>}
            {syncStatus === 'done' && <><Wifi className="w-4 h-4" /> Semua suara berhasil disinkronkan ke server</>}
            {syncStatus === 'error' && <><AlertTriangle className="w-4 h-4" /> Sebagian suara gagal disinkronkan. Coba lagi nanti.</>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header metadata bar */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm relative overflow-hidden transition-colors ${
          offline
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800'
        } ${offline ? 'mt-10' : ''}`}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${
            offline
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
              : 'bg-brand-navy-50 dark:bg-slate-800 text-brand-navy-600 dark:text-slate-300 border-brand-navy-100 dark:border-slate-700'
          }`}>
            {offline
              ? <WifiOff className="w-6 h-6" />
              : <Vote className="w-6 h-6 text-brand-navy-700 dark:text-brand-amber-400" />
            }
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider font-bold ${
              offline ? 'text-amber-600 dark:text-amber-400' : 'text-brand-navy-400 dark:text-slate-400'
            }`}>
              {offline ? 'Mode Offline Aktif' : 'Sesi Voting Aktif'}
            </p>
            <h2 className={`font-bold flex items-center gap-2 mt-0.5 ${
              offline ? 'text-amber-900 dark:text-amber-100' : 'text-brand-navy-900 dark:text-white'
            }`}>
              Token:{' '}
              <span className={`font-mono text-sm px-2 py-0.5 rounded-md border ${
                offline
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700'
                  : 'bg-brand-amber-50 dark:bg-amber-950/40 text-brand-amber-700 dark:text-amber-300 border-brand-amber-100 dark:border-amber-900/50'
              }`}>
                {voterToken}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          {offline ? (
            <div className="hidden sm:flex items-center gap-2 py-2 px-4 rounded-full text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 text-xs font-bold uppercase tracking-wider">
              <WifiOff className="w-4 h-4" /> Offline
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 py-2 px-4 rounded-full text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Kerahasiaan Terjamin
            </div>
          )}

          <button
            onClick={() => logout()}
            className="py-2.5 px-4 rounded-xl text-brand-navy-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-brand-navy-50 dark:hover:bg-slate-700 text-brand-navy-900 dark:text-white border border-brand-navy-200 dark:border-slate-700 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Batalkan Sesi
          </button>
        </div>
      </motion.div>

      {/* Offline warning strip inside content area */}
      {offline && (
        <div className="mb-6 flex items-start gap-3 rounded-xl p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            Koneksi internet terputus. Suara yang masuk akan disimpan di perangkat ini dan dikirim ke server secara otomatis begitu koneksi pulih.
            {pendingVotes > 0 && (
              <> <strong className="font-bold">{pendingVotes} suara</strong> sedang menunggu sinkronisasi.</>
            )}
          </span>
        </div>
      )}

      {/* Progress wizard state steps indicator bar */}
      <div className="mb-12 max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative mb-2">
          {/* Connector bar background */}
          <div className={`absolute left-6 right-6 top-6 h-1 rounded-full z-0 ${
            offline ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-brand-navy-100 dark:bg-slate-800'
          }`} />

          {/* Connector bar fill progress */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            className={`absolute left-6 top-6 h-1 rounded-full z-0 transition-all duration-500 ease-out ${
              offline ? 'bg-amber-500' : 'bg-brand-navy-600 dark:bg-brand-amber-500'
            }`}
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
                      ? offline
                        ? 'bg-amber-500 text-amber-950 shadow-md border border-amber-600'
                        : 'bg-brand-navy-700 dark:bg-brand-amber-500 text-white dark:text-brand-navy-950 shadow-md border border-brand-navy-800 dark:border-brand-amber-400'
                      : isActive
                      ? offline
                        ? 'bg-white dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-2 border-amber-400 shadow-sm scale-105'
                        : 'bg-white dark:bg-slate-900 text-brand-amber-600 dark:text-brand-amber-400 border-2 border-brand-amber-400 shadow-sm scale-105'
                      : offline
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-300 dark:text-amber-700 border-2 border-amber-200 dark:border-amber-800 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 text-brand-navy-300 dark:text-slate-600 border-2 border-brand-navy-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : lbl.no}
                </button>
                <span className={`text-[11px] font-bold mt-3 tracking-wider uppercase ${
                  isActive
                    ? offline ? 'text-amber-600 dark:text-amber-400' : 'text-brand-amber-600 dark:text-brand-amber-400'
                    : isCompleted
                    ? offline ? 'text-amber-700 dark:text-amber-300' : 'text-brand-navy-700 dark:text-slate-200'
                    : offline ? 'text-amber-300 dark:text-amber-700' : 'text-brand-navy-300 dark:text-slate-500'
                }`}>
                  {lbl.name}
                </span>
              </div>
            );
          })}
        </div>
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
        className={`fixed bottom-0 left-0 right-0 py-4 px-6 flex justify-between items-center z-30 border-t shadow-sm transition-colors ${
          offline
            ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800'
            : 'bg-white/95 dark:bg-slate-900/95 border-brand-navy-100 dark:border-slate-800'
        }`}
      >
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          {/* Back button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="py-3 px-6 rounded-xl bg-white dark:bg-slate-800 border border-brand-navy-200 dark:border-slate-700 text-brand-navy-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all hover:bg-brand-navy-50 dark:hover:bg-slate-700 hover:text-brand-navy-800 dark:hover:text-white disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" /> Sebelumnya
          </button>

          {/* Next Action button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentSelection}
            className={`py-3 px-8 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 3
                ? offline
                  ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold'
                  : 'primary-button'
                : offline
                ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold'
                : 'bg-brand-navy-900 dark:bg-brand-amber-500 text-white dark:text-brand-navy-950 hover:bg-brand-navy-800 dark:hover:bg-brand-amber-400'
            }`}
          >
            {step === 3 ? (
              'Tinjau Pilihan'
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
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`relative w-full max-w-md overflow-hidden rounded-2xl z-10 flex flex-col p-8 max-h-[90vh] overflow-y-auto border shadow-2xl ${
                offline
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800'
              }`}
            >
              <button
                disabled={isLoading}
                onClick={() => setIsConfirmOpen(false)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-colors disabled:opacity-50 ${
                  offline
                    ? 'bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-600 dark:text-amber-400'
                    : 'bg-brand-navy-50 dark:bg-slate-800 hover:bg-brand-navy-100 dark:hover:bg-slate-700 text-brand-navy-400 dark:text-slate-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mt-2 mb-6">
                <div className={`flex items-center justify-center w-14 h-14 rounded-full mb-4 self-center mx-auto border ${
                  offline
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    : 'bg-brand-amber-50 dark:bg-amber-950/40 text-brand-amber-500 border-brand-amber-100/50 dark:border-amber-900/50'
                }`}>
                  {offline ? <WifiOff className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                </div>
                <h2 className={`font-heading font-black text-2xl tracking-tight ${
                  offline ? 'text-amber-900 dark:text-amber-100' : 'text-brand-navy-900 dark:text-white'
                }`}>
                  {offline ? 'Simpan Suara Offline' : 'Tinjau Pilihan'}
                </h2>
                <p className={`text-xs mt-2 px-2 font-medium ${
                  offline ? 'text-amber-700 dark:text-amber-300' : 'text-brand-navy-500 dark:text-slate-400'
                }`}>
                  {offline
                    ? 'Suara akan disimpan di perangkat ini dan dikirim ke server saat koneksi pulih.'
                    : 'Pastikan pilihan Anda untuk semua kategori sudah benar sebelum mengirimkan suara.'}
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Choices Summary board */}
              <div className="space-y-3 mb-6 text-sm text-left">
                {[
                  { label: 'Calon Ketua OSIS', candidate: selectedKetua },
                  { label: 'Calon Wakil Ketua 1', candidate: selectedWakil1 },
                  { label: 'Calon Wakil Ketua 2', candidate: selectedWakil2 },
                ].map(({ label, candidate }) => (
                  <div key={label} className={`rounded-2xl p-4 flex items-center justify-between border ${
                    offline
                      ? 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-brand-navy-50/50 dark:bg-slate-800/50 border-brand-navy-100/80 dark:border-slate-700'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
                        offline ? 'text-amber-600 dark:text-amber-400' : 'text-brand-navy-400 dark:text-slate-400'
                      }`}>{label}</span>
                      <span className={`font-heading font-bold text-base block truncate max-w-[200px] ${
                        offline ? 'text-amber-900 dark:text-amber-100' : 'text-brand-navy-900 dark:text-white'
                      }`}>{candidate.name}</span>
                    </div>
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border shadow-sm shrink-0 ${
                      offline
                        ? 'bg-white dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                        : 'bg-white dark:bg-slate-900 text-brand-navy-600 dark:text-white border-brand-navy-200 dark:border-slate-700'
                    }`}>
                      {String(candidate.ordinal_number).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Warning Alert box */}
              <div className={`flex items-start gap-3 rounded-2xl p-4 mb-6 text-left text-xs font-medium border ${
                offline
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-brand-amber-50/80 dark:bg-amber-950/40 text-brand-amber-800 dark:text-amber-300 border-brand-amber-200/50 dark:border-amber-900/40'
              }`}>
                {offline ? <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" /> : <Check className="w-4 h-4 text-brand-amber-600 dark:text-brand-amber-400 mt-0.5 flex-shrink-0" />}
                <p>
                  {offline
                    ? 'Suara disimpan di perangkat. Token Anda akan dikunci dan pilihan tidak dapat diubah saat sinkronisasi terjadi.'
                    : 'Setelah dikirim, token Anda akan dikunci dan pilihan tidak dapat diubah lagi.'}
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsConfirmOpen(false)}
                  className={`flex-1 py-3.5 px-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                    offline
                      ? 'bg-white dark:bg-amber-950 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900'
                      : 'bg-white dark:bg-slate-800 border-brand-navy-200 dark:border-slate-700 text-brand-navy-600 dark:text-slate-300 hover:bg-brand-navy-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmSubmit}
                  className={`flex-1 py-3.5 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl font-bold transition-all ${
                    offline
                      ? 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                      : 'primary-button'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {offline ? 'Menyimpan' : 'Mengirim'}
                    </>
                  ) : (
                    offline ? 'Simpan Offline' : 'Kirim Suara'
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
