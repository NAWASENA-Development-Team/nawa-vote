'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Loader2, WifiOff, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';

function SuccessView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const isOffline = searchParams.get('offline') === 'true';

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = async () => {
    try {
      await logout();
    } catch {
      document.cookie = 'nawa_voter_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'nawa_voter_id=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem('nawa_active_voter');
      window.location.href = '/';
    }
  };

  return (
    <div className={`flex-1 flex items-center justify-center p-4 relative z-10 w-full overflow-hidden transition-colors ${
      isOffline ? 'bg-amber-50 dark:bg-amber-950' : 'bg-brand-navy-50 dark:bg-slate-950'
    }`}>
      {/* Ambient background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[80px] -z-10 pointer-events-none ${
        isOffline ? 'bg-amber-200/40 dark:bg-amber-600/10' : 'bg-brand-amber-100/30 dark:bg-amber-500/10'
      }`} />
      
      <div className="w-full max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
          className={`p-8 md:p-12 text-center flex flex-col items-center shadow-xl rounded-2xl border ${
            isOffline
              ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
              : 'app-card'
          }`}
        >
          {/* Logo Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-12 h-12 text-brand-navy-900 dark:text-white mb-4 flex items-center justify-center">
              <NawaLogo />
            </div>
            <span className="font-heading font-black text-xs text-brand-navy-400 dark:text-slate-400 tracking-[0.25em] uppercase">
              Bilik Suara Nawa
            </span>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className={`flex items-center justify-center w-24 h-24 rounded-full mb-8 border shadow-inner ${
              isOffline
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500 border-amber-200 dark:border-amber-800'
                : 'bg-brand-amber-50 dark:bg-amber-950/40 text-brand-amber-500 border-brand-amber-200/50 dark:border-amber-900/50'
            }`}
          >
            {isOffline ? <WifiOff className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
          </motion.div>

          {/* Titles */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`font-heading text-3xl md:text-4xl font-black mb-4 tracking-tight ${
              isOffline ? 'text-amber-900 dark:text-amber-100' : 'text-brand-navy-900 dark:text-white'
            }`}
          >
            {isOffline ? 'Suara Tersimpan' : 'Suara Terekam'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-sm px-2 leading-relaxed font-medium ${
              isOffline ? 'text-amber-700 dark:text-amber-300' : 'text-brand-navy-500 dark:text-slate-400'
            }`}
          >
            {isOffline
              ? 'Suara Anda disimpan di perangkat ini. Akan dikirim ke server secara otomatis saat koneksi internet pulih.'
              : 'Hak pilih Anda telah berhasil disalurkan dan dienkripsi ke dalam sistem secara permanen.'}
          </motion.p>

          {/* Offline sync status note */}
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-5 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-full px-4 py-2"
            >
              <Clock className="w-4 h-4 flex-shrink-0" /> Menunggu sinkronisasi otomatis
            </motion.div>
          )}

          {/* Token Display */}
          {token && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`w-full mt-10 rounded-2xl p-6 text-center relative flex flex-col items-center border ${
                isOffline
                  ? 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-brand-navy-50/50 dark:bg-slate-800/50 border-brand-navy-100/80 dark:border-slate-700'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${
                isOffline ? 'text-amber-600 dark:text-amber-400' : 'text-brand-navy-400 dark:text-slate-400'
              }`}>
                {isOffline ? 'Kode Simpan Lokal' : 'Resi Bukti Suara'}
              </span>

              <div
                className={`font-mono text-sm py-4 px-4 rounded-xl w-full select-all font-bold break-all border shadow-sm ${
                  isOffline
                    ? 'bg-white dark:bg-amber-950 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-900 text-brand-navy-900 dark:text-white border-brand-navy-200 dark:border-slate-700'
                }`}
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {token}
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={`mt-5 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                  copied
                    ? 'bg-brand-amber-500 text-brand-navy-950 font-bold border-none'
                    : isOffline
                    ? 'bg-white dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:border-amber-400'
                    : 'bg-white dark:bg-slate-800 border-2 border-brand-navy-100 dark:border-slate-700 text-brand-navy-600 dark:text-slate-200 hover:border-brand-amber-300 dark:hover:border-amber-400'
                }`}
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> Disalin</>
                ) : (
                  <><Copy className="w-4 h-4" /> Salin Kode</>
                )}
              </button>
            </motion.div>
          )}

          {/* End Session CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full mt-10"
          >
            <button
              onClick={handleEndSession}
              className={`w-full py-4 px-6 text-xs uppercase tracking-widest transition-all flex items-center justify-center shadow-md rounded-xl font-bold ${
                isOffline
                  ? 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                  : 'primary-button'
              }`}
            >
              Selesaikan Sesi <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <p className={`text-[11px] font-medium mt-4 flex items-center justify-center gap-1.5 ${
              isOffline ? 'text-amber-500 dark:text-amber-600' : 'text-brand-navy-400 dark:text-slate-500'
            }`}>
              {isOffline
                ? <><WifiOff className="w-3.5 h-3.5" /> Suara tersimpan — akan disinkronkan otomatis</>
                : <><ShieldCheck className="w-3.5 h-3.5" /> Bilik suara akan direset otomatis</>
              }
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
