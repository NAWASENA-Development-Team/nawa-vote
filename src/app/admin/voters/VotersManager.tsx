'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateVoterTokens } from '@/lib/actions/admin';
import Papa from 'papaparse';
import {
  Search,
  CheckCircle,
  AlertCircle,
  Download,
  Printer,
  Loader2,
  Lock,
  Unlock,
  Users,
  Ticket,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VoterToken {
  id: string;
  token: string;
  has_voted: boolean;
  voted_at?: string | null;
  vote_token?: string | null;
}

interface VotersManagerProps {
  initialVoters: VoterToken[];
}

export default function VotersManager({ initialVoters }: VotersManagerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenCount, setTokenCount] = useState<number>(50);
  
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter DPT list
  const filteredVoters = initialVoters.filter((v) => {
    const q = searchQuery.toUpperCase();
    return v.token.includes(q) || (v.vote_token && v.vote_token.includes(q));
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenCount <= 0) return;

    setIsGenerating(true);
    setFeedbackMsg(null);

    const res = await generateVoterTokens(tokenCount);
    setIsGenerating(false);

    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Berhasil membuat ${res.count} token baru di database!`,
      });
      router.refresh();
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Gagal membuat token',
      });
    }
  };

  const handleExportCSV = () => {
    if (initialVoters.length === 0) return;

    const dataToExport = initialVoters.map((v) => ({
      Token: v.token,
      'Status Memilih': v.has_voted ? 'Sudah Memilih' : 'Belum Memilih',
      'Waktu Memilih': v.voted_at ? new Date(v.voted_at).toLocaleString('id-ID') : '-',
      'Token Audit (Verifikasi)': v.vote_token || '-',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DPT_Token_Pilketos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPINCards = () => {
    if (initialVoters.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = initialVoters
      .map((v) => `
        <div style="border: 2px dashed #1e3a5f; border-radius: 12px; padding: 16px; margin: 10px; width: 220px; float: left; font-family: sans-serif; text-align: center; background: #fafcff; page-break-inside: avoid;">
          <div style="font-weight: 900; font-size: 14px; color: #1e3a5f; margin-bottom: 4px;">TOKEN NAWA-VOTE</div>
          <div style="font-size: 10px; color: #f59e0b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Pemilihan Ketua & Wakil OSIS</div>
          <div style="font-size: 9px; color: #64748b; margin-bottom: 4px; font-weight: 700;">MASUKKAN KODE TOKEN DI LANDING PAGE:</div>
          <div style="font-size: 20px; font-family: monospace; font-weight: 900; color: #0f172a; background: #e2e8f0; padding: 8px 12px; border-radius: 8px; letter-spacing: 1px;">${v.token}</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 10px; font-weight: 600; line-height: 1.2;">
            Rahasiakan Token Anda!<br>Satu token hanya bisa digunakan sekali.
          </div>
        </div>
      `)
      .join('');

    printWindow.document.write(`
      <html>
        <head><title>Cetak Kartu Token Pemilih</title></head>
        <body onload="window.print(); window.close();" style="margin: 0; padding: 20px;">
          <h2 style="font-family: sans-serif; color: #1e3a5f; text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 20px;">Cetak Kredensial Token Pemilih - NAWA-VOTE</h2>
          <div style="display: flow-root;">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Importer Panel & Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Token Generator Card */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 border border-white/50 flex flex-col justify-between bg-white/40">
          <div>
            <h3 className="font-heading font-extrabold text-sm text-brand-navy-900 mb-1 flex items-center gap-1.5">
              <Ticket className="w-5 h-5 text-brand-navy-700" /> Pembuatan Token Otomatis
            </h3>
            <p className="text-slate-400 text-xs mb-6 font-semibold">
              Buat token pemilih baru secara acak dan langsung disimpan ke database Supabase.
            </p>
          </div>

          {feedbackMsg && (
            <div className={`p-4 rounded-2xl text-xs mb-4 flex items-center gap-2 font-semibold border ${
              feedbackMsg.type === 'success'
                ? 'bg-brand-emerald-50 border-brand-emerald-100 text-brand-emerald-800'
                : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              {feedbackMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-brand-emerald-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Generator Input Form */}
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <div className="flex-1 w-full text-left">
              <label htmlFor="count" className="block text-[9px] uppercase font-extrabold tracking-wider text-slate-400 mb-1.5 ml-1">
                Jumlah Token Yang Ingin Dibuat
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={1000}
                required
                value={tokenCount}
                onChange={(e) => setTokenCount(parseInt(e.target.value, 10))}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-navy-500 bg-white font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-brand-navy-700 hover:bg-brand-navy-800 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-brand disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Membuat...
                </>
              ) : (
                <>
                  <Plus className="w-4.5 h-4.5" /> Generate Token
                </>
              )}
            </button>
          </form>
        </div>

        {/* Database Status Info box */}
        <div className="glass-panel rounded-3xl p-6 border border-white/50 flex flex-col justify-between bg-brand-navy-950 text-white shadow-brand">
          <div>
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-brand-amber-400">DATABASE DPT</span>
            <h3 className="font-heading font-black text-lg text-white mt-1 leading-none flex items-center gap-1.5">
              <Users className="w-5 h-5 text-brand-amber-500" /> Ringkasan Token
            </h3>
            <p className="text-white/50 text-[10px] font-semibold mt-1">
              Pantau total kuota dan status penggunaan token.
            </p>
          </div>

          <div className="mt-6 flex justify-between items-end border-t border-white/10 pt-4 text-xs font-semibold">
            <div>
              <span className="text-[9px] text-white/50 uppercase font-extrabold block">TOTAL TOKEN</span>
              <span className="font-heading font-black text-2xl text-white">
                {initialVoters.length.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-white/50 uppercase font-extrabold block">SUDAH MEMILIH</span>
              <span className="font-heading font-black text-2xl text-brand-emerald-400">
                {initialVoters.filter(v => v.has_voted).length.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* DPT Token database table */}
      <div className="glass-panel rounded-[2rem] border border-white/50 shadow-glass overflow-hidden bg-white/60 p-6">
        
        {/* Table Search & Export Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h4 className="font-heading font-black text-sm text-brand-navy-900 leading-none ml-1">
            Daftar Token Pemilih Tetap (DPT)
          </h4>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={initialVoters.length === 0}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors bg-white disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor CSV
            </button>
            <button
              onClick={handlePrintPINCards}
              disabled={initialVoters.length === 0}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors bg-white disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Token
            </button>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-navy-500 bg-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/50 bg-white/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6 font-extrabold">KODE TOKEN</th>
                <th className="py-3.5 px-6 font-extrabold text-center">Status</th>
                <th className="py-3.5 px-6 font-extrabold">Waktu Memilih</th>
                <th className="py-3.5 px-6 font-extrabold">KODE VERIFIKASI (AUDIT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-brand-navy-900">
              {filteredVoters.length > 0 ? (
                filteredVoters.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-sm text-brand-navy-800">{v.token}</td>
                    <td className="py-3.5 px-6 text-center">
                      {v.has_voted ? (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-brand-emerald-50 text-brand-emerald-700 border border-brand-emerald-100 text-[10px] font-bold">
                          <Unlock className="w-3 h-3" /> Terpakai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/30 text-[10px] font-bold">
                          <Lock className="w-3 h-3" /> Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 font-medium font-mono text-[10px]">
                      {v.voted_at ? new Date(v.voted_at).toLocaleString('id-ID', { hourCycle: 'h24' }) : '-'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[10px] text-slate-500 break-all">{v.vote_token || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 font-medium">
                    Tidak ada token pemilih terdaftar yang cocok dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
