'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAdmin } from '@/lib/actions/auth';
import { KeyRound, ShieldAlert, Loader2, Sparkles, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Input Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Display URL parameters errors
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setErrorMsg('Akses ditolak. Silakan login dengan akun Panitia yang sah.');
    } else if (errorParam === 'session_conflict') {
      setErrorMsg('Sesi aktif terdeteksi di perangkat lain. Akun Anda telah dikeluarkan.');
    }
  }, [searchParams]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan Password wajib diisi');
      setIsLoading(false);
      return;
    }

    const res = await loginAdmin(email, password);

    if (res.success) {
      router.push('/admin/dashboard');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Login gagal');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 min-h-screen z-10 relative overflow-hidden bg-brand-navy-50 dark:bg-slate-950">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-brand-navy-900 dark:bg-slate-900 shadow-xl mb-6 text-white p-5 border border-brand-navy-700 dark:border-slate-800"
          >
            <div className="w-full h-full drop-shadow-md flex items-center justify-center">
              <NawaLogo />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-4xl font-black text-brand-navy-900 dark:text-white tracking-tight mb-2"
          >
            Panel Panitia
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-semibold text-brand-navy-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-brand-navy-200 dark:border-slate-800 px-4 py-1.5 inline-flex items-center justify-center gap-2 rounded-full shadow-sm"
          >
            Autentikasi Terbatas
          </motion.p>
        </div>

        {/* Outer Form Container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="auth-card p-8 flex flex-col"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-brand-navy-900 dark:text-white font-heading">Akses Admin</h2>
            <p className="text-sm text-brand-navy-500 dark:text-slate-400 mt-1 font-medium">Gunakan kredensial yang sah.</p>
          </div>

          {/* Form Error Alert display */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-5"
              >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm leading-relaxed">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Login Gagal</span>
                    <span className="text-red-500 dark:text-red-400">{errorMsg}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ADMIN LOGIN FORM */}
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-brand-navy-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@sekolah.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full py-3 px-4 modern-input text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-brand-navy-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full py-3 px-4 modern-input pr-10 text-sm"
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy-400 dark:text-slate-500 z-10" />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 primary-button text-xs uppercase tracking-wider"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memproses...
                  </>
                ) : (
                  <>
                    Masuk Dashboard
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-brand-navy-100 dark:border-slate-800 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-navy-400 dark:text-slate-400 hover:text-brand-navy-700 dark:hover:text-amber-400 transition-colors duration-200"
            >
              Kembali ke Bilik Pemilih
            </Link>
          </div>
        </motion.div>

        {/* Secure E-voting watermark warning */}
        <div className="mt-8 text-center">
          <p className="text-xs text-brand-navy-400 dark:text-slate-500 font-medium">
            Sistem Pemilihan Terenkripsi &amp; Terverifikasi Sah.<br />
            Panitia wajib menjaga kerahasiaan data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-4 min-h-[50vh]">
        <div className="text-center py-10 flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-amber-500 mb-4" />
          <p className="text-sm font-medium text-brand-navy-500 dark:text-slate-400">Memuat bilik login...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

