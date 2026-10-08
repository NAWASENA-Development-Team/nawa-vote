'use client';

import React, { useState, useTransition } from 'react';
import { updateSystemConfig } from '@/lib/actions/admin';
import {
  Sparkles,
  ExternalLink,
  Layers,
  Palette,
  Timer,
  Eye,
  EyeOff,
  Tv,
  Check,
  Loader2,
} from 'lucide-react';

interface CandidateItem {
  id: string;
  name: string;
  category: string;
  ordinal_number: number;
}

interface ResultsControlsProps {
  initialConfig: {
    activeJabatan: 'ketua' | 'wakil_1' | 'wakil_2';
    resultsMode: 'session' | 'present';
    revealIdentity: boolean;
    activeInterface: 'cycle' | 'balloon' | 'barchart';
    cycleInterval: string;
    candidateColors: Record<string, 'A' | 'B' | 'C'>;
  };
  candidates: CandidateItem[];
}

export default function ResultsControls({
  initialConfig,
  candidates,
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

  const slotColors = {
    A: { name: 'Slot A (Navy)', hex: '#1e3a5f', bg: 'bg-[#1e3a5f]' },
    B: { name: 'Slot B (Amber)', hex: '#f59e0b', bg: 'bg-[#f59e0b]' },
    C: { name: 'Slot C (Emerald)', hex: '#10b981', bg: 'bg-[#10b981]' },
  };

  return (
    <div className="app-card p-6 border-l-4 border-l-brand-amber-500 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-navy-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-brand-navy-700 dark:text-brand-amber-400" />
            <h3 className="text-lg font-black text-brand-navy-900 dark:text-white font-heading">
              Kontrol Layar Hasil Publik (/results)
            </h3>
            {savingKey && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-brand-amber-600 bg-brand-amber-50 dark:bg-slate-800 px-2 py-0.5 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
              </span>
            )}
          </div>
          <p className="text-xs text-brand-navy-500 dark:text-slate-400 mt-1">
            Pengaturan tampilan live screen IFP/Smartboard, urutan jabatan, dan animasi balon.
          </p>
        </div>

        <a
          href="/results"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-navy-100 dark:bg-slate-800 text-brand-navy-800 dark:text-slate-200 hover:bg-brand-navy-200 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          <span>Buka Layar /results</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 2. Jabatan Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-slate-400 mb-2">
          Jabatan Yang Ditampilkan di Layar
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'ketua', label: 'Ketua OSIS' },
            { id: 'wakil_1', label: 'Wakil Ketua 1' },
            { id: 'wakil_2', label: 'Wakil Ketua 2' },
          ].map((item) => {
            const isActive = activeJabatan === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleJabatanChange(item.id as any)}
                disabled={isPending}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-brand-navy-900 border-brand-navy-900 text-white shadow-sm dark:bg-brand-amber-500 dark:text-brand-navy-950 dark:border-brand-amber-500'
                    : 'bg-white dark:bg-slate-900 border-brand-navy-200 dark:border-slate-800 text-brand-navy-700 dark:text-slate-300 hover:bg-brand-navy-50 dark:hover:bg-slate-800'
                }`}
              >
                {isActive && <Check className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Mode Tampilan & Reveal Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Results Mode */}
        <div className="bg-brand-navy-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-brand-navy-100 dark:border-slate-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-600 dark:text-slate-400 mb-2">
            Mode Tampilan Hasil
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('session')}
              disabled={isPending}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center ${
                resultsMode === 'session'
                  ? 'bg-brand-navy-800 text-white border-brand-navy-800 dark:bg-brand-navy-600'
                  : 'bg-white dark:bg-slate-900 text-brand-navy-600 dark:text-slate-300 border-brand-navy-200 dark:border-slate-700 hover:bg-brand-navy-50'
              }`}
            >
              Mode Sesi (Anonim)
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('present')}
              disabled={isPending}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center ${
                resultsMode === 'present'
                  ? 'bg-brand-amber-500 text-brand-navy-950 border-brand-amber-500 font-black'
                  : 'bg-white dark:bg-slate-900 text-brand-navy-600 dark:text-slate-300 border-brand-navy-200 dark:border-slate-700 hover:bg-brand-navy-50'
              }`}
            >
              Mode Presentasi
            </button>
          </div>
          <p className="text-[11px] text-brand-navy-400 dark:text-slate-500 mt-2">
            {resultsMode === 'session'
              ? 'Data suara masuk live, namun nama kandidat & legenda warna disembunyikan.'
              : 'Semua nama kandidat, legenda warna, dan balon pemenang terbuka penuh.'}
          </p>
        </div>

        {/* Reveal Identity Toggle */}
        <div className="bg-brand-navy-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-brand-navy-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-navy-600 dark:text-slate-400">
                Reveal Identitas
              </label>
              <Sparkles className="w-4 h-4 text-brand-amber-500" />
            </div>
            <p className="text-[11px] text-brand-navy-400 dark:text-slate-500 mb-3">
              Momen dramatis: Buka nama & warna kandidat secara langsung dengan konfeti.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRevealToggle}
            disabled={isPending}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
              revealIdentity
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-brand-navy-200 dark:border-slate-700 text-brand-navy-700 dark:text-slate-300 hover:bg-brand-navy-50'
            }`}
          >
            {revealIdentity ? (
              <>
                <Eye className="w-4 h-4" /> Identitas Terbuka (Revealed)
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" /> Identitas Tersembunyi
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Active Interface & Cycle Interval */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Interface Switcher */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-slate-400 mb-2">
            Antarmuka Tampilan
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cycle', label: 'Auto-Siklus' },
              { id: 'balloon', label: 'Layar Balon' },
              { id: 'barchart', label: 'Bar Chart' },
            ].map((ui) => {
              const isSelected = activeInterface === ui.id;
              return (
                <button
                  key={ui.id}
                  type="button"
                  onClick={() => handleInterfaceChange(ui.id as any)}
                  disabled={isPending}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-navy-900 border-brand-navy-900 text-white shadow-sm dark:bg-brand-amber-500 dark:text-brand-navy-950 dark:border-brand-amber-500'
                      : 'bg-white dark:bg-slate-900 border-brand-navy-200 dark:border-slate-800 text-brand-navy-700 dark:text-slate-300 hover:bg-brand-navy-50'
                  }`}
                >
                  <span>{ui.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interval Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-slate-400 mb-2">
            Interval Siklus
          </label>
          <div className="relative">
            <select
              value={cycleInterval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              disabled={isPending || activeInterface !== 'cycle'}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-brand-navy-200 dark:border-slate-800 text-brand-navy-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-amber-400 disabled:opacity-50"
            >
              <option value="15">15 Detik</option>
              <option value="30">30 Detik (Default)</option>
              <option value="45">45 Detik</option>
              <option value="60">60 Detik (1 Menit)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Candidate Color Slot Assignment */}
      <div className="bg-brand-navy-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-brand-navy-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-navy-600 dark:text-brand-amber-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-slate-300">
            Penetapan Warna Balon ({activeJabatan.replace('_', ' ').toUpperCase()})
          </h4>
        </div>
        <p className="text-[11px] text-brand-navy-500 dark:text-slate-400">
          Tentukan slot warna A, B, atau C untuk masing-masing kandidat. Warna tetap tersimpan saat reset data pemungutan suara.
        </p>

        {currentCandidates.length > 0 ? (
          <div className="space-y-2 pt-1">
            {currentCandidates.map((cand, idx) => {
              const currentSlot =
                candidateColors[cand.id] || (idx === 0 ? 'A' : idx === 1 ? 'B' : 'C');

              return (
                <div
                  key={cand.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-navy-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-brand-navy-100 dark:bg-slate-800 text-brand-navy-700 dark:text-slate-300 font-black text-[11px]">
                      {cand.ordinal_number}
                    </span>
                    <span className="font-bold text-brand-navy-900 dark:text-white truncate">
                      {cand.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-inner"
                      style={{ backgroundColor: slotColors[currentSlot]?.hex }}
                    />
                    <select
                      value={currentSlot}
                      onChange={(e) =>
                        handleColorSlotChange(cand.id, e.target.value as 'A' | 'B' | 'C')
                      }
                      disabled={isPending}
                      className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-brand-navy-50 dark:bg-slate-800 border border-brand-navy-200 dark:border-slate-700 text-brand-navy-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-amber-400"
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
          <div className="text-center py-4 text-xs font-semibold text-brand-navy-400">
            Belum ada kandidat terdaftar untuk jabatan ini.
          </div>
        )}
      </div>
    </div>
  );
}
