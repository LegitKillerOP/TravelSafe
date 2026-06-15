import React, { useState } from 'react';
import { AppProvider } from './context/Context';
import { UserMobileView } from './components/UserMobileView';
import { GuardianMeshHub } from './components/GuardianMeshHub';
import { PoliceVaultDashboard } from './components/PoliceVaultDashboard';
import { SOSOverlay } from './components/SOSOverlay';
import { Shield, Radio, Server } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'user' | 'guardian' | 'police'>('user');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between antialiased selection:bg-cyan-500/20">
      {/* Clean Global Interface Header Menu Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/10">
            <Shield className="h-4 w-4 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-200">TravelSafe™ <span className="text-xs font-mono font-normal text-slate-600 px-1 border border-slate-800 rounded ml-1">OS v1.0</span></span>
        </div>

        <nav className="flex items-center bg-slate-900/60 p-1 border border-slate-800/80 rounded-xl max-w-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'user' ? 'bg-slate-800 text-emerald-400 border border-slate-700/50 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Shield className="h-3.5 w-3.5" /> User View
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'guardian' ? 'bg-slate-800 text-indigo-400 border border-slate-700/50 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Radio className="h-3.5 w-3.5" /> Guardian Mesh
          </button>
          <button
            onClick={() => setActiveTab('police')}
            className={`flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'police' ? 'bg-slate-800 text-cyan-400 border border-slate-700/50 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Server className="h-3.5 w-3.5" /> Forensic Vault
          </button>
        </nav>
      </header>

      {/* Primary Dynamic Structural Grid Core Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full transition-all duration-300">
          {activeTab === 'user' && <UserMobileView />}
          {activeTab === 'guardian' && <GuardianMeshHub />}
          {activeTab === 'police' && <PoliceVaultDashboard />}
        </div>
      </main>

      {/* Global Toast Monitor Core Hook Placement */}
      <SOSOverlay />

      {/* Footer Meta Credits Status Info */}
      <footer className="border-t border-slate-900 py-3 text-center text-[10px] text-slate-600 font-mono tracking-wider">
        DEVELOPED BY TEAM ACECODERS • DEMO SANDBOX DISPATCH ACTIVE
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}