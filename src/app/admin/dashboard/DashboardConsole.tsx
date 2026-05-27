'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateSystemConfig, resetVotingData } from '@/lib/actions/admin';
import { verifyVoteToken } from '@/lib/actions/vote';
import {
  Play,
  Square,
  CircleCheck,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  Users,
  UserCheck,
  Percent,
  Search,
  CheckCircle2,
  Radio,
  Sparkles,
  HelpCircle,
  Activity,
  RefreshCw
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

export interface DashboardCandidate {
  id: string;
  ordinal_number: number;
  name: string;
  vote_count: number;
  category: 'ketua' | 'wakil_1' | 'wakil_2';
}

interface DashboardConsoleProps {
  initialCandidates: DashboardCandidate[];
  initialTotalVoters: number;
  initialTotalVotesCast: number;
  currentStatus: string;
  showResults: boolean;
}

export default function DashboardConsole({
  initialCandidates,
  initialTotalVoters,
  initialTotalVotesCast,
  currentStatus,
  showResults,
}: DashboardConsoleProps) {
  const router = useRouter();
  const supabase = createClient();

  // Database Tally and Concurrency States
  const [candidates, setCandidates] = useState<DashboardCandidate[]>(initialCandidates);
  const [totalVoters, setTotalVoters] = useState(initialTotalVoters);
  const [totalVotesCast, setTotalVotesCast] = useState(initialTotalVotesCast);
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Database Reset Modal
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  // Token Audit Verifier States
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    verified: boolean;
    votedAt?: string;
    error?: string;
  } | null>(null);

  // Sync initial props
  useEffect(() => {
    setCandidates(initialCandidates);
    setTotalVoters(initialTotalVoters);
    setTotalVotesCast(initialTotalVotesCast);
  }, [initialCandidates, initialTotalVoters, initialTotalVotesCast]);

  // Supabase Realtime Tally Subscription
  useEffect(() => {
    setConnectionStatus('connecting');

    const channel = supabase
      .channel('db-live-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'candidates' },
        (payload: any) => {
          const updated = payload.new as DashboardCandidate;
          
          setCandidates((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, vote_count: updated.vote_count } : c))
          );

          // Animate and tick total vote count
          setTotalVotesCast(prev => prev + 1);

          setLastUpdatedId(updated.id);
          setTimeout(() => setLastUpdatedId(null), 1500);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Computations
  const participationRate = totalVoters > 0 ? (totalVotesCast / totalVoters) * 100 : 0;
  const golputCount = Math.max(0, totalVoters - totalVotesCast);

  // Settings Toggles
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
    const res = await updateSystemConfig('show_results', showResults ? 'false' : 'true');
    setIsLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Gagal mengubah visibilitas hasil');
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
      setCandidates(candidates.map(c => ({ ...c, vote_count: 0 })));
      setTotalVotesCast(0);
      router.refresh();
    } else {
      setResetError(res.error || 'Gagal mereset data');
    }
  };

  // Audit Action
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTokenInput.trim()) return;

    setIsVerifying(true);
    setVerifyResult(null);

    const res = await verifyVoteToken(verifyTokenInput);
    setIsVerifying(false);
    setVerifyResult(res);
  };

  const renderCategoryChart = (cat: 'ketua' | 'wakil_1' | 'wakil_2', label: string) => {
    const list = candidates.filter(c => c.category === cat).sort((a, b) => a.ordinal_number - b.ordinal_number);
    const catTotal = list.reduce((sum, c) => sum + c.vote_count, 0);

    const barColors = [
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
    ];

    return (
      <div className="glass-card p-6 flex flex-col h-full justify-between">
        <div className="mb-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Live Results</span>
          <h3 className="text-lg font-semibold text-slate-800 mt-1">{label}</h3>
        </div>

        <div className="space-y-4 flex-grow flex flex-col justify-center">
          {list.length > 0 ? (
            list.map((c, idx) => {
              const share = catTotal > 0 ? (c.vote_count / catTotal) * 100 : 0;
              const formattedNo = String(c.ordinal_number).padStart(2, '0');
              const isUpdated = lastUpdatedId === c.id;

              return (
                <div key={c.id} className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {formattedNo}
                      </span>
                      <span className="font-medium line-clamp-1 max-w-[120px]">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`transition-colors duration-200 font-semibold ${isUpdated ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {c.vote_count}
                      </span>
                      <span className="text-slate-400 text-xs ml-1.5">({share.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Progressive progress bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      className={`h-full rounded-full ${barColors[idx % barColors.length]}`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">Belum ada data kandidat</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Realtime indicator header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-card py-3 px-5 gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {connectionStatus === 'connected' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-600 flex items-center gap-1.5">
                <Radio className="w-4 h-4" /> Live Subscription Connected
              </span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span className="text-amber-600">Re-connecting...</span>
            </>
          )}
        </div>
        
        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-slate-400" /> Nawa Vote Console
        </div>
      </div>

      {/* 2. Turnout Metrics badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tokens */}
        <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Total Token DPT</span>
            <span className="font-heading text-2xl font-bold text-slate-800">
              {totalVoters.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Valid Turnout Votes */}
        <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Suara Masuk</span>
            <span className="font-heading text-2xl font-bold text-slate-800">
              {totalVotesCast.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Turnout Percentages */}
        <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Persentase</span>
            <span className="font-heading text-2xl font-bold text-slate-800">
              {participationRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Golput metrics */}
        <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Belum Memilih</span>
            <span className="font-heading text-2xl font-bold text-slate-800">
              {golputCount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Toggles & settings control bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status toggles */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              Status Periode Voting
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              Tentukan periode status pemungutan suara.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleStatusChange('closed')}
              disabled={isLoading || currentStatus === 'closed'}
              className={`py-3 px-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
                currentStatus === 'closed'
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Square className="w-4 h-4" />
              <span>Closed</span>
            </button>

            <button
              onClick={() => handleStatusChange('open')}
              disabled={isLoading || currentStatus === 'open'}
              className={`py-3 px-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
                currentStatus === 'open'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Open</span>
            </button>

            <button
              onClick={() => handleStatusChange('ended')}
              disabled={isLoading || currentStatus === 'ended'}
              className={`py-3 px-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
                currentStatus === 'ended'
                  ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <CircleCheck className="w-4 h-4" />
              <span>Ended</span>
            </button>
          </div>
        </div>

        {/* Results config & Clear database */}
        <div className="glass-card p-6 flex flex-col sm:flex-row gap-4 items-stretch justify-stretch">
          <div className="flex-1 bg-slate-50 p-4 border border-slate-100 rounded-xl flex flex-col justify-between items-start">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Hasil Publik
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Visibilitas hasil tanpa login.
              </p>
            </div>

            <button
              onClick={handleShowResultsToggle}
              disabled={isLoading}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                showResults
                  ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showResults ? (
                <>
                  <Eye className="w-4 h-4" /> Terlihat
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Tersembunyi
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-red-50 p-4 border border-red-100 rounded-xl flex flex-col justify-between items-start">
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-1">
                Reset Data
              </h4>
              <p className="text-xs text-red-600/80 mb-4">
                Hapus suara secara permanen.
              </p>
            </div>

            <button
              onClick={() => setIsResetOpen(true)}
              disabled={isLoading}
              className="w-full py-2.5 px-3 bg-white text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" /> Reset Kotak Suara
            </button>
          </div>
        </div>

      </div>

      {/* 4. Three Live SVG Bar Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCategoryChart('ketua', 'Ketua OSIS')}
        {renderCategoryChart('wakil_1', 'Wakil Ketua 1')}
        {renderCategoryChart('wakil_2', 'Wakil Ketua 2')}
      </div>

      {/* 5. Secure Audit Token Verifier Card */}
      <div className="glass-card p-8 mb-10">
        <h3 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Audit Independen Token Suara
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          Verifikasi keabsahan data tanpa merusak kerahasiaan pilihan voter (UUID v4).
        </p>

        <form onSubmit={handleVerifyToken} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="flex-1 w-full text-left">
            <input
              type="text"
              required
              disabled={isVerifying}
              placeholder="Masukkan UUID Token Suara"
              value={verifyTokenInput}
              onChange={(e) => setVerifyTokenInput(e.target.value)}
              className="w-full py-3 px-4 modern-input text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full sm:w-auto py-3 px-6 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Verifikasi
              </>
            )}
          </button>
        </form>

        {/* Verification Result details */}
        <AnimatePresence>
          {verifyResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6"
            >
              {verifyResult.verified ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-700 text-sm">Suara Terverifikasi Sah!</h4>
                      <p className="text-xs text-emerald-600/80 mt-1">
                        Token tervalidasi resmi di kotak suara digital. Hak suara aman dihitung.
                      </p>
                    </div>
                  </div>
                  {verifyResult.votedAt && (
                    <div className="bg-white border border-emerald-100 rounded-lg py-1.5 px-3 text-[10px] font-semibold text-emerald-600 font-mono">
                      DITERIMA: {new Date(verifyResult.votedAt).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-700 text-sm">Token Tidak Terdaftar / Tidak Valid</h4>
                    <p className="text-xs text-red-600/80 mt-1">
                      {verifyResult.error || 'Token suara di atas tidak ditemukan di dalam kotak suara digital.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Database Reset confirmation overlay */}
      <AnimatePresence>
        {isResetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 shadow-2xl z-10 flex flex-col"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mb-4 self-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-semibold text-center text-slate-800">
                Apakah Anda Yakin?
              </h3>
              <p className="text-slate-500 text-sm text-center mt-2 px-2">
                Tindakan ini akan menghapus seluruh hasil suara secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>

              {resetError && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-3 text-xs mt-4 text-center">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleReset} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 text-center">
                    Ketik <span className="text-red-500 font-bold">RESET</span> untuk konfirmasi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ketik RESET"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="w-full py-2.5 px-4 modern-input text-center text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetOpen(false);
                      setResetConfirmText('');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetConfirmText !== 'RESET' || isLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Mereset
                      </>
                    ) : (
                      'Kosongkan Data'
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
