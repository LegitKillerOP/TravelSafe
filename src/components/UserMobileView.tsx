import { useState, useEffect } from 'react';
import { useAppState } from '../context/Context';
import { useSpeechListener } from './SpeechListeners';
import { Zap, EyeOff, Radio, Activity, Navigation, AlertTriangle, Move } from 'lucide-react';

export const UserMobileView = () => {
  const { state, triggerSOS, resetSOS, addEvidence, updateLocation } = useAppState();
  const [voiceActive, setVoiceActive] = useState(true);
  const [recording, setRecording] = useState(false);
  const [blackoutActive, setBlackoutActive] = useState(false);
  
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: state.userLocation?.lat || 26.8467,
    lng: state.userLocation?.lng || 80.9462,
  });
  const [isTracking, setIsTracking] = useState<boolean>(false);

  useSpeechListener(voiceActive);

  // Dynamic Telemetry GPS Hardware Stream
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation hardware link unavailable.');
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;

        setLiveCoords({ lat: currentLat, lng: currentLng });
        if (updateLocation) {
          updateLocation(currentLat, currentLng);
        }
      },
      (error) => {
        console.error('Telemetry stream degradation:', error.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation]);

  // Grab-Sense AI Simulation
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
        
        addEvidence(hash, `${liveCoords.lat.toFixed(4)}, ${liveCoords.lng.toFixed(4)}`);
        setRecording(false);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3500);
    } catch {
      setTimeout(() => {
        const mockHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        addEvidence(mockHash, `${liveCoords.lat.toFixed(4)}, ${liveCoords.lng.toFixed(4)}`);
        setRecording(false);
      }, 3500);
    }
  };

  // Construct Leaflet-based interactive zero-WebGL embed link
  // Uses open-source mapnik tiles allowing user panning/zooming controls
  const interactiveMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    liveCoords.lng - 0.008
  }%2C${liveCoords.lat - 0.005}%2C${liveCoords.lng + 0.008}%2C${
    liveCoords.lat + 0.005
  }&layer=mapnik&marker=${liveCoords.lat}%2C${liveCoords.lng}`;

  return (
    <div className="mx-auto max-w-md min-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl p-5 text-slate-100 flex flex-col justify-between relative shadow-xl">
      {blackoutActive && (
        <div className="absolute inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-6 text-center">
          <EyeOff className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
          <p className="text-sm font-mono text-slate-500">Biometric Stealth Lock Active</p>
          <p className="text-xs text-slate-700 mt-1">Screen interface obscured. Evidence capturing...</p>
        </div>
      )}

      <div>
        {/* Infrastructure Metric Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider">Latency</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{state.responseLatency || '12'}ms</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider">Lumina Score</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{state.luminaScore || '98'}%</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block font-medium uppercase tracking-wider">AURA Grid</span>
            <span className="text-sm font-mono font-bold text-indigo-400">{state.meshStatus || 'ONLINE'}</span>
          </div>
        </div>

        {/* Live Interactive Panning Map Viewport */}
        <div className="relative h-64 w-full rounded-2xl border border-slate-800 overflow-hidden mb-4 bg-slate-950">
          <iframe
            title="Interactive TravelSafe Canvas"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={interactiveMapUrl}
            className="w-full h-full opacity-75 invert contrast-125 grayscale hue-rotate-180 transition-opacity duration-300 select-none"
          />

          {/* Geo-Spatial HUD Interface Overlays */}
          {/* Note: pointer-events-none lets touches pass straight through into the map iframe for panning */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            
            {/* Interactive Mode Guide Badge */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded-md text-[9px] text-slate-400 font-mono flex items-center gap-1 backdrop-blur-sm">
              <Move className="h-2.5 w-2.5 text-cyan-400" />
              <span>Drag / Pinch to Explore</span>
            </div>

            {/* Precision Status Tag */}
            <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 shadow-md backdrop-blur-sm">
              <Navigation className={`h-3 w-3 ${isTracking ? 'animate-spin' : ''}`} />
              <span>{isTracking ? 'GPS Stream Live' : 'Locating Grid...'}</span>
            </div>
          </div>
        </div>

        {/* Cleaned Double-Layer Redzone Bug Fix - Replaced with Alert Feed Panel */}
        {state.redZones && state.redZones.length > 0 && (
          <div className="mb-4 bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-[10px] text-red-400 font-mono leading-tight">
              Anomalous threat vectors detected near perimeter grid. Tracking {state.redZones.length} live geofenced sector zones.
            </p>
          </div>
        )}

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

      {/* Dynamic Status Bar footer */}
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