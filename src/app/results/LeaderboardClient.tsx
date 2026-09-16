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
    <div className="min-h-screen bg-brand-navy-50 font-body selection:bg-brand-amber-200">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Header */}
        <header className="mb-16 space-y-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-glass-sm border border-brand-navy-100 text-brand-navy-700 text-sm font-bold mb-4 tracking-wide"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-amber-500"></span>
            </span>
            LIVE RESULTS
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-brand-navy-900 font-heading"
          >
            Election Leaderboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-brand-navy-500 max-w-xl mx-auto text-lg md:text-xl"
          >
            Real-time voting results for all categories.
          </motion.p>
        </header>

        {/* Categories */}
        <div className="space-y-16">
          {Object.entries(groupedCandidates.groups).map(([category, cats], idx) => {
            const totalVotesCategory = cats.reduce((sum, c) => sum + c.vote_count, 0);

            return (
              <section key={category} className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-brand-navy-200 pb-4 gap-2"
                >
                  <h2 className="text-3xl font-black uppercase tracking-tight text-brand-navy-800 font-heading">
                    {category}
                  </h2>
                  <div className="flex items-center gap-2 text-brand-navy-600 text-sm font-bold bg-brand-navy-100 px-3 py-1 rounded-lg">
                    <Users className="w-4 h-4" />
                    <span>{totalVotesCategory.toLocaleString()} Total Votes</span>
                  </div>
                </motion.div>

                <div className="grid gap-5">
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
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 + idx * 0.2 + 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className={`relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-6 rounded-2xl bg-white shadow-glass transition-all hover:shadow-brand group ${
                            isWinner ? "border-2 border-brand-amber-400 ring-4 ring-brand-amber-50" : "border border-white hover:border-brand-navy-200"
                          }`}
                        >
                          {/* Rank & Info */}
                          <div className="flex items-center gap-5 z-10 w-full sm:w-auto">
                            <div className={`flex items-center justify-center w-14 h-14 rounded-full font-black text-xl shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                              isWinner ? "bg-gradient-to-br from-brand-amber-300 to-brand-amber-500 text-white shadow-brand-gold" : 
                              isRunnerUp ? "bg-gradient-to-br from-slate-200 to-slate-400 text-white" : 
                              isThird ? "bg-gradient-to-br from-orange-200 to-orange-400 text-white" : 
                              "bg-brand-navy-50 text-brand-navy-400"
                            }`}>
                              {isWinner ? <Crown className="w-7 h-7" /> : 
                               isRunnerUp ? <Medal className="w-7 h-7" /> : 
                               isThird ? <Medal className="w-7 h-7" /> : 
                               `#${i + 1}`}
                            </div>
                            
                            <div>
                              <h3 className={`text-2xl font-bold font-heading ${isWinner ? 'text-brand-navy-900' : 'text-brand-navy-800'}`}>
                                {c.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-brand-navy-500 font-medium bg-brand-navy-50 px-2 py-0.5 rounded-md">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Vote Count & Bar */}
                          <div className="mt-5 sm:mt-0 flex flex-col sm:items-end w-full sm:w-auto z-10">
                            <div className={`text-4xl font-black tracking-tighter font-heading ${isWinner ? 'text-brand-amber-600' : 'text-brand-navy-700'}`}>
                              {c.vote_count.toLocaleString()}
                            </div>
                            <div className="text-xs font-bold text-brand-navy-400 uppercase tracking-widest mt-1">
                              Votes
                            </div>
                          </div>

                          {/* Background Progress Bar */}
                          <div 
                            className={`absolute left-0 top-0 bottom-0 z-0 transition-all duration-1000 ease-out opacity-20 ${
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
