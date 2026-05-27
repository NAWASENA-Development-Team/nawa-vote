'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';

function SuccessView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = async () => {
    await logout();
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 min-h-screen relative z-10 overflow-hidden">
      <div className="w-full max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="glass-card p-8 md:p-10 text-center flex flex-col items-center"
        >
          {/* Logo Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-10 h-10 text-emerald-500 mb-3">
              <NawaLogo />
            </div>
            <span className="font-heading font-semibold text-sm text-slate-500 tracking-widest uppercase">Nawa Vote</span>
          </div>

          {/* Animated Success Checkmark Ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-emerald-50 text-emerald-500"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>

          {/* Success Titles */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-heading text-3xl md:text-4xl text-slate-900 mb-3"
          >
            Suara Berhasil Dikirim!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 text-sm px-4 leading-relaxed"
          >
            Terima kasih telah berpartisipasi. Hak pilih Anda sangat berharga bagi masa depan organisasi sekolah.
          </motion.p>

          {/* Token Display Dashed Board */}
          {token && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full mt-8 rounded-2xl p-6 text-center relative flex flex-col items-center bg-slate-50 border border-slate-100"
            >
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Kode Verifikasi Suara
              </span>

              <div
                className="font-mono text-slate-800 text-sm py-3 px-4 rounded-xl w-full select-all font-medium break-all bg-white border border-slate-200"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {token}
              </div>

              {/* Copy action button */}
              <button
                onClick={handleCopy}
                className={`mt-4 py-2.5 px-5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Salin Kode
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Explanation Alert */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-start gap-3 rounded-xl p-4 mt-8 text-left text-sm leading-relaxed w-full bg-blue-50 border border-blue-100"
          >
            <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Jaminan Kerahasiaan</p>
              <p className="text-blue-700/80 text-xs">
                Kode di atas hanya membuktikan bahwa suara Anda telah resmi tercatat di database, tanpa menyimpan informasi paslon mana yang Anda pilih.
              </p>
            </div>
          </motion.div>

          {/* End Session Call to Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full mt-8 pt-6 border-t border-slate-100"
          >
            <button
              onClick={handleEndSession}
              className="w-full py-3.5 px-6 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              Selesaikan Sesi <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Keluarkan Anda sehingga bilik suara siap digunakan berikutnya.
            </p>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-4 min-h-[50vh]">
        <div className="text-center py-10 flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-sm font-medium text-slate-500">Memuat halaman sukses...</p>
        </div>
      </div>
    }>
      <SuccessView />
    </Suspense>
  );
}
