import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type AppState = {
  meshStatus: 'Active' | 'Scanning' | 'Offline';
  responseLatency: number;
  luminaScore: number;
  safetyTimer: number | null; // null = safe, >0 = SOS countdown active
  safetyDuration: string;
  userName: string;
  userLocation: { lat: number; lng: number };
  redZones: Array<{ lat: number; lng: number; radius: number }>;
  latestHash: string | null;
  evidenceLogs: Array<{ id: string; timestamp: string; location: string; hash: string }>;
};

export type AppContextType = {
  state: AppState;
  triggerSOS: () => void;
  resetSOS: () => void;
  addEvidence: (hash: string, locationStr: string) => void;
  updateLocation: (lat: number, lng: number) => void;
};

const defaultState: AppState = {
  meshStatus: 'Active',
  responseLatency: 0,
  luminaScore: 94,
  safetyTimer: null,
  safetyDuration: '00:00:00',
  userName: 'Aanya Sharma',
  userLocation: { lat: 26.8467, lng: 80.9462 }, // Lucknow base coordinates
  redZones: [
    { lat: 26.8520, lng: 80.9490, radius: 180 },
    { lat: 26.8410, lng: 80.9350, radius: 240 }
  ],
  latestHash: null,
  evidenceLogs: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);

  // Simulated countdown interval for tracking live response parameters during SOS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.safetyTimer !== null) {
      interval = setInterval(() => {
        setState((prev) => {
          if (prev.safetyTimer === null) return prev;
          const nextTimer = prev.safetyTimer + 1000;
          
          // Format elapsed safety clock time cleanly
          const secs = Math.floor((nextTimer / 1000) % 60).toString().padStart(2, '0');
          const mins = Math.floor((nextTimer / 60000) % 60).toString().padStart(2, '0');
          return {
            ...prev,
            safetyTimer: nextTimer,
            safetyDuration: `00:${mins}:${secs}`,
            responseLatency: Math.max(12, Math.floor(Math.random() * 45)) // Realistic latency fluctuator
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.safetyTimer]);

  const triggerSOS = () => {
    setState((prev) => {
      if (prev.safetyTimer !== null) return prev; // Already activated
      return {
        ...prev,
        safetyTimer: 1000,
        safetyDuration: '00:00:01',
        meshStatus: 'Scanning'
      };
    });
  };

  const resetSOS = () => {
    setState((prev) => ({
      ...prev,
      safetyTimer: null,
      safetyDuration: '00:00:00',
      meshStatus: 'Active',
      responseLatency: 0
    }));
  };

  const addEvidence = (hash: string, locationStr: string) => {
    setState((prev) => ({
      ...prev,
      latestHash: hash,
      evidenceLogs: [
        {
          id: `INC-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: new Date().toISOString(),
          location: locationStr,
          hash: hash
        },
        ...prev.evidenceLogs
      ]
    }));
  };

  const updateLocation = (lat: number, lng: number) => {
    setState((prev) => ({ ...prev, userLocation: { lat, lng } }));
  };

  return (
    <AppContext.Provider value={{ state, triggerSOS, resetSOS, addEvidence, updateLocation }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used inside an AppProvider');
  return context;
};