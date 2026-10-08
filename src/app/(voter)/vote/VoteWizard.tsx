'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { castSplitVote } from '@/lib/actions/vote';
import { loginVoterToken, logout } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import CandidateCard, { Candidate } from '@/components/CandidateCard';
import Link from 'next/link';
import {
  LogOut,
  Check,
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Vote,
  X,
  WifiOff,
  Wifi,
  AlertTriangle,
  Ticket,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { saveVoteOffline, pendingCount, getPendingQueue } from '@/lib/offline/offlineQueue';
import { syncOfflineVotes } from '@/lib/offline/syncVotes';

const SESSION_KEY = 'nawa_voter_session';

export interface CategorizedCandidate extends Candidate {
  category: 'ketua' | 'wakil_1' | 'wakil_2';
}

interface VoteWizardProps {
  candidates?: CategorizedCandidate[];
  voterToken?: string;
  voterId?: string;
}

export default function VoteWizard({
  candidates: propCandidates,
  voterToken: propVoterToken,
  voterId: propVoterId,
}: VoteWizardProps) {
  const router = useRouter();
  const { isOnline, wasOffline } = useOnlineStatus();

  // Register the service worker for offline caching (no-op if unsupported)
  useServiceWorker();

  // ── Candidates state with localStorage fallback ─────────────────────────────
  const [candidates, setCandidates] = useState<CategorizedCandidate[]>(() => {
    if (propCandidates && propCandidates.length > 0) return propCandidates;
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('nawa_candidates');
        if (local) return JSON.parse(local);
        const session = sessionStorage.getItem(SESSION_KEY);
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.candidates?.length) return parsed.candidates;
        }
      } catch {}
    }
    return [];
  });

  // ── Voter Token & ID state with localStorage/cookie fallback ────────────────
  const [voterToken, setVoterToken] = useState<string>(() => {
    if (propVoterToken) return propVoterToken;
    if (typeof window !== 'undefined') {
      try {
        const active = localStorage.getItem('nawa_active_voter');
        if (active) {
          const p = JSON.parse(active);
          if (p.token) return p.token;
        }
        const match = document.cookie.match(/nawa_voter_token=([^;]+)/);
        if (match) return match[1];
      } catch {}
    }
    return '';
  });

  const [voterId, setVoterId] = useState<string>(() => {
    if (propVoterId) return propVoterId;
    if (typeof window !== 'undefined') {
      try {
        const active = localStorage.getItem('nawa_active_voter');
        if (active) {
          const p = JSON.parse(active);
          if (p.id) return p.id;
        }
        const match = document.cookie.match(/nawa_voter_id=([^;]+)/);
        if (match) return match[1];
      } catch {}
    }
    return '';
  });

  // Cache candidates in localStorage and fetch if empty and online
  useEffect(() => {
    if (propCandidates && propCandidates.length > 0) {
      try {
        localStorage.setItem('nawa_candidates', JSON.stringify(propCandidates));
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            candidates: propCandidates,
            voterToken,
            voterId,
          })
        );
      } catch {}
    } else if (candidates.length === 0 && isOnline) {
      (async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('candidates')
            .select('id, ordinal_number, name, photo_url, vision, mission, category')
            .order('category', { ascending: true })
            .order('ordinal_number', { ascending: true });
          if (data && data.length > 0) {
            const typed = data as CategorizedCandidate[];
            setCandidates(typed);
            localStorage.setItem('nawa_candidates', JSON.stringify(typed));
          }
        } catch {}
      })();
    }
  }, [propCandidates, isOnline, candidates.length, voterToken, voterId]);

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

  // Success States (Inline for complete kiosk independence)
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [onlineSuccessToken, setOnlineSuccessToken] = useState<string | null>(null);
  const offlineLocalId = useRef<string>('');
  const [copied, setCopied] = useState(false);

  // Auto-reset countdown for Kiosk Mode (10 seconds)
  const [resetCountdown, setResetCountdown] = useState(10);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [pendingVotes, setPendingVotes] = useState(0);

  // Inline Token Input state (when voterToken is missing, e.g. after kiosk reset)
  const [tokenInput, setTokenInput] = useState('');
  const [tokenInputError, setTokenInputError] = useState<string | null>(null);
  const [isTokenSubmitting, setIsTokenSubmitting] = useState(false);

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

    setPendingVotes(pendingCount());
    setTimeout(() => setSyncStatus('idle'), 4000);
  }, []);

  // Mount sync trigger
  useEffect(() => {
    if (isOnline && pendingCount() > 0) {
      runSync();
    }
    setPendingVotes(pendingCount());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconnect sync trigger
  useEffect(() => {
    if (isOnline && wasOffline) {
      runSync();
    }
  }, [isOnline, wasOffline, runSync]);

  // Kiosk Auto-Reset Countdown Timer
  useEffect(() => {
    if (!offlineSaved && !onlineSuccessToken) {
      setResetCountdown(10);
      return;
    }

    const timer = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextVoter();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineSaved, onlineSuccessToken]);

  // ── Next Voter / Kiosk Reset Handler ─────────────────────────────────────────
  const handleNextVoter = () => {
    setSelectedKetua(null);
    setSelectedWakil1(null);
    setSelectedWakil2(null);
    setStep(1);
    setOfflineSaved(false);
    setOnlineSuccessToken(null);
    setIsConfirmOpen(false);
    setErrorMessage(null);
    setIsLoading(false);
    setCopied(false);
    setVoterToken('');
    setVoterId('');

    if (typeof window !== 'undefined') {
      document.cookie = 'nawa_voter_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'nawa_voter_id=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem('nawa_active_voter');
      sessionStorage.removeItem(SESSION_KEY);
    }
  };

  const handleCancelSession = async () => {
    if (isOnline) {
      try {
        await logout();
        return;
      } catch {}
    }
    handleNextVoter();
  };

  const handleCopyCode = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Inline Token Input Formatter ─────────────────────────────────────────────
  const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    const withoutPrefix = raw.startsWith('NW-') ? raw.slice(3) : raw;
    const suffix = withoutPrefix.replace(/[^A-Z0-9]/g, '').slice(0, 6);

    if (suffix.length === 0 && raw.length <= 3) {
      setTokenInput(raw.slice(0, 3));
    } else {
      setTokenInput('NW-' + suffix);
    }
    setTokenInputError(null);
  };

  // ── Inline Token Submit Handler ──────────────────────────────────────────────
  const handleInlineTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenInputError(null);
    const clean = tokenInput.trim().toUpperCase();

    const tokenRegex = /^NW-[A-Z0-9]{6}$/;
    if (!tokenRegex.test(clean)) {
      setTokenInputError('Format Token salah (contoh: NW-A8B9C2)');
      return;
    }

    const pending = getPendingQueue();
    if (pending.some((v) => v.voterToken === clean)) {
      setTokenInputError('Token ini sudah digunakan untuk memberikan suara pada perangkat ini!');
      return;
    }

    if (!isOnline) {
      setVoterToken(clean);
      setVoterId(`offline-${clean}`);
      localStorage.setItem('nawa_active_voter', JSON.stringify({ token: clean, id: `offline-${clean}` }));
      document.cookie = `nawa_voter_token=${clean}; path=/; max-age=1800; SameSite=Lax`;
      document.cookie = `nawa_voter_id=offline-${clean}; path=/; max-age=1800; SameSite=Lax`;
      setTokenInput('');
      return;
    }

    setIsTokenSubmitting(true);
    try {
      const timeoutPromise = new Promise<{ success: boolean; error?: string; timeout: boolean }>((resolve) =>
        setTimeout(() => resolve({ success: false, timeout: true }), 3500)
      );

      const res = await Promise.race([
        loginVoterToken(clean),
        timeoutPromise,
      ]);

      if ('timeout' in res && res.timeout) {
        // Network timeout / intermittent connectivity: fallback to offline token session immediately
        setVoterToken(clean);
        setVoterId(`offline-${clean}`);
        localStorage.setItem('nawa_active_voter', JSON.stringify({ token: clean, id: `offline-${clean}` }));
        document.cookie = `nawa_voter_token=${clean}; path=/; max-age=1800; SameSite=Lax`;
        document.cookie = `nawa_voter_id=offline-${clean}; path=/; max-age=1800; SameSite=Lax`;
        setTokenInput('');
      } else if (res.success) {
        setVoterToken(clean);
        setVoterId(clean);
        localStorage.setItem('nawa_active_voter', JSON.stringify({ token: clean, id: clean }));
        document.cookie = `nawa_voter_token=${clean}; path=/; max-age=1800; SameSite=Lax`;
        document.cookie = `nawa_voter_id=${clean}; path=/; max-age=1800; SameSite=Lax`;
        setTokenInput('');
      } else {
        setTokenInputError(res.error || 'Gagal masuk bilik suara');
      }
    } catch {
      // Network failure: fallback to offline token session
      setVoterToken(clean);
      setVoterId(`offline-${clean}`);
      localStorage.setItem('nawa_active_voter', JSON.stringify({ token: clean, id: `offline-${clean}` }));
      document.cookie = `nawa_voter_token=${clean}; path=/; max-age=1800; SameSite=Lax`;
      document.cookie = `nawa_voter_id=offline-${clean}; path=/; max-age=1800; SameSite=Lax`;
      setTokenInput('');
    } finally {
      setIsTokenSubmitting(false);
    }
  };

  const getFilteredCandidates = () => {
    if (step === 1) return candidates.filter((c) => c.category === 'ketua');
    if (step === 2) return candidates.filter((c) => c.category === 'wakil_1');
    return candidates.filter((c) => c.category === 'wakil_2');
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

  // ── Vote Submit Handler ──────────────────────────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (!selectedKetua || !selectedWakil1 || !selectedWakil2) return;

    setIsLoading(true);
    setErrorMessage(null);

    const saveOfflineFallback = () => {
      const activeId = voterId || `offline-${voterToken}`;
      const localId = saveVoteOffline(
        voterToken,
        activeId,
        selectedKetua.id,
        selectedWakil1.id,
        selectedWakil2.id
      );
      offlineLocalId.current = localId;
      setPendingVotes(pendingCount());
      setIsConfirmOpen(false);

      if (typeof window !== 'undefined') {
        document.cookie = 'nawa_voter_token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'nawa_voter_id=; path=/; max-age=0; SameSite=Lax';
        localStorage.removeItem('nawa_active_voter');
      }

      setOfflineSaved(true);
      setIsLoading(false);
    };

    if (!isOnline) {
      saveOfflineFallback();
      return;
    }

    try {
      const timeoutPromise = new Promise<{ success: boolean; error?: string; timeout: boolean; token?: string; offline?: boolean }>((resolve) =>
        setTimeout(() => resolve({ success: false, timeout: true, offline: true }), 3500)
      );

      const res = await Promise.race([
        castSplitVote(selectedKetua.id, selectedWakil1.id, selectedWakil2.id),
        timeoutPromise,
      ]);

      if (('timeout' in res && res.timeout) || (!res.success && (res.error === 'OFFLINE' || ('offline' in res && res.offline)))) {
        saveOfflineFallback();
        return;
      }

      if (res.success && res.token) {
        setIsConfirmOpen(false);
        setOnlineSuccessToken(res.token);
        setIsLoading(false);
      } else {
        setErrorMessage(res.error || 'Gagal mengirimkan pilihan suara Anda.');
        setIsLoading(false);
      }
    } catch {
      saveOfflineFallback();
    }
  };

  const stepLabels = [
    { no: 1, name: 'Ketua OSIS' },
    { no: 2, name: 'Wakil Ketua 1' },
    { no: 3, name: 'Wakil Ketua 2' },
  ];

  const currentCandidates = getFilteredCandidates();
  const currentSelection = getSelectedForCurrentStep();
  const offline = !isOnline;

  // ── SCREEN 1: KIOSK TOKEN ENTRY (when no active voter token) ─────────────────
  if (!voterToken) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full min-h-screen">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-navy-900 dark:bg-slate-900 shadow-brand mb-6 text-white p-4 border border-brand-navy-700/50 dark:border-slate-800"
            >
              <NawaLogo />
            </motion.div>
            <h1 className="font-heading text-3xl font-black text-brand-navy-900 dark:text-white tracking-tight mb-2">
              Bilik Suara Kiosk
            </h1>
            <p className="text-xs text-brand-navy-600 dark:text-slate-400 font-medium">
              Sistem Pemungutan Suara Siap Menerima Pemilih
            </p>
          </div>

          <div
            className={`p-8 sm:p-10 rounded-2xl border shadow-xl transition-colors ${
              offline
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800'
            }`}
          >
            {offline && (
              <div className="mb-6 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 text-xs font-bold uppercase tracking-wider">
                <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Mode Offline Aktif — Suara Disimpan Lokal
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-xl font-bold font-heading text-brand-navy-900 dark:text-white">
                Autentikasi Pemilih
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Masukkan token pemilih berikutnya untuk membuka bilik suara.
              </p>
            </div>

            {tokenInputError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
                {tokenInputError}
              </div>
            )}

            <form onSubmit={handleInlineTokenSubmit} className="space-y-6">
              <div className="relative group">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  maxLength={9}
                  placeholder="NW-XXXXXX"
                  value={tokenInput}
                  onChange={handleTokenInputChange}
                  disabled={isTokenSubmitting}
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-center text-lg font-bold tracking-widest uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isTokenSubmitting || tokenInput.length < 9}
                className="w-full py-4 px-6 primary-button text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl shadow-md disabled:opacity-50"
              >
                {isTokenSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa Token...
                  </>
                ) : (
                  <>
                    Buka Bilik Suara <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors duration-200"
            >
              <KeyRound className="w-3.5 h-3.5" /> Portal Panitia
            </Link>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              nawa-vote · Pemilihan Ketua OSIS
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: SUCCESS RECEIPT (ONLINE OR OFFLINE) WITH KIOSK RESET BUTTON ───
  if (offlineSaved || onlineSuccessToken) {
    const isOff = offlineSaved;
    const tokenDisplay = isOff ? offlineLocalId.current : onlineSuccessToken;

    return (
      <div
        className={`flex-1 flex items-center justify-center p-4 relative z-10 w-full overflow-hidden transition-colors min-h-screen ${
          isOff ? 'bg-amber-50 dark:bg-amber-950' : 'bg-brand-navy-50 dark:bg-slate-950'
        }`}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[80px] -z-10 pointer-events-none ${
            isOff ? 'bg-amber-200/40 dark:bg-amber-600/10' : 'bg-brand-amber-100/30 dark:bg-amber-500/10'
          }`}
        />
        <div className="w-full max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
            className={`p-8 md:p-12 text-center flex flex-col items-center shadow-xl rounded-2xl border ${
              isOff
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
                : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800'
            }`}
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 text-brand-navy-900 dark:text-white mb-3 flex items-center justify-center">
                <NawaLogo />
              </div>
              <span className="font-heading font-black text-xs text-slate-400 tracking-[0.25em] uppercase">
                Bilik Suara Nawa
              </span>
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className={`flex items-center justify-center w-24 h-24 rounded-full mb-6 border shadow-inner ${
                isOff
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border-emerald-200 dark:border-emerald-900'
              }`}
            >
              {isOff ? <WifiOff className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-heading text-3xl md:text-4xl font-black mb-3 tracking-tight ${
                isOff ? 'text-amber-900 dark:text-amber-100' : 'text-brand-navy-900 dark:text-white'
              }`}
            >
              {isOff ? 'Suara Tersimpan (Offline)' : 'Suara Terekam!'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-sm px-2 leading-relaxed font-medium ${
                isOff ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isOff
                ? 'Suara Anda tersimpan di memori perangkat ini dan akan disinkronkan otomatis saat terhubung internet.'
                : 'Hak suara Anda telah berhasil disalurkan dan dienkripsi ke dalam database sistem.'}
            </motion.p>

            {/* Offline sync note */}
            {isOff && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-full px-4 py-1.5"
              >
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" /> Menunggu sinkronisasi otomatis
              </motion.div>
            )}

            {/* Receipt Token Box */}
            {tokenDisplay && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`w-full mt-8 rounded-2xl p-5 text-center relative flex flex-col items-center border ${
                  isOff
                    ? 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                    isOff ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {isOff ? 'Kode Simpan Lokal' : 'Resi Bukti Suara'}
                </span>
                <div
                  className="font-mono text-xs py-3 px-4 rounded-xl w-full select-all font-bold break-all border shadow-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {tokenDisplay}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(tokenDisplay)}
                  className={`mt-4 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isOff
                      ? 'bg-white dark:bg-amber-950 text-amber-700 border-amber-200'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Disalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Kode
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* KIOSK RESET ACTION BUTTON (The Key Fix) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full mt-8"
            >
              <button
                type="button"
                onClick={handleNextVoter}
                className={`w-full py-4 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl font-bold shadow-md transition-all ${
                  isOff
                    ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 font-black shadow-amber-500/20'
                    : 'primary-button'
                }`}
              >
                Pemilih Berikutnya (Reset Bilik) <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              {/* Countdown Note */}
              <p
                className={`text-[11px] font-medium mt-3 flex items-center justify-center gap-1.5 ${
                  isOff ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Bilik suara akan direset otomatis dalam {resetCountdown} detik
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: VOTING WIZARD MAIN VIEW ────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative transition-colors duration-500">
      {/* Offline Banner */}
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
            Mode Offline — Suara Disimpan Lokal & Otomatis Disinkronkan Saat Online
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Status Toast */}
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
            {syncStatus === 'syncing' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menyinkronkan {pendingVotes} suara offline...
              </>
            )}
            {syncStatus === 'done' && (
              <>
                <Wifi className="w-4 h-4" /> Semua suara offline berhasil disinkronkan ke server
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertTriangle className="w-4 h-4" /> Sebagian suara gagal disinkronkan. Akan dicoba lagi.
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm relative overflow-hidden transition-colors ${
          offline
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 mt-10'
            : 'bg-white dark:bg-slate-900 border-brand-navy-100 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl border ${
              offline
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                : 'bg-brand-navy-50 dark:bg-slate-800 text-brand-navy-600 dark:text-slate-300 border-brand-navy-100 dark:border-slate-700'
            }`}
          >
            {offline ? <WifiOff className="w-6 h-6" /> : <Vote className="w-6 h-6" />}
          </div>
          <div>
            <p
              className={`text-[10px] uppercase tracking-wider font-bold ${
                offline ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
              }`}
            >
              {offline ? 'Mode Offline Aktif' : 'Sesi Voting Aktif'}
            </p>
            <h2
              className={`font-bold flex items-center gap-2 mt-0.5 ${
                offline ? 'text-amber-900 dark:text-amber-100' : 'text-brand-navy-900 dark:text-white'
              }`}
            >
              Token:{' '}
              <span
                className={`font-mono text-sm px-2 py-0.5 rounded-md border ${
                  offline
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200'
                }`}
              >
                {voterToken}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          {offline ? (
            <div className="hidden sm:flex items-center gap-2 py-2 px-4 rounded-full text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              <WifiOff className="w-4 h-4" /> Kiosk Offline ({pendingVotes} tersimpan)
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 py-2 px-4 rounded-full text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Kerahasiaan Terjamin
            </div>
          )}

          <button
            type="button"
            onClick={handleCancelSession}
            className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Reset Sesi
          </button>
        </div>
      </motion.div>

      {/* Offline warning strip */}
      {offline && (
        <div className="mb-6 flex items-start gap-3 rounded-xl p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            Koneksi internet terputus. Bilik suara tetap aktif dan akan menyimpan semua pilihan di perangkat ini.
            {pendingVotes > 0 && (
              <>
                {' '}
                <strong className="font-bold">{pendingVotes} suara</strong> tersimpan di antrean lokal.
              </>
            )}
          </span>
        </div>
      )}

      {/* Progress wizard indicator bar */}
      <div className="mb-12 max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative mb-2">
          <div
            className={`absolute left-6 right-6 top-6 h-1 rounded-full z-0 ${
              offline ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          />
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
                        : 'bg-brand-navy-700 dark:bg-brand-amber-500 text-white dark:text-brand-navy-950 shadow-md border'
                      : isActive
                      ? offline
                        ? 'bg-white dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-2 border-amber-400 shadow-sm scale-105'
                        : 'bg-white dark:bg-slate-900 text-brand-amber-600 dark:text-brand-amber-400 border-2 border-brand-amber-400 shadow-sm scale-105'
                      : offline
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-300 dark:text-amber-700 border-2 border-amber-200'
                      : 'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-2 border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : lbl.no}
                </button>
                <span
                  className={`text-[11px] font-bold mt-3 tracking-wider uppercase ${
                    isActive
                      ? offline
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-brand-amber-600 dark:text-brand-amber-400'
                      : isCompleted
                      ? offline
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {lbl.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidates Selection Grid */}
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

      {/* Bottom Action Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 py-4 px-6 flex justify-between items-center z-30 border-t shadow-sm transition-colors ${
          offline
            ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="py-3 px-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" /> Sebelumnya
          </button>

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
                : 'bg-brand-navy-900 dark:bg-brand-amber-500 text-white dark:text-brand-navy-950 hover:bg-brand-navy-800'
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

      {/* Confirmation Modal */}
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
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsConfirmOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full transition-colors disabled:opacity-50 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mt-2 mb-6">
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-full mb-4 self-center mx-auto border ${
                    offline
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200'
                      : 'bg-brand-amber-50 dark:bg-amber-950/40 text-brand-amber-500 border-brand-amber-100'
                  }`}
                >
                  {offline ? <WifiOff className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                </div>
                <h2
                  className={`font-heading font-black text-2xl tracking-tight ${
                    offline ? 'text-amber-900 dark:text-amber-100' : 'text-brand-navy-900 dark:text-white'
                  }`}
                >
                  {offline ? 'Simpan Suara Offline' : 'Tinjau Pilihan'}
                </h2>
                <p className="text-xs mt-2 px-2 font-medium text-slate-500 dark:text-slate-400">
                  {offline
                    ? 'Suara akan disimpan di memori lokal perangkat ini dan dikirim ke server saat koneksi pulih.'
                    : 'Pastikan pilihan Anda sudah benar sebelum mengirimkan suara.'}
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Choices Summary */}
              <div className="space-y-3 mb-6 text-sm text-left">
                {[
                  { label: 'Calon Ketua OSIS', candidate: selectedKetua },
                  { label: 'Calon Wakil Ketua 1', candidate: selectedWakil1 },
                  { label: 'Calon Wakil Ketua 2', candidate: selectedWakil2 },
                ].map(({ label, candidate }) => (
                  <div
                    key={label}
                    className={`rounded-2xl p-4 flex items-center justify-between border ${
                      offline
                        ? 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-200'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest block mb-1 text-slate-400">
                        {label}
                      </span>
                      <span className="font-heading font-bold text-base block truncate max-w-[200px] text-brand-navy-900 dark:text-white">
                        {candidate.name}
                      </span>
                    </div>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border shadow-sm shrink-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200">
                      {String(candidate.ordinal_number).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 text-slate-600 dark:text-slate-300"
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
                      <Loader2 className="w-4 h-4 animate-spin" /> {offline ? 'Menyimpan...' : 'Mengirim...'}
                    </>
                  ) : offline ? (
                    'Simpan Offline'
                  ) : (
                    'Kirim Suara'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="h-24" />
    </div>
  );
}
