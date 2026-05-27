'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAdmin } from '@/lib/actions/auth';
import { KeyRound, ShieldAlert, Loader2, Sparkles, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';
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
    <div className="flex-grow flex items-center justify-center p-4 min-h-screen z-10 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand Header */}
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
            Panel Panitia
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-4 py-1.5 inline-flex items-center justify-center gap-2 rounded-full shadow-sm"
          >
            Autentikasi Terbatas
          </motion.p>
        </div>

        {/* Outer Form Container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 flex flex-col"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Akses Admin</h2>
            <p className="text-sm text-slate-500 mt-1">Gunakan kredensial yang sah.</p>
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
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm leading-relaxed">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Login Gagal</span>
                    <span className="text-red-500">{errorMsg}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ADMIN LOGIN FORM */}
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                className="w-full py-3 px-4 modern-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                  className="w-full py-3 px-4 modern-input pr-10"
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 primary-button text-sm uppercase tracking-wider"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memproses...
                  </>
                ) : (
                  <>
                    Masuk Dashboard <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-violet-600 transition-colors duration-200"
            >
              Kembali ke Bilik Pemilih
            </Link>
          </div>
        </motion.div>

        {/* Secure E-voting watermark warning */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-medium">
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
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
          <p className="text-sm font-medium text-slate-500">Memuat bilik login...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
