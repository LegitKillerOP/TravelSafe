import { useEffect, useState, useRef } from 'react';
import { useAppState } from '../context/Context';
import { AlertOctagon } from 'lucide-react';

export const GuardianMeshHub = () => {
  const { state } = useAppState();
  const [radarAngle, setRadarAngle] = useState(0);
  const audioTriggered = useRef(false);

  useEffect(() => {
    const frame = setInterval(() => setRadarAngle(p => (p + 2.5) % 360), 30);
    return () => clearInterval(frame);
  }, []);

  const dangerMode = state.safetyTimer !== null;

  useEffect(() => {
    if (dangerMode && !audioTriggered.current) {
      audioTriggered.current = true;
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => console.warn('Audio auto-playback deferred pending window token focus'));
    }
    if (!dangerMode) audioTriggered.current = false;
  }, [dangerMode]);

  const openRoute = () => {
    // FIXED: Corrected string interpolation template layout literal format
    window.open(`https://www.google.com/maps/search/?api=1&query=${state.userLocation.lat},${state.userLocation.lng}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-md min-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl p-6 text-slate-100 flex flex-col justify-between relative shadow-xl">
      {dangerMode && (
        <div className="absolute inset-0 z-30 bg-red-950/95 backdrop-blur-md p-6 flex flex-col justify-between rounded-3xl border-2 border-red-500/50 animate-fade-in">
          <div className="space-y-4 text-center mt-6">
            <div className="mx-auto w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center animate-bounce">
              <AlertOctagon className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide text-red-400 uppercase">AURA Intercept Vector</h2>
              <p className="text-xs text-slate-400 mt-1">Direct incident telemetry dispatched via BLE mesh ping</p>
            </div>

            <div className="bg-black/40 border border-red-500/20 p-4 rounded-xl space-y-2.5 text-left text-xs font-mono">
              <p className="flex justify-between">
                <span className="text-slate-500">Target Node:</span> 
                {/* FIXED: Re-mapped name output pathway to match your actual structural session definition */}
                <span className="text-slate-200 font-bold">{state.currentUser?.userName || 'Anonymous Node'}</span>
              </p>
              <p className="flex justify-between"><span className="text-slate-500">Vector Coordinates:</span> <span className="text-red-400">{state.userLocation.lat.toFixed(4)}, {state.userLocation.lng.toFixed(4)}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Broadcast Clock:</span> <span className="text-slate-200 font-bold">{state.safetyDuration}</span></p>
            </div>
          </div>

          <button
            onClick={openRoute}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 active:scale-[0.99]"
          >
            Launch Intercept Corridor
          </button>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-base font-bold text-slate-200">AURA™ Node Interceptor Grid</h2>
        <p className="text-xs text-slate-500 mt-0.5">Securing continuous peer-to-peer tracking matrices</p>
      </div>

      {/* High-fidelity CSS Vector Radar Mapping Ring Grid */}
      <div className="flex justify-center my-6">
        <div className="relative h-56 w-56 border border-emerald-500/10 rounded-full flex items-center justify-center">
          <div className="absolute inset-8 border border-emerald-500/20 rounded-full" />
          <div className="absolute inset-16 border border-emerald-500/25 rounded-full" />
          <div className="absolute inset-24 border border-emerald-500/30 rounded-full" />
          
          <div className="absolute inset-0 rounded-full" style={{ transform: `rotate(${radarAngle}deg)`, background: 'conic-gradient(from 0deg at 50% 50%, rgba(16,185,129,0.15) 0deg, transparent 90deg)' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-emerald-500/5" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-full bg-emerald-500/5" />
          
          <div className="w-3 w-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/80 relative z-10" />
          <span className="absolute bottom-4 text-[9px] font-mono text-emerald-500/60 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider">Mesh Node Active</span>
        </div>
      </div>

      {/* Grid Configuration Diagnostics Panel */}
      <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl space-y-2.5 font-mono text-[11px]">
        <div className="flex justify-between"><span className="text-slate-500">Local Mesh Shield</span> <span className="text-emerald-400 font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"/>{state.meshStatus}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Proximity Perimeter</span> <span className="text-slate-300 font-bold">5.0 KM Radius</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Validation Gateway</span> <span className="text-slate-300 font-bold">Verified Operator</span></div>
      </div>
    </div>
  );
};