'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginVoterToken } from '@/lib/actions/auth';
import { ShieldAlert, Loader2, Sparkles, KeyRound, Ticket } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';

function LandingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState('127.0.0.1');

  // Fetch client IP on mount for auditing
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch(() => setClientIp('127.0.0.1'));
  }, []);

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

    // Auto-prepend 'NW-' if the user starts typing alphanumeric without it
    if (val && !val.startsWith('NW-') && val.length <= 6) {
      // If they type NW directly
      if ('NW'.startsWith(val)) {
        // Let them type NW
      } else if ('NW-'.startsWith(val)) {
        // Let them type NW-
      } else {
        val = 'NW-' + val;
      }
    }

    setToken(val.slice(0, 9)); // Max length for 'NW-XXXXXX' is 9 characters
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

    const res = await loginVoterToken(cleanToken, clientIp);

    if (res.success) {
      router.push('/vote');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Gagal masuk bilik suara');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">

      {/* Brand Header Logo */}
      <div className="text-center mb-8 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-md shadow-xl shadow-blue-500/20 mb-6 text-white p-5 border border-white/20"
        >
          <div className="w-full h-full drop-shadow-md">
            <NawaLogo />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="font-heading text-4xl text-slate-900 tracking-tight mb-2"
        >
          Nawa Vote
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-4 py-1.5 inline-flex items-center justify-center gap-2 rounded-full shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Sistem Digital Terverifikasi
        </motion.p>
      </div>

      {/* Main Glass Card Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 flex flex-col"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
            <Ticket className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Autentikasi Pemilih</h2>
          <p className="text-sm text-slate-500 mt-1">Masukkan token akses Anda untuk masuk ke bilik suara.</p>
        </div>

        {/* Error Alert Display Box */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm leading-relaxed">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Akses Ditolak</span>
                  <span className="text-red-500">{errorMsg}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <div className="relative">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
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
                className="w-full pl-12 pr-5 py-3.5 modern-input text-lg text-center font-mono placeholder-slate-300 tracking-wider uppercase"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Token unik ini dibagikan oleh Panitia Penyelenggara.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-3.5 px-5 primary-button text-sm uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memverifikasi...
              </>
            ) : (
              <>
                Masuk Bilik Suara <Sparkles className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Link to Admin Login */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors duration-200"
          >
            <KeyRound className="w-4 h-4" /> Portal Panitia
          </Link>
        </div>
      </motion.div>

      {/* Watermark institutional note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Hak Suara Anda Menentukan Masa Depan.
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex-grow flex items-center justify-center p-4 min-h-screen z-10 relative overflow-hidden">
      <Suspense fallback={
        <div className="text-center py-10 flex flex-col items-center z-10">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-sm font-medium text-slate-500">Memuat bilik suara...</p>
        </div>
      }>
        <LandingForm />
      </Suspense>
    </div>
  );
}
