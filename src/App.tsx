import React from 'react';
import { AppProvider } from './context/AppProvider';
import { useAppState } from './context/Context';
import { UserMobileView } from './components/UserMobileView';
import { GuardianMeshHub } from './components/GuardianMeshHub';
import { PoliceVaultDashboard } from './components/PoliceVaultDashboard';
import { LoginView } from './components/LoginView';
import { SOSOverlay } from './components/SOSOverlay';
import { Shield, LogOut } from 'lucide-react';

function AppContent() {
  const { state, logout } = useAppState();

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500/20">
        <LoginView />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between antialiased selection:bg-cyan-500/20">
      {/* Dynamic Session Connected Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Shield className="h-4 w-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-slate-200">
              TravelSafe™ Node — <span className="text-[10px] text-slate-500 capitalize">{state.currentUser?.role} Mode</span>
            </span>
            <p className="text-[10px] text-slate-500 font-mono">ID: {state.currentUser?.uid}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono hidden sm:inline text-slate-400">
            Secure Node: <span className="text-slate-200 font-bold">{state.currentUser?.userName}</span>
          </span>
          <button 
            onClick={logout}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Terminate Session Node"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Role-Restricted Viewport Mapping Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full">
          {state.currentUser?.role === 'user' && <UserMobileView />}
          {state.currentUser?.role === 'guardian' && <GuardianMeshHub />}
          {state.currentUser?.role === 'police' && <PoliceVaultDashboard />}
        </div>
      </main>

      <SOSOverlay />

      <footer className="border-t border-slate-900 py-3 text-center text-[10px] text-slate-600 font-mono tracking-wider">
        DEVELOPED BY TEAM ACECODERS • MULTI-SESSION DAEMON ROUTER RUNNING
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