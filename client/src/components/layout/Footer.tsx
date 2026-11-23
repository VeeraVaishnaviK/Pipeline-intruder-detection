import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          Implementation of an Intruder Detection Framework Based on Pipelined Data Path Design
        </p>
        <p className="font-semibold text-cyan-600 dark:text-cyan-400">
          Security Operations & Datapath Console
        </p>
      </div>
    </footer>
  );
};
