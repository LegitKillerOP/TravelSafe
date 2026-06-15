import { useState, useEffect } from 'react';
import { useAppState } from '../context/Context';
import { ShieldAlert, Radio, ShieldX, MapPin, Eye, CheckCircle2 } from 'lucide-react';

export const SOSOverlay = () => {
  const { state, localMutedIncident, resetSOS, interceptSOS, clearSOSIncident } = useAppState();
  const [isIntercepted, setIsIntercepted] = useState(false);

  // Sync internal UI tracking state with incoming state mutations
  useEffect(() => {
    if (state.safetyTimer === null) {
      setIsIntercepted(false);
    }
  }, [state.safetyTimer]);

  // Guard Clauses: Terminate rendering if safetyTimer is inactive OR if this local supervisor console muted it
  if (state.safetyTimer === null || localMutedIncident === true) {
    return null;
  }

  const currentRole = state.currentUser?.role || 'user';
  const distressedName = state.currentUser?.userName || 'Unknown Civilian';
  const currentCoords = state.userLocation 
    ? `${state.userLocation.lat.toFixed(4)}°N, ${state.userLocation.lng.toFixed(4)}°E`
    : 'Awaiting Hardware Sync';

  const handleIntercept = () => {
    setIsIntercepted(true);
    if (interceptSOS) interceptSOS(state.currentUser?.uid);
  };

  return (
    <>
      {/* RENDER PATHWAY A: CIVILIAN RECENT CENTERED RADAR HUD ALERT */}
      {currentRole === 'user' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-2rem)] max-w-md transform-gpu animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-950/95 border border-rose-500/60 shadow-2xl shadow-rose-950/50 rounded-2xl p-3 backdrop-blur-xl flex items-center justify-between gap-3 overflow-hidden relative">
            <div className="absolute inset-0 bg-rose-600/10 animate-pulse pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Radio className="h-4 w-4 animate-pulse text-rose-500" />
              </div>
              <div className="font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-black uppercase tracking-widest text-rose-400">SOS Live Stream</span>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Elapsed Time: <span className="text-slate-100 font-bold">{state.safetyDuration}</span>
                </p>
              </div>
            </div>
            <button
              onClick={resetSOS}
              className="relative z-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all active:scale-[0.97] shadow-md cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* RENDER PATHWAY B: POLICE / GUARDIAN COMPONENT INTEGRATION FLOATING WIDGET */}
      {currentRole !== 'user' && (
        /* Changed location from bottom-6 to top-24 to separate it from view contents */
        <div className="fixed top-24 right-6 z-[10000] w-full max-w-sm transform-gpu animate-in fade-in slide-in-from-right-5 duration-300">
          <div className={`bg-slate-950/95 border shadow-2xl rounded-2xl p-4 backdrop-blur-xl text-slate-100 font-sans overflow-hidden transition-all duration-300 ${
            isIntercepted ? 'border-emerald-500/50 shadow-emerald-950/30' : 'border-red-500/50 shadow-red-950/40'
          }`}>
            <div className={`h-0.5 w-full absolute top-0 left-0 animate-pulse ${
              isIntercepted ? 'bg-emerald-500' : 'bg-red-500'
            }`} />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg border backdrop-blur-sm ${
                  isIntercepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-mono font-black tracking-wider uppercase ${isIntercepted ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isIntercepted ? 'Response Dispatched' : 'Incident Intercept Detected'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Active Mesh Distress Broadcast</p>
                </div>
              </div>
              <div className={`border px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                isIntercepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {state.safetyDuration}
              </div>
            </div>

            <div className="mt-3 space-y-2 bg-slate-900/40 border border-slate-900 p-2.5 rounded-xl text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                <span className="text-[9px] text-slate-500 uppercase">Target Node</span>
                <span className="font-bold text-slate-200 font-sans text-[13px]">{distressedName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-500 uppercase">Telemetry</span>
                <div className="flex items-center gap-0.5 text-slate-300 text-[11px]">
                  <MapPin className="h-3 w-3 text-red-400" />
                  <span>{currentCoords}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button 
                disabled={isIntercepted}
                onClick={handleIntercept}
                className={`flex items-center justify-center gap-1 border text-[11px] font-bold py-2 rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
                  isIntercepted 
                    ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                {isIntercepted ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Track Locked</>
                ) : (
                  <><Eye className="h-3.5 w-3.5 text-cyan-400" /> Intercept</>
                )}
              </button>
              <button 
                onClick={() => clearSOSIncident(state.currentUser?.uid)}
                className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-2 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                <ShieldX className="h-3.5 w-3.5" /> Force Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};