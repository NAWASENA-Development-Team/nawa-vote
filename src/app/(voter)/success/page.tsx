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
    <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-amber-100/30 rounded-full blur-[80px] -z-10 pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
          className="glass-card p-8 md:p-12 text-center flex flex-col items-center bg-white/95 backdrop-blur-xl border border-brand-navy-100 shadow-[0_20px_60px_-15px_rgba(30,58,95,0.1)] rounded-3xl"
        >
          {/* Logo Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-12 h-12 text-brand-navy-900 mb-4">
              <NawaLogo />
            </div>
            <span className="font-heading font-black text-xs text-brand-navy-400 tracking-[0.25em] uppercase">
              Bilik Suara Nawa
            </span>
          </div>

          {/* Animated Success Checkmark Ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex items-center justify-center w-24 h-24 rounded-full mb-8 bg-gradient-to-br from-brand-amber-100 to-brand-amber-50 text-brand-amber-600 border border-brand-amber-200/50 shadow-inner"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>

          {/* Success Titles */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-heading text-3xl md:text-4xl font-black text-brand-navy-900 mb-4 tracking-tight"
          >
            Suara Terekam
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-brand-navy-500 text-sm px-2 leading-relaxed font-medium"
          >
            Hak pilih Anda telah berhasil disalurkan dan dienkripsi ke dalam sistem secara permanen.
          </motion.p>

          {/* Token Display Dashed Board */}
          {token && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full mt-10 rounded-2xl p-6 text-center relative flex flex-col items-center bg-brand-navy-50/50 border border-brand-navy-100/80"
            >
              <span className="text-[10px] font-bold text-brand-navy-400 uppercase tracking-widest mb-3">
                Resi Bukti Suara
              </span>

              <div
                className="font-mono text-brand-navy-900 text-sm py-4 px-4 rounded-xl w-full select-all font-bold break-all bg-white border border-brand-navy-200 shadow-sm"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {token}
              </div>

              {/* Copy action button */}
              <button
                onClick={handleCopy}
                className={`mt-5 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                  copied
                    ? 'bg-brand-amber-500 text-brand-amber-950 shadow-brand-gold border-none'
                    : 'bg-white border-2 border-brand-navy-100 text-brand-navy-600 hover:border-brand-amber-300 hover:bg-brand-amber-50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Disalin
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Salin Resi
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* End Session Call to Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full mt-10"
          >
            <button
              onClick={handleEndSession}
              className="w-full py-4 px-6 bg-brand-navy-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-navy-800 transition-all flex items-center justify-center shadow-brand hover:shadow-lg hover:-translate-y-0.5"
            >
              Selesaikan Sesi <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <p className="text-[11px] font-medium text-brand-navy-400 mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Bilik suara akan direset otomatis
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
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center py-10 flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-amber-500 mb-4" />
          <p className="text-sm font-bold text-brand-navy-500 uppercase tracking-widest">Memuat...</p>
        </div>
      </div>
    }>
      <SuccessView />
    </Suspense>
  );
}
