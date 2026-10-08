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
  HelpCircle,
  Activity,
  RefreshCw,
  Tv,
  ExternalLink,
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import ResultsControls from './ResultsControls';

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
  resultsConfig?: {
    activeJabatan: 'ketua' | 'wakil_1' | 'wakil_2';
    resultsMode: 'session' | 'present';
    revealIdentity: boolean;
    activeInterface: 'cycle' | 'balloon' | 'barchart';
    cycleInterval: string;
    candidateColors: Record<string, 'A' | 'B' | 'C'>;
  };
}

export default function DashboardConsole({
  initialCandidates,
  initialTotalVoters,
  initialTotalVotesCast,
  currentStatus,
  showResults,
  resultsConfig = {
    activeJabatan: 'ketua',
    resultsMode: 'session',
    revealIdentity: false,
    activeInterface: 'cycle',
    cycleInterval: '30',
    candidateColors: {},
  },
}: DashboardConsoleProps) {
  const router = useRouter();
  const supabase = createClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'results'>('overview');
  const [showResultsState, setShowResultsState] = useState(showResults);
  const [selectedJabatan, setSelectedJabatan] = useState<'ketua' | 'wakil_1' | 'wakil_2'>(
    resultsConfig.activeJabatan
  );

  useEffect(() => {
    setShowResultsState(showResults);
  }, [showResults]);

  useEffect(() => {
    setSelectedJabatan(resultsConfig.activeJabatan);
  }, [resultsConfig.activeJabatan]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'results') {
        setActiveTab('results');
      }
    }
  }, []);

  const handleTabChange = (tab: 'overview' | 'results') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'results') {
        url.searchParams.set('tab', 'results');
      } else {
        url.searchParams.delete('tab');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

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
    const nextVal = !showResultsState;
    setShowResultsState(nextVal);
    const res = await updateSystemConfig('show_results', nextVal ? 'true' : 'false');
    setIsLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      setShowResultsState(!nextVal);
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
      'bg-brand-navy-700 dark:bg-brand-amber-500',
      'bg-brand-amber-500 dark:bg-brand-navy-400',
      'bg-brand-navy-500 dark:bg-brand-amber-400',
      'bg-brand-amber-600 dark:bg-brand-navy-600',
    ];

    return (
      <div className="app-card p-6 flex flex-col h-full justify-between">
        <div className="mb-4">
          <span className="text-[10px] font-bold text-brand-navy-400 dark:text-slate-400 uppercase tracking-wider">Perolehan Suara</span>
          <h3 className="text-lg font-bold text-brand-navy-900 dark:text-white mt-1">{label}</h3>
        </div>

        <div className="space-y-4 flex-grow flex flex-col justify-center">
          {list.length > 0 ? (
            list.map((c, idx) => {
              const share = catTotal > 0 ? (c.vote_count / catTotal) * 100 : 0;
              const formattedNo = String(c.ordinal_number).padStart(2, '0');
              const isUpdated = lastUpdatedId === c.id;

              return (
                <div key={c.id} className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-brand-navy-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-brand-navy-100 dark:bg-slate-800 text-brand-navy-700 dark:text-slate-300 text-[10px] font-bold">
                        {formattedNo}
                      </span>
                      <span className="font-semibold line-clamp-1 max-w-[140px]">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`transition-colors duration-200 font-bold ${isUpdated ? 'text-brand-amber-500' : 'text-brand-navy-900 dark:text-white'}`}>
                        {c.vote_count}
                      </span>
                      <span className="text-brand-navy-400 dark:text-slate-400 text-xs ml-1.5">({share.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Progressive progress bar */}
                  <div className="h-2 w-full bg-brand-navy-50 dark:bg-slate-800 rounded-full overflow-hidden">
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
            <div className="text-center py-8 text-brand-navy-400 dark:text-slate-500 text-sm">Belum ada data kandidat</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Navigation Tabs & Realtime Indicator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 app-card py-3 px-4">
        {/* Navigation Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-brand-navy-100/70 dark:bg-slate-800 border border-brand-navy-200/50 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-brand-navy-900 text-white shadow-sm dark:bg-brand-amber-500 dark:text-brand-navy-950'
                : 'text-brand-navy-600 dark:text-slate-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview & Suara</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('results')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'results'
                ? 'bg-brand-navy-900 text-white shadow-sm dark:bg-brand-amber-500 dark:text-brand-navy-950'
                : 'text-brand-navy-600 dark:text-slate-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Hasil Publik (/results)</span>
            {showResultsState && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Realtime Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium self-end sm:self-center">
          {connectionStatus === 'connected' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                <Radio className="w-3.5 h-3.5" /> Realtime Sync Aktif
              </span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-amber-500" />
              <span className="text-brand-amber-600 dark:text-brand-amber-400 text-xs font-semibold">Menghubungkan ulang...</span>
            </>
          )}
        </div>
      </div>

      {/* 2. TAB: OVERVIEW & SUARA */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Turnout Metrics badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tokens */}
            <div className="app-card p-5 flex items-center gap-4 border-l-4 border-l-brand-navy-700 dark:border-l-brand-navy-500">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-navy-50 dark:bg-slate-800 text-brand-navy-700 dark:text-brand-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-navy-400 dark:text-slate-400 block mb-1">Total Token DPT</span>
                <span className="font-heading text-2xl font-black text-brand-navy-900 dark:text-white">
                  {totalVoters.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Valid Turnout Votes */}
            <div className="app-card p-5 flex items-center gap-4 border-l-4 border-l-brand-amber-500">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-navy-50 dark:bg-slate-800 text-brand-amber-500">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-navy-400 dark:text-slate-400 block mb-1">Suara Masuk</span>
                <span className="font-heading text-2xl font-black text-brand-navy-900 dark:text-white">
                  {totalVotesCast.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Turnout Percentages */}
            <div className="app-card p-5 flex items-center gap-4 border-l-4 border-l-brand-navy-500 dark:border-l-brand-navy-400">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-navy-50 dark:bg-slate-800 text-brand-navy-600 dark:text-slate-200">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-navy-400 dark:text-slate-400 block mb-1">Partisipasi</span>
                <span className="font-heading text-2xl font-black text-brand-navy-900 dark:text-white">
                  {participationRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Golput metrics */}
            <div className="app-card p-5 flex items-center gap-4 border-l-4 border-l-slate-400 dark:border-l-slate-600">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-navy-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-navy-400 dark:text-slate-400 block mb-1">Belum Memilih</span>
                <span className="font-heading text-2xl font-black text-brand-navy-900 dark:text-white">
                  {golputCount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Voting Period Status & Reset Controls (2 Kolom Seimbang) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status toggles */}
            <div className="app-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-brand-navy-900 dark:text-white mb-1">
                  Status Periode Voting
                </h3>
                <p className="text-brand-navy-500 dark:text-slate-400 text-xs mb-5 font-medium">
                  Tentukan periode status pemungutan suara secara realtime.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleStatusChange('closed')}
                  disabled={isLoading || currentStatus === 'closed'}
                  className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
                    currentStatus === 'closed'
                      ? 'bg-brand-navy-100 dark:bg-slate-800 border-brand-navy-300 dark:border-slate-700 text-brand-navy-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800 text-brand-navy-400 dark:text-slate-500 hover:bg-brand-navy-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span>Closed</span>
                </button>

                <button
                  onClick={() => handleStatusChange('open')}
                  disabled={isLoading || currentStatus === 'open'}
                  className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
                    currentStatus === 'open'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800 text-brand-navy-400 dark:text-slate-500 hover:bg-brand-navy-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>Open</span>
                </button>

                <button
                  onClick={() => handleStatusChange('ended')}
                  disabled={isLoading || currentStatus === 'ended'}
                  className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border ${
                    currentStatus === 'ended'
                      ? 'bg-red-600 border-red-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800 text-brand-navy-400 dark:text-slate-500 hover:bg-brand-navy-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CircleCheck className="w-4 h-4" />
                  <span>Ended</span>
                </button>
              </div>
            </div>

            {/* Reset Database Card */}
            <div className="app-card p-6 flex flex-col justify-between border-l-4 border-l-red-500">
              <div>
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1">
                  Reset Kotak Suara
                </h3>
                <p className="text-brand-navy-500 dark:text-slate-400 text-xs mb-5 font-medium">
                  Hapus permanen seluruh suara masuk, audit log, dan kembalikan hak pilih token.
                </p>
              </div>

              <button
                onClick={() => setIsResetOpen(true)}
                disabled={isLoading}
                className="w-full py-3 px-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" /> Reset Kotak Suara
              </button>
            </div>
          </div>

          {/* Three Live SVG Bar Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderCategoryChart('ketua', 'Ketua OSIS')}
            {renderCategoryChart('wakil_1', 'Wakil Ketua 1')}
            {renderCategoryChart('wakil_2', 'Wakil Ketua 2')}
          </div>

          {/* Secure Audit Token Verifier Card */}
          <div className="app-card p-8 mb-10">
            <h3 className="text-lg font-bold text-brand-navy-900 dark:text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Audit Independen Token Suara
            </h3>
            <p className="text-brand-navy-500 dark:text-slate-400 text-xs mb-6 font-medium">
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
                className="w-full sm:w-auto py-3 px-6 primary-button text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Memeriksa
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1.5" /> Verifikasi
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
                    <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Suara Terverifikasi Sah!</h4>
                          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
                            Token tervalidasi resmi di kotak suara digital. Hak suara aman dihitung.
                          </p>
                        </div>
                      </div>
                      {verifyResult.votedAt && (
                        <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 rounded-lg py-1.5 px-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          DITERIMA: {new Date(verifyResult.votedAt).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 p-4 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Token Tidak Terdaftar / Tidak Valid</h4>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 font-medium">
                          {verifyResult.error || 'Token suara di atas tidak ditemukan di dalam kotak suara digital.'}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 3. TAB: HASIL PUBLIK (/results) */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Dense Unified Results Controls */}
          <ResultsControls
            showResults={showResultsState}
            onToggleShowResults={handleShowResultsToggle}
            initialConfig={resultsConfig}
            candidates={candidates}
            onActiveJabatanChange={setSelectedJabatan}
          />

          {/* Quick Data Review for Active Jabatan */}
          <div className="app-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-brand-navy-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-brand-navy-400 dark:text-slate-400 uppercase tracking-wider">
                  Tinjauan Data Siaran
                </span>
                <h3 className="text-base font-bold text-brand-navy-900 dark:text-white">
                  Data Terkini: {selectedJabatan === 'ketua' ? 'Ketua OSIS' : selectedJabatan === 'wakil_1' ? 'Wakil Ketua 1' : 'Wakil Ketua 2'}
                </h3>
              </div>
              <a
                href="/results"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-brand-amber-600 hover:text-brand-amber-500 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Lihat Layar Hasil /results</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="max-w-md">
              {renderCategoryChart(
                selectedJabatan,
                selectedJabatan === 'ketua'
                  ? 'Ketua OSIS'
                  : selectedJabatan === 'wakil_1'
                  ? 'Wakil Ketua 1'
                  : 'Wakil Ketua 2'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Database Reset confirmation overlay */}
      <AnimatePresence>
        {isResetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-brand-navy-100 dark:border-slate-800 shadow-2xl z-10 flex flex-col"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 mb-4 self-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-center text-brand-navy-900 dark:text-white">
                Apakah Anda Yakin?
              </h3>
              <p className="text-brand-navy-500 dark:text-slate-400 text-xs text-center mt-2 px-2 font-medium">
                Tindakan ini akan menghapus seluruh hasil suara secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>

              {resetError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg p-3 text-xs mt-4 text-center font-medium">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleReset} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy-700 dark:text-slate-300 mb-1.5 text-center">
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
                    className="flex-1 py-2.5 px-4 rounded-xl border border-brand-navy-200 dark:border-slate-700 hover:bg-brand-navy-50 dark:hover:bg-slate-800 text-brand-navy-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetConfirmText !== 'RESET' || isLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
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
