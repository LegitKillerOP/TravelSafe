import { useState, useEffect, useRef, ReactNode } from 'react';
import PubNub from 'pubnub';
import { AppContext } from './Context';
import type { AppState, UserProfile } from './Context';

const DEFAULT_RED_ZONES = [
  { lat: 26.8520, lng: 80.9490, radius: 180 },
  { lat: 26.8410, lng: 80.9350, radius: 240 }
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

    // Set local state instantly for the sender window
    setState((prev) => ({ ...prev, safetyTimer: 1000, safetyDuration: '00:00:01', meshStatus: 'Scanning' }));
    
    // Broadcast outward instantly to all listening phones on the internet
    sendNetworkMeshEvent('SOS_BROADCAST_START', { location: currentLoc, userName: currentName });
  };

  const resetSOS = () => {
    setState((prev) => ({ ...prev, safetyTimer: null, safetyDuration: '00:00:00', meshStatus: 'Active', responseLatency: 0 }));
    sendNetworkMeshEvent('SOS_BROADCAST_CLEAR', {});
  };

  const addEvidence = (hash: string, locationStr: string) => {
    const freshLog = {
      id: `INC-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      location: locationStr,
      hash: hash
    };
    setState((prev) => ({
      ...prev,
      latestHash: hash,
      evidenceLogs: [freshLog, ...prev.evidenceLogs]
    }));

    sendNetworkMeshEvent('EVIDENCE_DISPATCH', { hash, log: freshLog });
  };

  const updateLocation = (lat: number, lng: number) => {
    setState((prev) => ({ ...prev, userLocation: { lat, lng } }));
  };

  return (
    <AppContext.Provider value={{ state, login, logout, triggerSOS, resetSOS, addEvidence, updateLocation }}>
      {children}
    </AppContext.Provider>
  );
};