import React from 'react';
import { 
  Activity, 
  Upload, 
  Layers, 
  FileText, 
  Settings, 
  ShieldCheck, 
  Database, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

import { AuthUser } from '../types';

interface NavbarProps {
  currentTab: 'landing' | 'upload' | 'analysis' | 'dashboard' | 'settings';
  setCurrentTab: (tab: 'landing' | 'upload' | 'analysis' | 'dashboard' | 'settings') => void;
  onOpenQuickDemo: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: (action?: 'upload' | 'demo' | 'workstation') => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  onOpenQuickDemo,
  currentUser,
  onOpenAuth,
  onSignOut
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => setCurrentTab('landing')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medical-600 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-medical-500/20 group-hover:shadow-medical-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  MRI-Rad<span className="text-sky-400">AI</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-medical-500/10 text-medical-400 border border-medical-500/30">
                  3D VLM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Prostate Lesion Decision Support</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'landing'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setCurrentTab('landing');
                setTimeout(() => {
                  const el = document.getElementById('how-it-works');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                setCurrentTab('landing');
                setTimeout(() => {
                  const el = document.getElementById('features');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              Features
            </button>
            <button
              onClick={() => {
                setCurrentTab('landing');
                setTimeout(() => {
                  const el = document.getElementById('faq');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              FAQ
            </button>
            <button
              onClick={() => setCurrentTab('upload')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'upload'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload MRI</span>
            </button>
            <button
              onClick={() => setCurrentTab('analysis')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'analysis'
                  ? 'bg-medical-500/20 text-sky-300 border border-medical-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-medical-400" />
              <span>3D Workstation</span>
            </button>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PACS Worklist</span>
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'settings'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Status & Quick Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* PACS Indicator */}
            <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-3 h-3 text-slate-400" />
              <span>PACS 3.0T</span>
            </div>

            {/* Quick Demo CTA */}
            <button
              onClick={onOpenQuickDemo}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-medical-600 to-sky-500 hover:from-medical-500 hover:to-sky-400 text-white shadow-md shadow-medical-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Try Demo Case</span>
            </button>

            {/* User Profile or Sign-in */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-800">
                <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {currentUser.name.charAt(3) || 'Dr'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-[11px] font-bold text-white leading-tight truncate max-w-[110px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] text-sky-400 font-mono leading-tight">
                      {currentUser.role.split(' ')[0]}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out of clinical session"
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth()}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
