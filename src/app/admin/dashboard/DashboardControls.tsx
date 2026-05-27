'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSystemConfig, resetVotingData } from '@/lib/actions/admin';
import { Play, Square, CircleCheck, Eye, EyeOff, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardControlsProps {
  currentStatus: string;
  showResults: boolean;
}

export default function DashboardControls({
  currentStatus,
  showResults,
}: DashboardControlsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    const res = await updateSystemConfig('voting_status', newStatus);
    setIsLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Gagal mengubah status pemilihan');
    }
  };

  const handleShowResultsToggle = async () => {
    setIsLoading(true);
    const newValue = showResults ? 'false' : 'true';
    const res = await updateSystemConfig('show_results', newValue);
    setIsLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Gagal mengubah pengaturan visibilitas hasil');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText !== 'RESET') {
      setResetError('Teks konfirmasi salah');
      return;
    }

    setIsLoading(true);
    setResetError(null);

    const res = await resetVotingData();
    setIsLoading(false);

    if (res.success) {
      setIsResetOpen(false);
      setResetConfirmText('');
      router.refresh();
    } else {
      setResetError(res.error || 'Gagal mereset data');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* 1. Voting Period Status Controls */}
      <div className="glass-panel rounded-3xl p-6 border border-white/50 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-extrabold text-sm text-brand-navy-900 mb-1">
            Status Periode Voting
          </h3>
          <p className="text-slate-400 text-xs mb-5 font-semibold">
            Buka, tutup, atau akhiri pemungutan suara pilketos.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Status CLOSED */}
          <button
            onClick={() => handleStatusChange('closed')}
            disabled={isLoading || currentStatus === 'closed'}
            className={`py-3.5 px-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
              currentStatus === 'closed'
                ? 'bg-slate-200 border-slate-300 text-slate-700 shadow-inner'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Square className="w-4 h-4" />
            <span>CLOSED</span>
          </button>

          {/* Status OPEN */}
          <button
            onClick={() => handleStatusChange('open')}
            disabled={isLoading || currentStatus === 'open'}
            className={`py-3.5 px-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
              currentStatus === 'open'
                ? 'bg-brand-emerald-500 border-brand-emerald-400 text-white shadow-brand shadow-emerald-500/20'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>OPEN</span>
          </button>

          {/* Status ENDED */}
          <button
            onClick={() => handleStatusChange('ended')}
            disabled={isLoading || currentStatus === 'ended'}
            className={`py-3.5 px-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
              currentStatus === 'ended'
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/25'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <CircleCheck className="w-4 h-4" />
            <span>ENDED</span>
          </button>
        </div>
      </div>

      {/* 2. Public Results Config & System Reset Controls */}
      <div className="glass-panel rounded-3xl p-6 border border-white/50 flex flex-col md:flex-row gap-4 items-stretch justify-stretch">
        
        {/* Public Results Visibility Toggle */}
        <div className="flex-1 bg-white/40 p-4 rounded-2xl border border-slate-200/40 flex flex-col justify-between items-start">
          <div>
            <h4 className="font-heading font-bold text-xs text-brand-navy-900 mb-1">
              Visibilitas Hasil Publik
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mb-3">
              Perolehan suara diakses publik tanpa login.
            </p>
          </div>

          <button
            onClick={handleShowResultsToggle}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
              showResults
                ? 'bg-brand-amber-500 text-white shadow-brand-gold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {showResults ? (
              <>
                <Eye className="w-4 h-4" /> Hasil Publik Aktif
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" /> Hasil Publik Senyap
              </>
            )}
          </button>
        </div>

        {/* Database Clear Reset */}
        <div className="flex-1 bg-red-50/20 p-4 rounded-2xl border border-red-100/40 flex flex-col justify-between items-start">
          <div>
            <h4 className="font-heading font-bold text-xs text-red-800 mb-1">
              Reset Data Pemilihan
            </h4>
            <p className="text-[10px] text-red-500 font-semibold mb-3">
              Bersihkan seluruh suara masuk secara permanen.
            </p>
          </div>

          <button
            onClick={() => setIsResetOpen(true)}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 font-extrabold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" /> Kosongkan Kotak Suara
          </button>
        </div>

      </div>

      {/* Reset Confirmation Overlay Modal */}
      <AnimatePresence>
        {isResetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl z-10 flex flex-col"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 text-red-600 mb-4 self-center animate-pulse">
                <ShieldAlert className="w-7 h-7" />
              </div>
              
              <h3 className="font-heading font-black text-xl text-center text-brand-navy-900 leading-tight">
                Apakah Anda Yakin?
              </h3>
              <p className="text-slate-500 text-xs text-center mt-2 leading-relaxed px-2">
                Tindakan ini akan <strong>menghapus seluruh hasil suara</strong>, mengatur ulang status pemilih menjadi belum memilih, dan membersihkan logs secara permanen. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
              </p>

              {resetError && (
                <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-3 text-xs mt-4 text-center font-semibold">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleReset} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1 ml-1 text-left">
                    Ketik <span className="text-red-600 font-black">RESET</span> untuk konfirmasi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ketik RESET"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm text-center font-bold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetOpen(false);
                      setResetConfirmText('');
                    }}
                    className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetConfirmText !== 'RESET' || isLoading}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mereset...
                      </>
                    ) : (
                      'KOSONGKAN DATA'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
