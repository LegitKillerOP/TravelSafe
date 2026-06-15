import { useState, useEffect, useRef} from 'react';
import type { ReactNode } from 'react';
import PubNub from 'pubnub';
import { AppContext } from './Context';
import type { AppState, UserProfile } from './Context';

const DEFAULT_RED_ZONES = [
  { id: 'zone-1', name: 'Hazratganj Central Corridor', lat: 26.8520, lng: 80.9490, radius: 180, riskLevel: 'Medium' },
  { id: 'zone-2', name: 'Charbagh Station Transit Hub', lat: 26.8312, lng: 80.9205, radius: 350, riskLevel: 'High' },
  { id: 'zone-3', name: 'Aminabad Market Bottleneck', lat: 26.8410, lng: 80.9350, radius: 240, riskLevel: 'High' },
  { id: 'zone-4', name: 'Gomti Nagar Extension Underpass', lat: 26.8485, lng: 80.9982, radius: 210, riskLevel: 'Low' },
  { id: 'zone-5', name: 'Alambagh High-Density Intersect', lat: 26.8028, lng: 80.9034, radius: 280, riskLevel: 'Medium' },
  { id: 'zone-6', name: 'Chowk Heritage Old City Corridor', lat: 26.8672, lng: 80.9068, radius: 320, riskLevel: 'High' },
  { id: 'zone-7', name: 'Polytechnic Chauraha Commuter Pivot', lat: 26.8732, lng: 80.9884, radius: 300, riskLevel: 'High' },
  { id: 'zone-8', name: 'Munshi Pulia Intersection Overpass', lat: 26.8921, lng: 80.9915, radius: 220, riskLevel: 'Medium' },
  { id: 'zone-9', name: 'Lulu Mall Transit Fringe Loop', lat: 26.7725, lng: 81.0118, radius: 400, riskLevel: 'Low' },
  { id: 'zone-10', name: 'Kapoorthala Commercial Sector Hub', lat: 26.8794, lng: 80.9439, radius: 190, riskLevel: 'Medium' },
  { id: 'zone-11', name: 'Engineering College Student Zone', lat: 26.9142, lng: 80.9421, radius: 260, riskLevel: 'High' },
  { id: 'zone-12', name: 'Jankipuram Vistar Isolation Link', lat: 26.9310, lng: 80.9592, radius: 310, riskLevel: 'Low' },
  { id: 'zone-13', name: 'Tedhi Pulia High-Capacity Roundabout', lat: 26.9065, lng: 80.9578, radius: 270, riskLevel: 'Medium' },
  { id: 'zone-14', name: 'Bhootnath Market Arterial Narrow', lat: 26.8681, lng: 80.9818, radius: 170, riskLevel: 'High' },
  { id: 'zone-15', name: 'Ashiyana Power House Dense Perimeter', lat: 26.7914, lng: 80.9167, radius: 230, riskLevel: 'Medium' },
  { id: 'zone-16', name: 'IT Chauraha Metro Interchange', lat: 26.8649, lng: 80.9496, radius: 200, riskLevel: 'High' }
];

const defaultInitialState: AppState = {
  isAuthenticated: false,
  currentUser: null,
  meshStatus: 'Active',
  responseLatency: 0,
  luminaScore: 94,
  safetyTimer: null,
  safetyDuration: '00:00:00',
  userLocation: { lat: 26.8467, lng: 80.9462 },
  redZones: DEFAULT_RED_ZONES,
  latestHash: null,
  evidenceLogs: []
};

const pubnubClient = new PubNub({
  publishKey: import.meta.env.VITE_PUBNUB_PUBLISH_KEY || 'demo',
  subscribeKey: import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY || 'demo',
  userId: `device-node-${Math.floor(100000 + Math.random() * 900000)}`
});

const MESH_CHANNEL_NAME = 'travelsafe-global-mesh-net';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(() => {
    const savedUser = localStorage.getItem('travelsafe_session');
    if (savedUser) {
      const parsedUser: UserProfile = JSON.parse(savedUser);
      return {
        ...defaultInitialState,
        isAuthenticated: true,
        currentUser: parsedUser,
        userLocation: parsedUser.baseLocation
      };
    }
    return defaultInitialState;
  });

  // Local-only state tracking for response nodes to override active UI visibility without altering PubNub feeds
  const [localMutedIncident, setLocalMutedIncident] = useState(false);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Global Cross-Device Mesh Subscriber Engine
  useEffect(() => {
    const pubnubListener = {
      message: (envelope: any) => {
        const { eventName, payload } = envelope.message;
        
        // Prevent reacting to your own broadcast events if you already updated state locally
        if (envelope.publisher === pubnubClient.getUserId()) return;

        if (eventName === 'SOS_BROADCAST_START') {
          setLocalMutedIncident(false); // Reset mute flag whenever a fresh network breach/incident occurs
          setState((prev) => ({
            ...prev,
            safetyTimer: 1000,
            safetyDuration: '00:00:01',
            meshStatus: 'Scanning',
            // Snap map coordinates for Guardians/Officers directly to the incoming target vector
            userLocation: prev.currentUser?.role !== 'user' ? payload.location : prev.userLocation
          }));
        }

        if (eventName === 'SOS_BROADCAST_CLEAR') {
          setLocalMutedIncident(false);
          setState((prev) => ({
            ...prev,
            safetyTimer: null,
            safetyDuration: '00:00:00',
            meshStatus: 'Active',
            responseLatency: 0
          }));
        }

        if (eventName === 'EVIDENCE_DISPATCH') {
          setState((prev) => ({
            ...prev,
            latestHash: payload.hash,
            evidenceLogs: [payload.log, ...prev.evidenceLogs]
          }));
        }
      }
    };

    // Bind listener and subscribe to the open mesh channel
    pubnubClient.addListener(pubnubListener);
    pubnubClient.subscribe({ channels: [MESH_CHANNEL_NAME] });

    return () => {
      pubnubClient.removeListener(pubnubListener);
      pubnubClient.unsubscribe({ channels: [MESH_CHANNEL_NAME] });
    };
  }, []);

  // Telemetry Dynamic Timer Update Engine
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.safetyTimer !== null) {
      interval = setInterval(() => {
        setState((prev) => {
          if (prev.safetyTimer === null) return prev;
          const nextTimer = prev.safetyTimer + 1000;
          const secs = Math.floor((nextTimer / 1000) % 60).toString().padStart(2, '0');
          const mins = Math.floor((nextTimer / 60000) % 60).toString().padStart(2, '0');
          return {
            ...prev,
            safetyTimer: nextTimer,
            safetyDuration: `00:${mins}:${secs}`,
            responseLatency: Math.max(12, Math.floor(Math.random() * 45))
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.safetyTimer]);

  const login = (userProfile: Omit<UserProfile, 'uid'>) => {
    const completeProfile: UserProfile = {
      ...userProfile,
      uid: `USR-${Math.floor(100000 + Math.random() * 900000)}`
    };
    localStorage.setItem('travelsafe_session', JSON.stringify(completeProfile));
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentUser: completeProfile,
      userLocation: completeProfile.baseLocation
    }));
  };

  const logout = () => {
    localStorage.removeItem('travelsafe_session');
    setState({ ...defaultInitialState, isAuthenticated: false, currentUser: null });
  };

  // Direct client-side cloud publisher broadcast system
  const sendNetworkMeshEvent = (eventName: string, payload: any) => {
    try {
      pubnubClient.publish({
        channel: MESH_CHANNEL_NAME,
        message: { eventName, payload }
      });
    } catch (err) {
      console.error("PubNub mesh broadcast transmission failure:", err);
    }
  };

  const triggerSOS = () => {
    const currentLoc = stateRef.current.userLocation;
    const currentName = stateRef.current.currentUser?.userName || 'Civilian Node';
    setState((prev) => ({ ...prev, safetyTimer: 1000, safetyDuration: '00:00:01', meshStatus: 'Scanning' }));
    sendNetworkMeshEvent('SOS_BROADCAST_START', { location: currentLoc, userName: currentName });
  };

  const resetSOS = () => {
    setState((prev) => ({ ...prev, safetyTimer: null, safetyDuration: '00:00:00', meshStatus: 'Active', responseLatency: 0 }));
    sendNetworkMeshEvent('SOS_BROADCAST_CLEAR', {});
  };

  // Operational Node Actions (Mutes locally on current supervisor console layout only)
  const interceptSOS = (targetUid?: string) => {
    console.log(`[Mesh Event] Local node intercepting routing target frame: ${targetUid}`);
  };

  const clearSOSIncident = (targetUid?: string) => {
    console.log(`[Mesh Event] Locally dismissing incident display frame for target: ${targetUid}`);
    setLocalMutedIncident(true);
  };

  const addEvidence = (hash: string, locationStr: string) => {
    const freshLog = {
      id: `INC-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      location: locationStr,
      hash: hash
    };
    setState((prev) => ({ ...prev, latestHash: hash, evidenceLogs: [freshLog, ...prev.evidenceLogs] }));
    sendNetworkMeshEvent('EVIDENCE_DISPATCH', { hash, log: freshLog });
  };

  const updateLocation = (lat: number, lng: number) => {
    setState((prev) => ({ ...prev, userLocation: { lat, lng } }));
  };

  return (
    <AppContext.Provider 
      value={{ 
        state, 
        localMutedIncident,
        login, 
        logout, 
        triggerSOS, 
        resetSOS, 
        interceptSOS, 
        clearSOSIncident, 
        addEvidence, 
        updateLocation 
      }}
    >
      {children}
    </AppContext.Provider>
  );
};