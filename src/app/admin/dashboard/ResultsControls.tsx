'use client';

import React, { useState, useTransition } from 'react';
import { updateSystemConfig } from '@/lib/actions/admin';
import {
  Sparkles,
  ExternalLink,
  Palette,
  Eye,
  EyeOff,
  Tv,
  Check,
  Loader2,
  Clock,
  Sliders,
} from 'lucide-react';

interface CandidateItem {
  id: string;
  name: string;
  category: string;
  ordinal_number: number;
}

interface ResultsControlsProps {
  showResults: boolean;
  onToggleShowResults: () => void;
  initialConfig: {
    activeJabatan: 'ketua' | 'wakil_1' | 'wakil_2';
    resultsMode: 'session' | 'present';
    revealIdentity: boolean;
    activeInterface: 'cycle' | 'balloon' | 'barchart';
    cycleInterval: string;
    candidateColors: Record<string, 'A' | 'B' | 'C'>;
  };
  candidates: CandidateItem[];
  onActiveJabatanChange?: (val: 'ketua' | 'wakil_1' | 'wakil_2') => void;
}

export default function ResultsControls({
  showResults,
  onToggleShowResults,
  initialConfig,
  candidates,
  onActiveJabatanChange,
}: ResultsControlsProps) {
  const [isPending, startTransition] = useTransition();

  const [activeJabatan, setActiveJabatan] = useState(initialConfig.activeJabatan);
  const [resultsMode, setResultsMode] = useState(initialConfig.resultsMode);
  const [revealIdentity, setRevealIdentity] = useState(initialConfig.revealIdentity);
  const [activeInterface, setActiveInterface] = useState(initialConfig.activeInterface);
  const [cycleInterval, setCycleInterval] = useState(initialConfig.cycleInterval);
  const [candidateColors, setCandidateColors] = useState(initialConfig.candidateColors);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const saveConfig = (key: string, value: string) => {
    setSavingKey(key);
    startTransition(async () => {
      await updateSystemConfig(key, value);
      setSavingKey(null);
    });
  };

  const handleJabatanChange = (val: 'ketua' | 'wakil_1' | 'wakil_2') => {
    setActiveJabatan(val);
    onActiveJabatanChange?.(val);
    saveConfig('active_jabatan', val);
  };

  const handleModeChange = (val: 'session' | 'present') => {
    setResultsMode(val);
    saveConfig('results_mode', val);
  };

  const handleRevealToggle = () => {
    const nextVal = !revealIdentity;
    setRevealIdentity(nextVal);
    saveConfig('reveal_identity', nextVal ? 'true' : 'false');
  };

  const handleInterfaceChange = (val: 'cycle' | 'balloon' | 'barchart') => {
    setActiveInterface(val);
    saveConfig('active_interface', val);
  };

  const handleIntervalChange = (val: string) => {
    setCycleInterval(val);
    saveConfig('cycle_interval', val);
  };

  const handleColorSlotChange = (candidateId: string, slot: 'A' | 'B' | 'C') => {
    const nextColors = { ...candidateColors, [candidateId]: slot };
    setCandidateColors(nextColors);
    saveConfig('candidate_colors', JSON.stringify(nextColors));
  };

  // Filter candidates for currently active jabatan
  const currentCandidates = candidates
    .filter((c) => c.category === activeJabatan)
    .sort((a, b) => a.ordinal_number - b.ordinal_number);

  const slotColors: Record<'A' | 'B' | 'C', { label: string; hex: string }> = {
    A: { label: 'A (Navy)', hex: '#1e3a5f' },
    B: { label: 'B (Amber)', hex: '#f59e0b' },
    C: { label: 'C (Emerald)', hex: '#10b981' },
  };

  return (
    <div className="space-y-4">
      {/* 1. Master Visibility & Action Strip (Padat & Rapi) */}
      <div className="app-card p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-brand-amber-500">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-navy-900 text-white dark:bg-brand-amber-500 dark:text-brand-navy-950 flex items-center justify-center shrink-0 shadow-sm">
            <Tv className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-brand-navy-900 dark:text-white font-heading">
                Hasil Publik (/results)
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  showResults
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-brand-navy-100 text-brand-navy-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    showResults ? 'bg-emerald-500 animate-pulse' : 'bg-brand-navy-400 dark:bg-slate-500'
                  }`}
                />
                {showResults ? 'Akses Terbuka' : 'Akses Terkunci'}
              </span>
              {savingKey && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-brand-amber-600 bg-brand-amber-50 dark:bg-slate-800 px-2 py-0.5 rounded-full animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Menyimpan...
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-navy-500 dark:text-slate-400 truncate">
              Live broadcast IFP / Smartboard, pergantian jabatan, dan animasi balon.
            </p>
          </div>
        </div>

        {/* Master Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleShowResults}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              showResults
                ? 'bg-brand-navy-900 border-brand-navy-900 text-white hover:bg-brand-navy-800 dark:bg-brand-amber-500 dark:text-brand-navy-950 dark:border-brand-amber-500'
                : 'bg-white dark:bg-slate-900 border-brand-navy-200 dark:border-slate-700 text-brand-navy-700 dark:text-slate-200 hover:bg-brand-navy-50'
            }`}
          >
            {showResults ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400 dark:text-brand-navy-950" />
                <span>Publik: Terlihat</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-brand-navy-400" />
                <span>Publik: Tersembunyi</span>
              </>
            )}
          </button>

          <a
            href="/results"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-navy-100 dark:bg-slate-800 text-brand-navy-800 dark:text-slate-200 hover:bg-brand-navy-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-brand-navy-200/60 dark:border-slate-700"
          >
            <span>Buka /results</span>
            <ExternalLink className="w-3 h-3 text-brand-navy-500 dark:text-slate-400" />
          </a>
        </div>
      </div>

      {/* 2. Dua Kolom Padat (Grid 2 Kolom Seimbang) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kolom Kiri: Konfigurasi Tampilan & Siklus */}
        <div className="app-card p-4 space-y-3.5">
          <div className="flex items-center gap-1.5 pb-2 border-b border-brand-navy-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-brand-amber-500" />
            <span>Pengaturan Tayangan</span>
          </div>

          {/* Row: Jabatan Ditampilkan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <span className="text-xs font-bold text-brand-navy-900 dark:text-white block">
                Jabatan Aktif
              </span>
              <span className="text-[10px] text-brand-navy-400 dark:text-slate-500">
                Kategori yang disiarkan
              </span>
            </div>
            <div className="inline-flex p-0.5 rounded-lg bg-brand-navy-100/70 dark:bg-slate-800 border border-brand-navy-200/60 dark:border-slate-700 shrink-0">
              {[
                { id: 'ketua', label: 'Ketua' },
                { id: 'wakil_1', label: 'Wakil 1' },
                { id: 'wakil_2', label: 'Wakil 2' },
              ].map((item) => {
                const isActive = activeJabatan === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleJabatanChange(item.id as any)}
                    disabled={isPending}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-navy-900 text-white shadow-sm dark:bg-brand-amber-500 dark:text-brand-navy-950'
                        : 'text-brand-navy-600 dark:text-slate-400 hover:text-brand-navy-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row: Mode Tampilan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-brand-navy-50 dark:border-slate-800/80">
            <div>
              <span className="text-xs font-bold text-brand-navy-900 dark:text-white block">
                Mode Tampilan
              </span>
              <span className="text-[10px] text-brand-navy-400 dark:text-slate-500">
                {resultsMode === 'session' ? 'Sesi (identitas disamarkan)' : 'Presentasi (identitas terbuka)'}
              </span>
            </div>
            <div className="inline-flex p-0.5 rounded-lg bg-brand-navy-100/70 dark:bg-slate-800 border border-brand-navy-200/60 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => handleModeChange('session')}
                disabled={isPending}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  resultsMode === 'session'
                    ? 'bg-brand-navy-900 text-white shadow-sm dark:bg-brand-navy-700'
                    : 'text-brand-navy-600 dark:text-slate-400 hover:text-brand-navy-900 dark:hover:text-white'
                }`}
              >
                Sesi
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('present')}
                disabled={isPending}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  resultsMode === 'present'
                    ? 'bg-brand-amber-500 text-brand-navy-950 font-black shadow-sm'
                    : 'text-brand-navy-600 dark:text-slate-400 hover:text-brand-navy-900 dark:hover:text-white'
                }`}
              >
                Presentasi
              </button>
            </div>
          </div>

          {/* Row: Reveal Identitas */}
          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-brand-navy-50 dark:border-slate-800/80">
            <div>
              <span className="text-xs font-bold text-brand-navy-900 dark:text-white flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-amber-500" />
                Reveal Identitas
              </span>
              <span className="text-[10px] text-brand-navy-400 dark:text-slate-500">
                Buka nama & konfeti balon seketika
              </span>
            </div>
            <button
              type="button"
              onClick={handleRevealToggle}
              disabled={isPending}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                revealIdentity
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-brand-navy-200 dark:border-slate-700 text-brand-navy-500 dark:text-slate-400 hover:bg-brand-navy-50'
              }`}
            >
              {revealIdentity ? <Check className="w-3 h-3" /> : null}
              <span>{revealIdentity ? 'Aktif' : 'Nonaktif'}</span>
            </button>
          </div>

          {/* Row: Antarmuka & Interval */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-brand-navy-50 dark:border-slate-800/80">
            <div>
              <span className="text-xs font-bold text-brand-navy-900 dark:text-white block">
                Visual Antarmuka
              </span>
              <span className="text-[10px] text-brand-navy-400 dark:text-slate-500">
                Siklus otomatis atau kunci layar
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="inline-flex p-0.5 rounded-lg bg-brand-navy-100/70 dark:bg-slate-800 border border-brand-navy-200/60 dark:border-slate-700">
                {[
                  { id: 'cycle', label: 'Siklus' },
                  { id: 'balloon', label: 'Balon' },
                  { id: 'barchart', label: 'Bar' },
                ].map((item) => {
                  const isActive = activeInterface === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInterfaceChange(item.id as any)}
                      disabled={isPending}
                      className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-brand-navy-900 text-white shadow-sm dark:bg-brand-amber-500 dark:text-brand-navy-950'
                          : 'text-brand-navy-600 dark:text-slate-400 hover:text-brand-navy-900 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {activeInterface === 'cycle' && (
                <div className="flex items-center gap-1 bg-brand-navy-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-brand-navy-200/60 dark:border-slate-700 text-xs font-bold text-brand-navy-800 dark:text-slate-200">
                  <Clock className="w-3 h-3 text-brand-navy-400" />
                  <select
                    value={cycleInterval}
                    onChange={(e) => handleIntervalChange(e.target.value)}
                    disabled={isPending}
                    className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="15">15s</option>
                    <option value="30">30s</option>
                    <option value="45">45s</option>
                    <option value="60">60s</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Penetapan Warna Balon (Jabatan Aktif) */}
        <div className="app-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-brand-navy-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-slate-300">
              <Palette className="w-3.5 h-3.5 text-brand-amber-500" />
              <span>Warna Balon ({activeJabatan.replace('_', ' ').toUpperCase()})</span>
            </div>
            <span className="text-[10px] text-brand-navy-400 font-medium">Otomatis tersimpan</span>
          </div>

          {currentCandidates.length > 0 ? (
            <div className="space-y-2">
              {currentCandidates.map((cand, idx) => {
                const currentSlot =
                  candidateColors[cand.id] || (idx === 0 ? 'A' : idx === 1 ? 'B' : 'C');

                return (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-brand-navy-50/60 dark:bg-slate-800/50 border border-brand-navy-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white dark:bg-slate-700 text-brand-navy-800 dark:text-slate-200 font-black text-[10px] shadow-xs shrink-0">
                        {String(cand.ordinal_number).padStart(2, '0')}
                      </span>
                      <span className="font-bold text-brand-navy-900 dark:text-white truncate">
                        {cand.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="w-3 h-3 rounded-full shadow-inner"
                        style={{ backgroundColor: slotColors[currentSlot]?.hex }}
                      />
                      <select
                        value={currentSlot}
                        onChange={(e) =>
                          handleColorSlotChange(cand.id, e.target.value as 'A' | 'B' | 'C')
                        }
                        disabled={isPending}
                        className="py-1 px-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-brand-navy-200/80 dark:border-slate-700 text-brand-navy-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-amber-400 cursor-pointer"
                      >
                        <option value="A">Slot A (Navy)</option>
                        <option value="B">Slot B (Amber)</option>
                        <option value="C">Slot C (Emerald)</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-brand-navy-400 dark:text-slate-500 font-medium">
              Belum ada kandidat terdaftar untuk jabatan ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
