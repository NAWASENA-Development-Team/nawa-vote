'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertCandidate as saveCandidate, deleteCandidate as removeCandidate } from '@/lib/actions/admin';
import { Plus, Edit2, Trash2, X, PlusCircle, MinusCircle, Loader2, Sparkles, UserPlus, Users2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Candidate {
  id: string;
  ordinal_number: number;
  name: string;
  photo_url?: string | null;
  vision?: string | null;
  mission: string[];
  category: 'ketua' | 'wakil_1' | 'wakil_2';
}

interface CandidateEditorProps {
  initialCandidates: Candidate[];
}

export default function CandidateEditor({ initialCandidates: candidates }: CandidateEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Editor Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Active list category filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'ketua' | 'wakil_1' | 'wakil_2'>('all');

  // Form Fields
  const [ordinalNo, setOrdinalNo] = useState<number>(1);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [vision, setVision] = useState('');
  const [missions, setMissions] = useState<string[]>(['']);
  const [category, setCategory] = useState<'ketua' | 'wakil_1' | 'wakil_2'>('ketua');

  // Delete Safeguard States
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFilteredCandidates = () => {
    if (activeTab === 'all') return candidates;
    return candidates.filter(c => c.category === activeTab);
  };

  const openAddModal = () => {
    setEditingCandidate(null);
    setOrdinalNo(candidates.filter(c => c.category === category).length + 1);
    setName('');
    setPhotoUrl('');
    setVision('');
    setMissions(['']);
    setCategory('ketua');
    setIsOpen(true);
  };

  const openEditModal = (c: Candidate) => {
    setEditingCandidate(c);
    setOrdinalNo(c.ordinal_number);
    setName(c.name);
    setPhotoUrl(c.photo_url || '');
    setVision(c.vision || '');
    setMissions(c.mission.length > 0 ? [...c.mission] : ['']);
    setCategory(c.category);
    setIsOpen(true);
  };

  const handleAddMissionField = () => {
    setMissions([...missions, '']);
  };

  const handleRemoveMissionField = (index: number) => {
    const updated = missions.filter((_, idx) => idx !== index);
    setMissions(updated.length > 0 ? updated : ['']);
  };

  const handleMissionChange = (index: number, val: string) => {
    const updated = [...missions];
    updated[index] = val;
    setMissions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const filteredMissions = missions.map((m) => m.trim()).filter((m) => m !== '');

    const payload = {
      id: editingCandidate?.id,
      ordinal_number: Number(ordinalNo),
      name: name.trim(),
      photo_url: photoUrl.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=1e3a5f,3d619b&textColor=ffffff`,
      vision: vision.trim(),
      mission: filteredMissions,
      category,
    };

    const res = await saveCandidate(payload);
    setIsLoading(false);

    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(res.error || 'Gagal menyimpan data kandidat');
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const res = await removeCandidate(id);
    setIsLoading(false);

    if (res.success) {
      setDeletingId(null);
      router.refresh();
    } else {
      alert(res.error || 'Gagal menghapus kandidat');
    }
  };

  const categoryLabels = {
    ketua: 'Calon Ketua OSIS',
    wakil_1: 'Calon Wakil Ketua OSIS 1',
    wakil_2: 'Calon Wakil Ketua OSIS 2',
  };

  const filteredCandidates = getFilteredCandidates();

  return (
    <div className="space-y-6">
      
      {/* Category Tabs list */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/30 text-xs font-bold uppercase tracking-wider text-slate-400">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 px-4 rounded-xl transition-all ${
            activeTab === 'all' ? 'bg-white text-brand-navy-700 shadow-sm' : 'hover:text-slate-600'
          }`}
        >
          Semua ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab('ketua')}
          className={`py-3 px-4 rounded-xl transition-all ${
            activeTab === 'ketua' ? 'bg-white text-brand-navy-700 shadow-sm' : 'hover:text-slate-600'
          }`}
        >
          Ketua ({candidates.filter(c => c.category === 'ketua').length})
        </button>
        <button
          onClick={() => setActiveTab('wakil_1')}
          className={`py-3 px-4 rounded-xl transition-all ${
            activeTab === 'wakil_1' ? 'bg-white text-brand-navy-700 shadow-sm' : 'hover:text-slate-600'
          }`}
        >
          Wakil 1 ({candidates.filter(c => c.category === 'wakil_1').length})
        </button>
        <button
          onClick={() => setActiveTab('wakil_2')}
          className={`py-3 px-4 rounded-xl transition-all ${
            activeTab === 'wakil_2' ? 'bg-white text-brand-navy-700 shadow-sm' : 'hover:text-slate-600'
          }`}
        >
          Wakil 2 ({candidates.filter(c => c.category === 'wakil_2').length})
        </button>
      </div>

      {/* Action Header bar */}
      <div className="flex justify-between items-center bg-white/40 border border-slate-200/30 rounded-3xl p-5 shadow-glass-sm">
        <div>
          <h3 className="font-heading font-extrabold text-sm text-brand-navy-900 leading-none">
            Menampilkan {filteredCandidates.length} Kandidat
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">
            Data kandidat yang didelegasikan untuk e-voting.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-3 px-4 rounded-2xl bg-brand-navy-700 hover:bg-brand-navy-800 text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-brand hover:shadow-lg"
        >
          <Plus className="w-4.5 h-4.5" /> Tambah Kandidat
        </button>
      </div>

      {/* Grid List representation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((c) => (
          <div
            key={c.id}
            className="glass-card rounded-[2rem] border border-white/50 overflow-hidden shadow-glass flex flex-col justify-between"
          >
            {/* Candidate Header */}
            <div>
              <div className="relative aspect-[16/10] w-full bg-slate-900 flex items-center justify-center text-white/20">
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="object-cover w-full h-full object-top"
                  />
                ) : (
                  <Sparkles className="w-10 h-10 animate-pulse" />
                )}
                
                {/* Glowing Ordinal Number Badge */}
                <div className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-navy-700 text-white font-heading font-extrabold text-sm shadow-brand border border-white/20">
                  {String(c.ordinal_number).padStart(2, '0')}
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 right-4 bg-brand-amber-500 text-white py-1 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-sm border border-brand-amber-400">
                  {c.category === 'ketua' ? 'Ketua' : c.category === 'wakil_1' ? 'Wakil 1' : 'Wakil 2'}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h4 className="font-heading font-bold text-sm leading-tight line-clamp-1">
                    {c.name}
                  </h4>
                </div>
              </div>

              {/* Details box */}
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Kategori Pemilihan</span>
                  <span className="font-semibold text-brand-navy-800 line-clamp-1">{categoryLabels[c.category]}</span>
                </div>

                {/* Visi */}
                {c.vision && (
                  <div className="text-xs">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-brand-navy-500 block mb-1">VISI</span>
                    <p className="text-slate-500 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/40 line-clamp-2">
                      &ldquo;{c.vision}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => openEditModal(c)}
                className="flex-1 py-3 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              
              <button
                onClick={() => setDeletingId(c.id)}
                className="flex-1 py-3 px-3 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CRUD Edit/Add Form Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={isLoading ? undefined : () => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Body card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-2xl z-10 flex flex-col"
            >
              {!isLoading && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <h3 className="font-heading font-black text-xl text-brand-navy-900 flex items-center gap-2 mb-6">
                <UserPlus className="w-6 h-6 text-brand-navy-700" />
                {editingCandidate ? 'Edit Kandidat' : 'Kandidat Baru'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                
                {/* Category Selection Select */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1 ml-1">
                    Kategori Jabatan OSIS
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-navy-500 font-extrabold bg-white text-brand-navy-900"
                  >
                    <option value="ketua">Ketua OSIS</option>
                    <option value="wakil_1">Wakil Ketua OSIS 1</option>
                    <option value="wakil_2">Wakil Ketua OSIS 2</option>
                  </select>
                </div>

                {/* Ordinal Number */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1 ml-1">
                    Nomor Urut Calon
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={ordinalNo}
                    onChange={(e) => setOrdinalNo(Number(e.target.value))}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy-500 font-semibold"
                  />
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1 ml-1">
                    Nama Lengkap Calon
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap kandidat"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy-500 font-semibold"
                  />
                </div>

                {/* Photo URL */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1 ml-1">
                    URL Foto Calon (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://domain.com/photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy-500"
                  />
                </div>

                {/* Visi */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1 ml-1">
                    Pernyataan Visi Calon
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Visi utama..."
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy-500 font-medium"
                  />
                </div>

                {/* Mission checklist */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 ml-1">
                      Misi Calon (Daftar Poin)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMissionField}
                      disabled={isLoading}
                      className="text-xs font-bold text-brand-navy-600 hover:text-brand-navy-800 flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" /> Tambah Poin
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {missions.map((mission, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder={`Misi poin ke-${index + 1}...`}
                          value={mission}
                          onChange={(e) => handleMissionChange(index, e.target.value)}
                          disabled={isLoading}
                          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-navy-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMissionField(index)}
                          disabled={isLoading || missions.length === 1}
                          className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submissions buttons */}
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                    className="flex-grow py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-grow py-3 px-4 rounded-xl bg-brand-navy-700 hover:bg-brand-navy-800 text-white font-bold uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-brand"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      'Simpan Kandidat'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Safeguard Warning Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-7 max-w-sm w-full border border-slate-200 shadow-2xl z-10 text-center flex flex-col"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 text-red-600 mb-4 self-center animate-bounce">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-black text-lg text-brand-navy-900 leading-tight">
                Hapus Kandidat?
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed px-1">
                Apakah Anda yakin ingin menghapus kandidat ini secara permanen dari sistem? Pilihan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingId)}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
