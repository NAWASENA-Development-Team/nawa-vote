'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginVoterToken } from '@/lib/actions/auth';
import { ShieldAlert, Loader2, KeyRound, Ticket } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

function LandingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Display URL parameters errors
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setErrorMsg('Sesi tidak valid atau telah berakhir. Silakan masukkan token Anda kembali.');
    } else if (errorParam === 'voter_not_found') {
      setErrorMsg('Token voting tidak terdaftar.');
    }
  }, [searchParams]);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();

    if (val && !val.startsWith('NW-') && val.length <= 6) {
      if ('NW'.startsWith(val) || 'NW-'.startsWith(val)) {
        // Allow typing
      } else {
        val = 'NW-' + val;
      }
    }

    setToken(val.slice(0, 9));
    setErrorMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleanToken = token.trim();

    if (!cleanToken) {
      setErrorMsg('Token voting wajib diisi');
      setIsLoading(false);
      return;
    }

    const tokenRegex = /^NW-[A-Z0-9]{6}$/;
    if (!tokenRegex.test(cleanToken)) {
      setErrorMsg('Format Token salah (contoh: NW-A8B9C2)');
      setIsLoading(false);
      return;
    }

    const res = await loginVoterToken(cleanToken);

    if (res.success) {
      router.push('/vote');
    } else {
      setErrorMsg(res.error || 'Gagal masuk bilik suara');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10 mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-navy-900 dark:bg-slate-900 shadow-brand mb-6 text-white p-4 border border-brand-navy-700/50 dark:border-slate-800 relative overflow-hidden"
        >
          <div className="w-full h-full drop-shadow-md relative z-10 flex items-center justify-center">
            <NawaLogo />
          </div>
        </motion.div>

        <h1 className="font-heading text-4xl font-black text-brand-navy-900 dark:text-white tracking-tight mb-3">
          Nawa Vote
        </h1>

        <p className="text-xs text-brand-navy-600 dark:text-slate-400 font-medium">
          Sistem Pemungutan Suara Digital Resmi
        </p>
      </div>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-card p-8 sm:p-10 flex flex-col"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <h2 className="text-xl font-bold text-brand-navy-900 dark:text-white font-heading">Autentikasi Pemilih</h2>
          <p className="text-sm text-brand-navy-500 dark:text-slate-400 mt-2 font-medium">Masukkan token akses Anda untuk masuk ke bilik suara.</p>
        </div>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mb-6"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm leading-relaxed">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Akses Ditolak</span>
                  <span className="text-red-600/90 dark:text-red-400/90 font-medium">{errorMsg}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <div className="relative group">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy-400 dark:text-slate-500 z-10 transition-colors group-focus-within:text-brand-amber-500" />
              <input
                id="token"
                type="text"
                maxLength={9}
                placeholder="NW-XXXXXX"
                value={token}
                onChange={handleTokenChange}
                disabled={isLoading}
                autoFocus
                required
                className="w-full pl-12 pr-5 py-4 modern-input text-lg text-center font-mono placeholder:text-brand-navy-300 dark:placeholder:text-slate-600 tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              />
            </div>
            <p className="text-xs text-brand-navy-400 dark:text-slate-400 font-medium text-center">
              Token unik dibagikan oleh Panitia Penyelenggara.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-4 px-6 primary-button text-sm uppercase tracking-wider mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memverifikasi...
              </>
            ) : (
              'Masuk Bilik Suara'
            )}
          </button>
        </form>
      </motion.div>

      {/* Admin Link & Footer Note */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-navy-400 dark:text-slate-400 hover:text-brand-navy-700 dark:hover:text-white transition-colors duration-200"
        >
          <KeyRound className="w-3.5 h-3.5" /> Portal Panitia
        </Link>
        <p className="text-[11px] text-brand-navy-400 dark:text-slate-500 font-medium">
          nawa-vote · Pemilihan Ketua OSIS
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex-grow flex items-center justify-center p-4 sm:p-6 min-h-screen bg-brand-navy-50 dark:bg-slate-950 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Suspense fallback={
        <div className="text-center py-10 flex flex-col items-center z-10">
          <Loader2 className="w-10 h-10 animate-spin text-brand-navy-400 dark:text-slate-500 mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest text-brand-navy-500 dark:text-slate-400">Memuat bilik suara...</p>
        </div>
      }>
        <LandingForm />
      </Suspense>
    </div>
  );
}
