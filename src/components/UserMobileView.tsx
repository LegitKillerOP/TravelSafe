import { useState } from 'react';
import { useAppState } from '../context/Context';
import { useSpeechListener } from './SpeechListeners';
import { Zap, EyeOff, Radio, Activity } from 'lucide-react';

export const UserMobileView = () => {
  const { state, triggerSOS, resetSOS, addEvidence } = useAppState();
  const [voiceActive, setVoiceActive] = useState(true);
  const [recording, setRecording] = useState(false);
  const [blackoutActive, setBlackoutActive] = useState(false);

  useSpeechListener(voiceActive);

  // Grab-Sense AI sudden kinetic pull implementation
  const simulateSnatch = () => {
    setBlackoutActive(true);
    triggerSOS();
    handleBackgroundRecording();
    setTimeout(() => setBlackoutActive(false), 4500);
  };

  const handleBackgroundRecording = async () => {
    setRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (e) => audioChunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const buffer = await audioBlob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        
        addEvidence(hash, `${state.userLocation.lat.toFixed(4)}, ${state.userLocation.lng.toFixed(4)}`);
        setRecording(false);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3500);
    } catch {
      // Gracefully generate a mock validation hash signature fallback if mic denied
      setTimeout(() => {
        const mockHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        addEvidence(mockHash, `${state.userLocation.lat.toFixed(4)}, ${state.userLocation.lng.toFixed(4)}`);
        setRecording(false);
      }, 3500);
    }
  };

  return (
    <div className="mx-auto max-w-md min-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl p-5 text-slate-100 flex flex-col justify-between relative shadow-xl">
      {blackoutActive && (
        <div className="absolute inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <EyeOff className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
          <p className="text-sm font-mono text-slate-500">Biometric Stealth Lock Active</p>
          <p className="text-xs text-slate-700 mt-1">Screen interface obscured. Evidence capturing...</p>
        </div>
      )}

      <div>
        {/* Core Infrastructure Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider">Latency</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{state.responseLatency}ms</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider">Lumina Score</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{state.luminaScore}%</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider">AURA Grid</span>
            <span className="text-sm font-mono font-bold text-indigo-400">{state.meshStatus}</span>
          </div>
        </div>

        {/* Beautiful Mapbox Alternative (Native OpenStreetMap Embed Template) */}
        <div className="relative h-64 w-full rounded-2xl border border-slate-800 overflow-hidden mb-4 bg-slate-900">
          <iframe
            title="SafeZone Canvas Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${state.userLocation.lng-0.015}%2C${state.userLocation.lat-0.01}%2C${state.userLocation.lng+0.015}%2C${state.userLocation.lat+0.01}&layer=mapnik&marker=${state.userLocation.lat}%2C${state.userLocation.lng}`}
            className="opacity-70 invert contrast-125 grayscale hue-rotate-180"
          />
          {/* Neon Safety Overlays via CSS absolute wrappers */}
          <div className="absolute inset-0 pointer-events-none">
            {state.redZones.map((zone, i) => (
              <div
                key={i}
                className="absolute bg-red-500/20 border-2 border-dashed border-red-500/40 rounded-full animate-pulse"
                style={{ top: `${35 + (i * 20)}%`, left: `${40 + (i * 15)}%`, width: `${zone.radius / 3}px`, height: `${zone.radius / 3}px` }}
              />
            ))}
            <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"/> Safe Route Synced
            </div>
          </div>
        </div>

        {/* Smart Automation Control Triggers */}
        <div className="space-y-3">
          <button
            onClick={simulateSnatch}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] shadow-lg shadow-red-950/20"
          >
            <Zap className="h-4 w-4 fill-white" />
            Simulate Grab-Sense™ AI Snatch
          </button>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${voiceActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Invisible Voice Sentinel</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Triggers SOS on safe-word "Mary"</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={voiceActive} onChange={(e) => setVoiceActive(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white" />
            </label>
          </div>
        </div>
      </div>

      {/* Dynamic Status Bar footer mapping ecosystem loop context */}
      <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className={`h-3.5 w-3.5 ${recording ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
          <span>{recording ? "Shadow Witness Recording..." : "Ecosystem Shield Guarding"}</span>
        </div>
        {state.safetyTimer !== null && (
          <button onClick={resetSOS} className="text-[11px] text-slate-500 hover:text-slate-300 transition underline">
            Cancel Mock SOS
          </button>
        )}
      </div>
    </div>
  );
};