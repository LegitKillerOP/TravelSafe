import { useState, useEffect, useRef } from 'react';
import { useAppState } from '../context/Context';
import { useSpeechListener } from './SpeechListeners';
import { Zap, EyeOff, Radio, Activity, Navigation, AlertTriangle, Move, ShieldAlert, Crosshair, Users, HardDrive } from 'lucide-react';
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
  const { state, triggerSOS, resetSOS, addEvidence, updateLocation, updateLuminaScore } = useAppState();
  const [voiceActive, setVoiceActive] = useState(true);
  const [recording, setRecording] = useState(false);
  const [blackoutActive, setBlackoutActive] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ThreatZone | null>(null);
  
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: state.userLocation?.lat || 26.8467,
    lng: state.userLocation?.lng || 80.9462,
  });
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);
  
  const simulationActiveRef = useRef(simulationActive);

  useEffect(() => {
    simulationActiveRef.current = simulationActive;
  }, [simulationActive]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  useSpeechListener(voiceActive);

  // Map Initialization
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
        markerRef.current = null;
      }
    };
  }, []);

  // Telemetry Marker & Map Sync Integration
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
    }
  }, [liveCoords.lat, liveCoords.lng]);

  // Geofenced Vector Boundaries Layer
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

  // Sync state context position modifications
  useEffect(() => {
    if (state.userLocation) {
      setLiveCoords({ lat: state.userLocation.lat, lng: state.userLocation.lng });
    }
  }, [state.userLocation]);

  // Hardware Geolocation Watch Stream Interface
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (simulationActiveRef.current) return;
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

  const simulateNightWalk = () => {
    if (simulationActiveRef.current) return;
    
    if (state.safetyTimer !== null) {
      resetSOS();
    }
    
    setSimulationActive(true);
    updateLuminaScore(98);
    
    const path = [
      { name: "Safe Command Center (Base)", lat: 26.8467, lng: 80.9462, score: 98, log: "Initializing night walk path. System reporting 98% safe status." },
      { name: "Hazratganj Outer Ring Link", lat: 26.8485, lng: 80.9472, score: 90, log: "Moving down Hazratganj Outer Ring. Low density warning activated." },
      { name: "High-density Corridor Accessway", lat: 26.8502, lng: 80.9481, score: 72, log: "Traversing Corridor Accessway. Proximity alert: Red zone 180m away." },
      { name: "Hazratganj Dark Alley Intersection", lat: 26.8512, lng: 80.9485, score: 55, log: "Entering high risk bottleneck. Safety score dropping. Preparing stealth recorder..." },
      { name: "Deep Inside Hazratganj (Red Zone)", lat: 26.8520, lng: 80.9490, score: 28, log: "Danger! Red Zone threshold violated. Automatically triggering Grab-Sense™ SOS broadcast!" }
    ];

    let currentStep = 0;
    
    const runStep = () => {
      if (currentStep >= path.length) {
        setSimulationActive(false);
        setSimulationLog(null);
        return;
      }
      
      const point = path[currentStep];
      setSimulationLog(point.log);
      
      setLiveCoords({ lat: point.lat, lng: point.lng });
      updateLocation(point.lat, point.lng);
      updateLuminaScore(point.score);
      
      if (mapRef.current) {
        mapRef.current.setView([point.lat, point.lng], 15, { animate: true });
      }
      
      if (currentStep === path.length - 1) {
        setTimeout(() => {
          simulateSnatch();
          setSimulationActive(false);
          setSimulationLog(null);
        }, 1500);
        return;
      }
      
      currentStep++;
      setTimeout(runStep, 2500);
    };

    runStep();
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
        <div className="h-auto opacity-100 mb-3">
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

        <div className="grid grid-cols-3 gap-2 h-auto opacity-100 mb-3">
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

        <div className={`transition-all duration-300 rounded-2xl border bg-slate-950 transform-gpu will-change-transform z-10 relative h-[410px] w-full mb-4 ${
          isSOSActive ? 'border-red-600/60 shadow-lg shadow-red-950/20' : 'border-slate-800'
        }`}>
          <div ref={mapContainerRef} className="w-full h-full mix-blend-lighten rounded-2xl" />

          {simulationActive && simulationLog && (
            <div className="absolute top-3 left-3 right-14 bg-slate-950/95 border border-cyan-500/40 p-2.5 rounded-xl text-[10px] font-mono text-cyan-400 z-[410] shadow-lg shadow-cyan-950/20 backdrop-blur-md animate-pulse">
              <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-0.5">AURA Walk Sentinel Daemon</span>
              {simulationLog}
            </div>
          )}

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
              </div>
            ) : <div />}
          </div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-[400]">
            <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800/50 px-2.5 py-1 rounded-md text-[9px] text-slate-400 font-mono flex items-center gap-1.5 backdrop-blur-sm">
              <Move className="h-3 w-3 text-cyan-400" />
              <span>Tap radar vectors to view</span>
            </div>
            <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-auto">
              <button 
                onClick={reCenterOnUser}
                className="bg-slate-950/90 border border-slate-800/80 active:bg-slate-900 hover:border-cyan-500/40 p-2.5 rounded-xl text-emerald-400 shadow-lg backdrop-blur-sm cursor-pointer transition-all"
              >
                <Navigation className={`h-4 w-4 ${isTracking ? 'text-cyan-400' : 'text-slate-500'}`} />
              </button>
            </div>
          </div>
        </div>

        {state.redZones && state.redZones.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-xl max-h-24 overflow-y-auto scrollbar-none h-auto opacity-100 mb-3">
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
                    className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
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

        <div className="space-y-2 h-auto mt-auto">
          <button
            onClick={simulateNightWalk}
            disabled={isSOSActive || simulationActive}
            className={`w-full text-slate-950 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg ${
              isSOSActive || simulationActive
                ? 'bg-slate-900/20 border border-slate-800 text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-cyan-950/30'
            }`}
          >
            <Navigation className={`h-4 w-4 fill-slate-950 ${simulationActive ? 'animate-pulse' : ''}`} />
            {simulationActive ? 'AURA Walking Sim Active...' : 'Simulate AURA Night Walk'}
          </button>

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

      <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 h-auto mt-4">
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