import { useState, useEffect, useRef } from 'react';
import { useAppState } from '../context/Context';
import { useSpeechListener } from './SpeechListeners';
import { Zap, EyeOff, Radio, Activity, Navigation, AlertTriangle, Move, ShieldAlert, Crosshair, Users, HardDrive, Maximize2, Minimize2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ThreatZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  riskLevel: 'High' | 'Medium' | 'Low';
}

export const UserMobileView = () => {
  const { state, triggerSOS, resetSOS, addEvidence, updateLocation } = useAppState();
  const [voiceActive, setVoiceActive] = useState(true);
  const [recording, setRecording] = useState(false);
  const [blackoutActive, setBlackoutActive] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ThreatZone | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: state.userLocation?.lat || 26.8467,
    lng: state.userLocation?.lng || 80.9462,
  });
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  useSpeechListener(voiceActive);

  // =========================================================================
  // HOOK 1: PRIMARY CANVAS INITIALIZATION
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [liveCoords.lat, liveCoords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(mapRef.current);

    mapRef.current.on('click', () => setSelectedZone(null));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // =========================================================================
  // HOOK 2: FULLSCREEN GEOMETRY RECALIBRATION
  // =========================================================================
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize({ animate: true });
      }, 300); // Matches Tailwind layout transitions
    }
  }, [isFullscreen]);

  // =========================================================================
  // HOOK 3: TELEMETRY MARKER SYNCHRONIZATION
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (markerRef.current) {
      markerRef.current.setLatLng([liveCoords.lat, liveCoords.lng]);
    } else {
      const beaconIcon = L.divIcon({
        className: 'advanced-telemetry-beacon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 border border-cyan-500/30 rounded-full animate-ping [animation-duration:3s]"></div>
            <div class="absolute w-6 h-6 border-2 border-cyan-400/60 rounded-full animate-pulse"></div>
            <div class="w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-950 shadow-lg shadow-cyan-400/50 relative z-10"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });
      markerRef.current = L.marker([liveCoords.lat, liveCoords.lng], { icon: beaconIcon }).addTo(map);
      map.setView([liveCoords.lat, liveCoords.lng], map.getZoom());
    }
  }, [liveCoords.lat, liveCoords.lng]);

  // =========================================================================
  // HOOK 4: GEOFENCED VECTOR BOUNDARIES LAYER
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    circlesRef.current.forEach(c => map.removeLayer(c));
    circlesRef.current = [];

    if (state.redZones) {
      state.redZones.forEach((rawZone: any, index: number) => {
        const zone: ThreatZone = {
          id: rawZone.id || `vector-${index}`,
          name: rawZone.name || `Threat Sector ${index + 1}`,
          lat: rawZone.lat,
          lng: rawZone.lng,
          radius: rawZone.radius || 300,
          riskLevel: rawZone.riskLevel || 'Medium'
        };

        const riskColors = {
          High: { stroke: '#f43f5e', fill: '#e11d48' },
          Medium: { stroke: '#f59e0b', fill: '#d97706' },
          Low: { stroke: '#10b981', fill: '#059669' }
        }[zone.riskLevel];

        const threatCircle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: riskColors.stroke,
          weight: 1.5,
          dashArray: zone.riskLevel === 'High' ? '4, 4' : undefined,
          fillColor: riskColors.fill,
          fillOpacity: 0.12,
        }).addTo(map);

        threatCircle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedZone(zone);
          map.setView([zone.lat - 0.002, zone.lng], map.getZoom(), { animate: true });
        });

        circlesRef.current.push(threatCircle);
      });
    }
  }, [state.redZones]);

  useEffect(() => {
    if (state.userLocation) {
      setLiveCoords({ lat: state.userLocation.lat, lng: state.userLocation.lng });
    }
  }, [state.userLocation]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        setLiveCoords({ lat: currentLat, lng: currentLng });
        if (updateLocation) updateLocation(currentLat, currentLng);
      },
      () => setIsTracking(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation]);

  const reCenterOnUser = () => {
    if (mapRef.current) {
      mapRef.current.setView([liveCoords.lat, liveCoords.lng], 15, { animate: true });
    }
  };

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

  const isSOSActive = state.safetyTimer !== null;

  return (
    <div className={`mx-auto max-w-md min-h-screen transition-all duration-500 rounded-3xl p-4 text-slate-100 flex flex-col justify-between relative shadow-xl border overflow-hidden ${
      isSOSActive 
        ? 'bg-rose-950/40 border-rose-600 shadow-rose-900/20 shadow-2xl' 
        : 'bg-slate-950 border-slate-800'
    }`}>
      
      {blackoutActive && (
        <div className="absolute inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-6 text-center rounded-3xl">
          <EyeOff className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
          <p className="text-sm font-mono text-slate-500">Biometric Stealth Lock Active</p>
          <p className="text-xs text-slate-700 mt-1">Screen interface obscured. Evidence capturing...</p>
        </div>
      )}

      <div className="flex flex-col h-full flex-grow">
        
        {/* Dynamic Mobile Header - Collapsed during Fullscreen Map Focus */}
        <div className={`transition-all duration-300 origin-top overflow-hidden ${
          isFullscreen ? 'h-0 opacity-0 mb-0 scale-y-0' : 'h-auto opacity-100 mb-3'
        }`}>
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">System Node</h3>
              <p className="text-base font-bold font-sans tracking-tight">
                {state.currentUser?.userName || 'Anonymous Civilian'}
              </p>
            </div>
            {isSOSActive && (
              <div className="bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-md animate-pulse flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-mono font-bold text-red-400">{state.safetyDuration}</span>
              </div>
            )}
          </div>
        </div>

        {/* System Telemetry Core Grid - Collapsed during Fullscreen Map Focus */}
        <div className={`grid grid-cols-3 gap-2 transition-all duration-300 origin-top overflow-hidden ${
          isFullscreen ? 'h-0 opacity-0 mb-0 scale-y-0' : 'h-auto opacity-100 mb-3'
        }`}>
          <div className="bg-slate-900/40 border border-slate-900 p-2 rounded-xl text-center backdrop-blur-sm">
            <span className="text-[9px] text-slate-500 block font-medium uppercase tracking-wider">Latency</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{state.responseLatency || '12'}ms</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-2 rounded-xl text-center backdrop-blur-sm">
            <span className="text-[9px] text-slate-500 block font-medium uppercase tracking-wider">Lumina</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{state.luminaScore || '98'}%</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-2 rounded-xl text-center backdrop-blur-sm">
            <span className="text-[9px] text-slate-500 block font-medium uppercase tracking-wider">AURA Grid</span>
            <span className={`text-xs font-mono font-bold uppercase ${isSOSActive ? 'text-red-400' : 'text-indigo-400'}`}>
              {state.meshStatus || 'ONLINE'}
            </span>
          </div>
        </div>

        {/* ADAPTIVE INTERACTIVE VIEWPORT CANVAS */}
        <div className={`transition-all duration-500 rounded-2xl border bg-slate-950 transform-gpu will-change-transform z-10 relative ${
          isFullscreen 
            ? 'absolute inset-0 m-0 rounded-none border-none h-full w-full z-40' 
            : 'h-[410px] w-full mb-4'
        } ${isSOSActive && !isFullscreen ? 'border-red-600/60 shadow-lg shadow-red-950/20' : 'border-slate-800'}`}>
          
          <div ref={mapContainerRef} className="w-full h-full mix-blend-lighten" />

          {/* ERGONOMIC SLIDING BOTTOM DRAW PANEL */}
          <div className={`absolute bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800/80 px-4 pt-2 pb-4 z-[500] backdrop-blur-md transition-transform duration-300 transform-gpu will-change-transform shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.7)] ${
            selectedZone ? 'translate-y-0' : 'translate-y-full'
          }`}>
            {selectedZone ? (
              <div className="font-mono flex flex-col gap-3">
                <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-1" onClick={() => setSelectedZone(null)} />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-sans font-bold text-slate-100 truncate pr-4">{selectedZone.name}</h4>
                  <button onClick={() => setSelectedZone(null)} className="text-slate-400 bg-slate-900 border border-slate-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-sans active:bg-slate-800">×</button>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/60">
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Risk Vector</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border inline-block ${
                      selectedZone.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : selectedZone.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>{selectedZone.riskLevel}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Scope</span>
                    <span className="text-[10px] text-slate-300 font-bold">{selectedZone.radius}m Bounds</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Coordinates</span>
                    <span className="text-[9px] text-slate-400 block truncate">{selectedZone.lat.toFixed(3)}N, {selectedZone.lng.toFixed(3)}E</span>
                  </div>
                </div>
                <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5"><Crosshair className="h-3 w-3 text-cyan-400" /> Node Synced</div>
                  <div className="flex items-center gap-1.5"><Users className="h-3 w-3 text-indigo-400" /> 14 Mesh Peers</div>
                  <div className="flex items-center gap-1.5"><HardDrive className="h-3 w-3 text-emerald-400" /> Secure Link</div>
                </div>
              </div>
            ) : <div />}
          </div>

          {/* Floating UI HUD Mobile Control Clusters */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-[400]">
            
            {/* Ambient Mode Badge Indicator */}
            {isFullscreen && (
              <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-200 backdrop-blur-md flex items-center gap-2 shadow-xl animate-fade-in pointer-events-auto">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono tracking-wider font-bold uppercase">Tactical Radar Mode</span>
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800/50 px-2.5 py-1 rounded-md text-[9px] text-slate-400 font-mono flex items-center gap-1.5 backdrop-blur-sm">
              <Move className="h-3 w-3 text-cyan-400" />
              <span>Tap radar vectors to view</span>
            </div>

            {/* Floating Action Cluster Control Hub */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-auto">
              {/* Fullscreen Canvas Switcher */}
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-slate-950/90 border border-slate-800/80 active:bg-slate-900 hover:border-cyan-500/40 p-2.5 rounded-xl text-slate-300 shadow-lg backdrop-blur-sm cursor-pointer transition-all"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4 text-amber-400" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              {/* Recenter Telemetry Matrix Button */}
              <button 
                onClick={reCenterOnUser}
                className="bg-slate-950/90 border border-slate-800/80 active:bg-slate-900 hover:border-cyan-500/40 p-2.5 rounded-xl text-emerald-400 shadow-lg backdrop-blur-sm cursor-pointer transition-all"
              >
                <Navigation className={`h-4 w-4 ${isTracking ? 'text-cyan-400' : 'text-slate-500'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Threat Sector Micro Scroll Logs - Collapsed during Fullscreen Map Focus */}
        {state.redZones && state.redZones.length > 0 && (
          <div className={`bg-slate-900/40 border border-slate-900 p-2.5 rounded-xl max-h-24 overflow-y-auto scrollbar-none transition-all duration-300 origin-bottom ${
            isFullscreen ? 'h-0 p-0 m-0 border-none opacity-0 scale-y-0' : 'h-auto opacity-100 mb-3'
          }`}>
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-900">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              <h5 className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                AURA Mesh Feed • {state.redZones.length} Active Nodes
              </h5>
            </div>
            
            <div className="space-y-1">
              {state.redZones.map((rawZone: any, index: number) => {
                const zone: ThreatZone = {
                  id: rawZone.id || `vector-${index}`,
                  name: rawZone.name || `Threat Sector ${index + 1}`,
                  lat: rawZone.lat,
                  lng: rawZone.lng,
                  radius: rawZone.radius || 300,
                  riskLevel: rawZone.riskLevel || 'Medium'
                };

                return (
                  <div 
                    key={zone.id} 
                    onClick={() => {
                      setSelectedZone(zone);
                      if (mapRef.current) mapRef.current.setView([zone.lat - 0.002, zone.lng], 15, { animate: true });
                    }}
                    className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                      selectedZone?.id === zone.id ? 'bg-slate-900/90 border-cyan-500/50' : 'bg-slate-950/40 border-transparent hover:border-slate-900'
                    }`}
                  >
                    <p className="text-[11px] font-medium text-slate-300 truncate max-w-[240px]">{zone.name}</p>
                    <span className={`text-[8px] font-mono font-bold px-1.5 rounded border uppercase scale-90 ${
                      zone.riskLevel === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : zone.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>{zone.riskLevel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thumb-Optimized Automation Controls - Collapsed during Fullscreen Map Focus */}
        <div className={`space-y-2 transition-all duration-300 origin-bottom ${
          isFullscreen ? 'h-0 opacity-0 overflow-hidden m-0 scale-y-0' : 'h-auto mt-auto'
        }`}>
          <button
            onClick={simulateSnatch}
            disabled={isSOSActive}
            className={`w-full text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg ${
              isSOSActive ? 'bg-red-900/20 border border-red-600/20 text-red-400/60 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-red-600 to-rose-600 active:from-red-700 active:to-rose-700 shadow-red-950/30'
            }`}
          >
            <Zap className={`h-4 w-4 fill-white ${isSOSActive ? 'animate-bounce' : ''}`} />
            {isSOSActive ? 'SOS Broadcast Active' : 'Simulate Grab-Sense™ AI Snatch'}
          </button>

          <div className="bg-slate-900/50 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${voiceActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900 text-slate-600'}`}>
                <Radio className="h-3.5 w-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Invisible Voice Sentinel</h4>
                <p className="text-[9px] text-slate-500">Safe-word anchor: "Mary"</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={voiceActive} onChange={(e) => setVoiceActive(e.target.checked)} className="sr-only peer" />
              <div className="w-8 h-4.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white" />
            </label>
          </div>
        </div>
      </div>

      {/* Persistent Status Bar Footnote - Persistent or Hidden on Fullscreen */}
      <div className={`pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 transition-all duration-300 ${
        isFullscreen ? 'h-0 py-0 opacity-0 border-transparent overflow-hidden' : 'h-auto mt-4'
      }`}>
        <div className="flex items-center gap-2">
          <Activity className={`h-3.5 w-3.5 ${recording ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
          <span>{recording ? "Shadow Evidence Feed Open..." : "Ecosystem Shield Online"}</span>
        </div>
        {isSOSActive && (
          <button onClick={resetSOS} className="text-[9px] text-red-400 font-mono font-bold hover:text-red-300 transition uppercase tracking-wider bg-red-950/40 border border-red-900/40 px-2 py-0.5 rounded cursor-pointer">
            Reset Grid
          </button>
        )}
      </div>
    </div>
  );
};