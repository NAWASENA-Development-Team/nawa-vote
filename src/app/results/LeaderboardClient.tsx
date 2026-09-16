"use client";

import { motion } from "framer-motion";
import { Users, Crown, Medal } from "lucide-react";
import { useMemo } from "react";

type Candidate = {
  id: string;
  name: string;
  category: string;
  vote_count: number;
};

export default function LeaderboardClient({ candidates }: { candidates: Candidate[] }) {
  const groupedCandidates = useMemo(() => {
    const groups: Record<string, Candidate[]> = {};
    let totalVotesOverall = 0;

    candidates.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
      totalVotesOverall += c.vote_count;
    });

    return { groups, totalVotesOverall };
  }, [candidates]);

  return (
    <div className="min-h-screen bg-brand-navy-50 font-body selection:bg-brand-amber-200 flex flex-col justify-center">
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 md:py-8 h-screen max-h-screen flex flex-col">
        {/* Compact Header */}
        <header className="mb-6 flex flex-col md:flex-row items-center justify-between shrink-0">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-glass-sm border border-brand-navy-100 text-brand-navy-700 text-xs font-bold mb-2 tracking-wide"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-amber-500"></span>
              </span>
              LIVE RESULTS
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-black tracking-tight text-brand-navy-900 font-heading"
            >
              Election Leaderboard
            </motion.h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-brand-navy-500 text-sm md:text-base font-medium mt-2 md:mt-0 max-w-sm md:text-right"
          >
            Real-time voting results across all categories. <br className="hidden md:block" /> Auto-updates every 20 minutes.
          </motion.p>
        </header>

        {/* 3-Column Grid Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden flex-1">
          {Object.entries(groupedCandidates.groups).map(([category, cats], idx) => {
            const totalVotesCategory = cats.reduce((sum, c) => sum + c.vote_count, 0);

            return (
              <section key={category} className="flex flex-col h-full bg-white/50 rounded-3xl p-4 shadow-glass-sm border border-white">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-end justify-between border-b-2 border-brand-navy-200 pb-3 mb-4 shrink-0"
                >
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-brand-navy-800 font-heading line-clamp-1">
                    {category.replace('_', ' ')}
                  </h2>
                  <div className="flex items-center gap-1.5 text-brand-navy-600 text-xs font-bold bg-brand-navy-100/80 px-2 py-1 rounded-md shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    <span>{totalVotesCategory.toLocaleString()}</span>
                  </div>
                </motion.div>

                <div className="flex flex-col gap-3 flex-1 justify-start">
                  {cats
                    .sort((a, b) => b.vote_count - a.vote_count)
                    .map((c, i) => {
                      const percentage = totalVotesCategory > 0 
                        ? ((c.vote_count / totalVotesCategory) * 100).toFixed(1) 
                        : "0.0";
                      
                      const isWinner = i === 0 && c.vote_count > 0;
                      const isRunnerUp = i === 1 && c.vote_count > 0;
                      const isThird = i === 2 && c.vote_count > 0;

                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 + idx * 0.2 + 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className={`relative overflow-hidden flex items-center justify-between p-3 md:p-4 rounded-2xl bg-white shadow-sm transition-all hover:shadow-md group ${
                            isWinner ? "border-2 border-brand-amber-400 ring-2 ring-brand-amber-50" : "border border-brand-navy-100 hover:border-brand-navy-300"
                          }`}
                        >
                          {/* Rank & Info */}
                          <div className="flex items-center gap-3 md:gap-4 z-10 min-w-0">
                            <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full font-black text-sm md:text-base shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                              isWinner ? "bg-gradient-to-br from-brand-amber-300 to-brand-amber-500 text-white shadow-brand-gold" : 
                              isRunnerUp ? "bg-gradient-to-br from-slate-200 to-slate-400 text-white" : 
                              isThird ? "bg-gradient-to-br from-orange-200 to-orange-400 text-white" : 
                              "bg-brand-navy-50 text-brand-navy-400"
                            }`}>
                              {isWinner ? <Crown className="w-5 h-5 md:w-6 md:h-6" /> : 
                               isRunnerUp ? <Medal className="w-5 h-5 md:w-6 md:h-6" /> : 
                               isThird ? <Medal className="w-5 h-5 md:w-6 md:h-6" /> : 
                               `#${i + 1}`}
                            </div>
                            
                            <div className="min-w-0 pr-2">
                              <h3 className={`text-base md:text-lg font-bold font-heading truncate ${isWinner ? 'text-brand-navy-900' : 'text-brand-navy-800'}`} title={c.name}>
                                {c.name}
                              </h3>
                              <div className="flex items-center mt-0.5">
                                <span className="text-xs text-brand-navy-500 font-semibold bg-brand-navy-50 px-1.5 py-0.5 rounded-md">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Vote Count & Bar */}
                          <div className="flex flex-col items-end shrink-0 z-10 pl-2">
                            <div className={`text-2xl md:text-3xl font-black tracking-tighter font-heading ${isWinner ? 'text-brand-amber-600' : 'text-brand-navy-700'}`}>
                              {c.vote_count.toLocaleString()}
                            </div>
                            <div className="text-[9px] md:text-[10px] font-bold text-brand-navy-400 uppercase tracking-widest mt-0.5">
                              Votes
                            </div>
                          </div>

                          {/* Background Progress Bar */}
                          <div 
                            className={`absolute left-0 top-0 bottom-0 z-0 transition-all duration-1000 ease-out opacity-[0.15] ${
                              isWinner ? "bg-brand-amber-400" : "bg-brand-navy-200"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </motion.div>
                      );
                    })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
