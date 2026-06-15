import { useEffect, useState, useRef } from 'react';
import { useAppState } from '../context/Context';
import { AlertOctagon, ShieldX, MapPin } from 'lucide-react';

export const GuardianMeshHub = () => {
  const { state, localMutedIncident, clearSOSIncident } = useAppState();
  const [radarAngle, setRadarAngle] = useState(0);
  const audioTriggered = useRef(false);

  useEffect(() => {
    const frame = setInterval(() => setRadarAngle(p => (p + 2.5) % 360), 30);
    return () => clearInterval(frame);
  }, []);

  // Structural Check: Only show critical intercept screen if SOS is active globally AND not muted locally
  const dangerMode = state.safetyTimer !== null && !localMutedIncident;

  useEffect(() => {
    if (dangerMode && !audioTriggered.current) {
      audioTriggered.current = true;
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => console.warn('Audio playback deferred pending active focus'));
    }
    if (!dangerMode) audioTriggered.current = false;
  }, [dangerMode]);

  const openRoute = () => {
    if (state.userLocation) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${state.userLocation.lat},${state.userLocation.lng}`, '_blank');
    }
  };

  return (
    <div className="mx-auto max-w-md min-h-[80vh] bg-slate-950 border border-slate-900 rounded-3xl p-5 text-slate-100 flex flex-col justify-between relative shadow-2xl overflow-hidden">
      
      {/* 1. CRITICAL INTERCEPT COMPONENT BANNER */}
      {dangerMode && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between rounded-3xl border border-red-500/40 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-4 text-center mt-4">
            <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-lg animate-pulse">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider text-red-400 uppercase font-mono">AURA Intercept Core</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">High-priority peer telemetry dispatched via encrypted mesh ping</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3 text-left text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-slate-500 uppercase text-[10px]">Target Distress</span> 
                <span className="text-slate-200 font-bold font-sans text-sm">{state.currentUser?.userName || 'Anonymous Node'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-slate-500 uppercase text-[10px]">Vector Position</span> 
                <div className="flex items-center gap-1 text-red-400 font-bold">
                  <MapPin className="h-3 w-3" />
                  <span>{state.userLocation?.lat.toFixed(4)}, {state.userLocation?.lng.toFixed(4)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase text-[10px]">Live Stream Clock</span> 
                <span className="text-slate-100 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{state.safetyDuration}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-auto">
            <button
              onClick={openRoute}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-red-950/40 active:scale-[0.98] cursor-pointer"
            >
              Launch Intercept Corridor
            </button>
            <button
              onClick={() => clearSOSIncident(state.currentUser?.uid)}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <ShieldX className="h-3.5 w-3.5" /> Dismiss Incident Locally
            </button>
          </div>
        </div>
      )}

      {/* 2. BASE INTERCEPTOR PERIMETER DISPLAY */}
      <div className="text-center font-sans">
        <h2 className="text-sm font-bold text-slate-200 tracking-tight font-mono uppercase text-cyan-400">AURA™ Tactical Interceptor</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">Monitoring asynchronous localized node matrices</p>
      </div>

      {/* High-fidelity CSS Vector Radar Mapping Ring Grid */}
      <div className="flex justify-center my-4">
        <div className="relative h-48 w-48 border border-emerald-500/5 rounded-full flex items-center justify-center backdrop-blur-sm">
          <div className="absolute inset-6 border border-emerald-500/10 rounded-full" />
          <div className="absolute inset-14 border border-emerald-500/15 rounded-full" />
          <div className="absolute inset-22 border border-emerald-500/20 rounded-full" />
          
          <div className="absolute inset-0 rounded-full" style={{ transform: `rotate(${radarAngle}deg)`, background: 'conic-gradient(from 0deg at 50% 50%, rgba(16,185,129,0.12) 0deg, transparent 90deg)' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-emerald-500/5" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-full bg-emerald-500/5" />
          
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/80 relative z-10" />
          <span className="absolute bottom-3 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
            Mesh Active
          </span>
        </div>
      </div>

      {/* Grid Configuration Diagnostics Panel */}
      <div className="bg-slate-900/30 border border-slate-900 p-3.5 rounded-xl space-y-2 font-mono text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 uppercase text-[9px]">Local Mesh Shield</span> 
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
            {state.meshStatus}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 uppercase text-[9px]">Perimeter Bounds</span> 
          <span className="text-slate-300 font-bold">5.0 KM Radius</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 uppercase text-[9px]">Validation Key</span> 
          <span className="text-cyan-400 font-bold bg-cyan-950/30 border border-cyan-900/40 px-1.5 py-0.5 rounded text-[10px]">
            {state.currentUser?.role?.toUpperCase() || 'OPERATOR'}
          </span>
        </div>
      </div>
    </div>
  );
};