'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import { LayoutDashboard, Users, Users2, LogOut, Menu, X, ArrowUpRight, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    {
      name: 'Overview',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Kandidat Paslon',
      path: '/admin/candidates',
      icon: Users2,
    },
    {
      name: 'Daftar Pemilih',
      path: '/admin/voters',
      icon: Users,
    },
    {
      name: 'Statistik & Analitik',
      path: '/admin/analytics',
      icon: Activity,
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 relative">

      {/* Top Navbar for Mobile viewports */}
      <header
        className="lg:hidden border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-30 bg-white"
      >
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-white bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-md rounded-lg p-2 shadow-sm shadow-blue-500/20 border border-white/20">
            <div className="w-full h-full drop-shadow-sm"><NawaLogo /></div>
          </div>
          <span className="font-heading font-semibold text-lg text-slate-900 tracking-tight flex items-center gap-2">
            Nawa Vote <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Admin</span>
          </span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* SIDEBAR NAVIGATION (Desktop View) */}
        <aside
          className="hidden lg:flex flex-col w-64 sticky top-0 h-screen z-20 p-5 bg-white border-r border-slate-200"
        >
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-center w-14 h-14 text-white bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-md rounded-xl p-3 shadow-md shadow-blue-500/20 border border-white/20">
              <div className="w-full h-full drop-shadow-md"><NawaLogo /></div>
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-slate-900 tracking-tight leading-none">
                Nawa Vote
              </h2>
              <span className="text-[10px] font-medium text-slate-500 mt-1 block">
                Admin Console
              </span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="space-y-1.5 flex-grow">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Quick Public Results Link */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                href="/results"
                target="_blank"
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  <span>Hasil Publik</span>
                </div>
              </Link>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-slate-100 mt-6">
            {/* Version badge */}
            <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-slate-50 rounded-lg w-full">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">v2.0.0 — Secure</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER NAVIGATION */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Drawer Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              />

              {/* Drawer Content */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-72 p-5 z-50 flex flex-col bg-white border-r border-slate-200 shadow-2xl"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 text-white bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-md rounded-lg p-2 shadow-sm shadow-blue-500/20 border border-white/20">
                      <div className="w-full h-full drop-shadow-sm"><NawaLogo /></div>
                    </div>
                    <div>
                      <span className="font-heading font-semibold text-base text-slate-900 tracking-tight">
                        Nawa Vote
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 block">
                        Admin Console
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Menu links */}
                <nav className="space-y-1.5 flex-grow">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <Link
                      href="/results"
                      target="_blank"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      <span>Hasil Publik</span>
                    </Link>
                  </div>
                </nav>

                {/* Drawer Logout */}
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Sesi</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN BODY CHILDREN SCROLL */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-8 md:px-8 max-w-7xl mx-auto w-full relative z-10 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
