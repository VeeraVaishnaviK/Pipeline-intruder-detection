import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Layers, 
  BarChart3, 
  FileText, 
  Sliders, 
  Sun, 
  Moon, 
  LogOut, 
  Play, 
  Pause, 
  RotateCcw,
  Zap,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePipeline } from '../../context/PipelineContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { 
    isPipelineRunning, 
    stageDelayMs, 
    setStageDelayMs, 
    mode, 
    setMode, 
    resetAll 
  } = usePipeline();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'batch', label: 'Batch / Stream', icon: Zap },
    { id: 'hitmiss', label: 'Hit-Miss Analysis', icon: BarChart3 },
    { id: 'comparison', label: 'Performance & Gantt', icon: TrendingUp },
    { id: 'logs', label: 'Logs & Alerts', icon: FileText },
    { id: 'rules', label: 'Rules Engine', icon: Sliders, adminOnly: true },
    { id: 'architecture', label: 'Architecture', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-tech text-lg sm:text-xl font-bold tracking-wider text-slate-900 dark:text-cyan-400 flex items-center gap-1.5">
                PIPELINED IDS
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                Pipelined Data Path Architecture
              </p>
            </div>
          </div>

          {/* Center Pipeline Controls */}
          <div className="hidden lg:flex items-center space-x-4 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/50">
            {/* Status Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border"
                 style={{
                   backgroundColor: isPipelineRunning ? 'rgba(34, 211, 238, 0.15)' : 'rgba(100, 116, 139, 0.1)',
                   borderColor: isPipelineRunning ? 'rgba(34, 211, 238, 0.4)' : 'rgba(148, 163, 184, 0.3)',
                   color: isPipelineRunning ? '#06b6d4' : '#64748b'
                 }}>
              <span className={`w-2 h-2 rounded-full ${isPipelineRunning ? 'bg-cyan-500 animate-ping' : 'bg-slate-400'}`}></span>
              <span>{isPipelineRunning ? 'PIPELINE ACTIVE' : 'PIPELINE IDLE'}</span>
            </div>

            {/* Mode Switch */}
            <div className="flex items-center text-xs font-mono bg-white dark:bg-slate-900 rounded-full p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('pipelined')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  mode === 'pipelined'
                    ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-cyan-500'
                }`}
              >
                Pipelined
              </button>
              <button
                onClick={() => setMode('sequential')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  mode === 'sequential'
                    ? 'bg-amber-500 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                }`}
              >
                Sequential
              </button>
            </div>

            {/* Stage Delay Slider */}
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span>Clock Delay:</span>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={stageDelayMs}
                onChange={(e) => setStageDelayMs(Number(e.target.value))}
                className="w-20 accent-cyan-500 cursor-pointer"
              />
              <span className="w-12 text-right text-cyan-600 dark:text-cyan-400 font-bold">{stageDelayMs}ms</span>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetAll}
              title="Reset pipeline & clear database"
              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Action Icons & User */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User badge */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">{user.username}</div>
                  <div className="text-[10px] uppercase font-mono text-cyan-600 dark:text-cyan-400 font-bold">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 dark:border-slate-800/80">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
