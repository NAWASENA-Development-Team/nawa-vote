'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export interface DashboardCandidate {
  id: string;
  ordinal_number: number;
  name: string;
  vote_count: number;
  category: 'ketua' | 'wakil_1' | 'wakil_2';
}

interface AnalyticsDashboardProps {
  candidates: DashboardCandidate[];
  totalVoters: number;
  totalVotesCast: number;
}

export default function AnalyticsDashboard({ candidates, totalVoters, totalVotesCast }: AnalyticsDashboardProps) {
  // Data for Bar Chart
  const ketuaData = candidates.filter(c => c.category === 'ketua').sort((a,b) => a.ordinal_number - b.ordinal_number).map(c => ({ name: c.name, suara: c.vote_count }));
  const wakil1Data = candidates.filter(c => c.category === 'wakil_1').sort((a,b) => a.ordinal_number - b.ordinal_number).map(c => ({ name: c.name, suara: c.vote_count }));
  const wakil2Data = candidates.filter(c => c.category === 'wakil_2').sort((a,b) => a.ordinal_number - b.ordinal_number).map(c => ({ name: c.name, suara: c.vote_count }));

  // Data for Pie Chart (Turnout)
  const golput = totalVoters - totalVotesCast;
  const pieData = [
    { name: 'Sudah Memilih', value: totalVotesCast },
    { name: 'Belum Memilih', value: golput > 0 ? golput : 0 }
  ];
  const PIE_COLORS = ['#d97706', '#94a3b8']; // brand amber-600, slate-400

  return (
    <div className="space-y-8">
      
      {/* Turnout Pie Chart */}
      <div className="app-card p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-brand-navy-900 mb-2 font-heading">Berapa Tingkat Partisipasi Pemilih?</h2>
          <p className="text-sm text-brand-navy-500 mb-6 font-medium">Persentase pemilih yang sudah menggunakan hak suaranya dari total DPT.</p>
          <div className="flex gap-4">
            <div className="bg-amber-50 text-amber-800 px-4 py-2 border border-amber-200/80 rounded-xl font-semibold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 block"></span>
              Sudah: {totalVotesCast}
            </div>
            <div className="bg-slate-100 text-slate-700 px-4 py-2 border border-slate-200 rounded-xl font-semibold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 block"></span>
              Belum: {golput}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: '600', color: '#0f172a' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ketua Chart */}
      <div className="app-card p-8">
        <h2 className="text-lg font-bold text-brand-navy-900 mb-6 font-heading">Bagaimana Perolehan Suara Calon Ketua OSIS?</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ketuaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: '600', color: '#0f172a' }}
              />
              <Bar dataKey="suara" fill="#1e3a5f" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wakil 1 Chart */}
      <div className="app-card p-8">
        <h2 className="text-lg font-bold text-brand-navy-900 mb-6 font-heading">Bagaimana Perolehan Suara Calon Wakil Ketua 1?</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wakil1Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: '600', color: '#0f172a' }}
              />
              <Bar dataKey="suara" fill="#1e3a5f" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wakil 2 Chart */}
      <div className="app-card p-8">
        <h2 className="text-lg font-bold text-brand-navy-900 mb-6 font-heading">Bagaimana Perolehan Suara Calon Wakil Ketua 2?</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wakil2Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: '600', color: '#0f172a' }}
              />
              <Bar dataKey="suara" fill="#1e3a5f" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
