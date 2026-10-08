'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import { LayoutDashboard, Users, Users2, LogOut, Menu, X, ArrowUpRight, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NawaLogo from '@/components/NawaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
    <div className="flex flex-col min-h-screen bg-brand-navy-50 dark:bg-slate-950 text-brand-navy-900 dark:text-slate-100 relative transition-colors duration-200">

      {/* Top Navbar for Mobile viewports */}
      <header
        className="lg:hidden border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between sticky top-0 z-30 bg-brand-navy-900 text-white"
      >
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 text-white bg-brand-navy-800 rounded-lg p-2 border border-brand-navy-700">
            <div className="w-full h-full"><NawaLogo /></div>
          </div>
          <span className="font-heading font-bold text-lg text-white tracking-tight flex items-center gap-2">
            Nawa Vote <span className="bg-brand-amber-500 text-brand-navy-950 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg border border-brand-navy-700 bg-brand-navy-800 hover:bg-brand-navy-700 transition-colors text-slate-200"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* SIDEBAR NAVIGATION (Desktop View) */}
        <aside
          className="hidden lg:flex flex-col w-64 sticky top-0 h-screen z-20 p-5 bg-brand-navy-900 dark:bg-slate-900 text-white border-r border-brand-navy-800 dark:border-slate-800 shadow-xl"
        >
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-brand-navy-800 dark:border-slate-800">
            <div className="flex items-center justify-center w-12 h-12 text-white bg-brand-navy-800 dark:bg-slate-800 rounded-xl p-2.5 border border-brand-navy-700 dark:border-slate-700 shadow-sm">
              <div className="w-full h-full"><NawaLogo /></div>
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg text-white tracking-tight leading-none">
                Nawa Vote
              </h2>
              <span className="text-[11px] font-medium text-brand-navy-300 dark:text-slate-400 mt-1 block">
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
                  className={`flex items-center gap-3 py-3 px-3.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-amber-500 text-brand-navy-950 shadow-md font-bold'
                      : 'text-brand-navy-200 dark:text-slate-300 hover:bg-brand-navy-800 dark:hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Quick Public Results Link */}
            <div className="pt-4 mt-4 border-t border-brand-navy-800 dark:border-slate-800">
              <Link
                href="/results"
                target="_blank"
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium text-brand-navy-300 dark:text-slate-400 hover:bg-brand-navy-800 dark:hover:bg-slate-800 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-4 h-4 text-brand-navy-400 dark:text-slate-400" />
                  <span>Hasil Publik</span>
                </div>
              </Link>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-brand-navy-800 dark:border-slate-800 mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-navy-800 dark:bg-slate-800/80 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-brand-amber-400" />
                <span className="text-[11px] text-brand-navy-200 dark:text-slate-300 font-medium">v2.0.0</span>
              </div>
              <ThemeToggle />
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
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
                className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
              />

              {/* Drawer Content */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-72 p-5 z-50 flex flex-col bg-brand-navy-900 text-white border-r border-brand-navy-800 shadow-2xl"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between mb-8 pb-5 border-b border-brand-navy-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 text-white bg-brand-navy-800 rounded-lg p-2 border border-brand-navy-700">
                      <div className="w-full h-full"><NawaLogo /></div>
                    </div>
                    <div>
                      <span className="font-heading font-bold text-base text-white tracking-tight">
                        Nawa Vote
                      </span>
                      <span className="text-[10px] font-medium text-brand-navy-300 block">
                        Admin Console
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-brand-navy-800 text-brand-navy-300 transition-colors"
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
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-brand-amber-500 text-brand-navy-950 font-bold'
                            : 'text-brand-navy-200 hover:bg-brand-navy-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                  <div className="pt-4 mt-4 border-t border-brand-navy-800">
                    <Link
                      href="/results"
                      target="_blank"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium text-brand-navy-300 hover:bg-brand-navy-800 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4 text-brand-navy-400" />
                      <span>Hasil Publik</span>
                    </Link>
                  </div>
                </nav>

                {/* Drawer Logout */}
                <div className="pt-4 mt-4 border-t border-brand-navy-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/40 transition-colors"
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
        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-8 md:px-8 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
