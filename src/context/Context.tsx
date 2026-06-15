import { createContext, useContext } from 'react';

export type UserProfile = {
  uid: string;
  userName: string;
  role: 'user' | 'guardian' | 'police';
  aadhaarVerified: boolean;
  baseLocation: { lat: number; lng: number };
};

export type AppState = {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  meshStatus: 'Active' | 'Scanning' | 'Offline';
  responseLatency: number;
  luminaScore: number;
  safetyTimer: number | null; 
  safetyDuration: string;
  userLocation: { lat: number; lng: number };
  redZones: Array<{ lat: number; lng: number; radius: number }>;
  latestHash: string | null;
  evidenceLogs: Array<{ id: string; timestamp: string; location: string; hash: string }>;
};

export type AppContextType = {
  state: AppState;
  login: (profile: Omit<UserProfile, 'uid'>) => void;
  logout: () => void;
  triggerSOS: () => void;
  resetSOS: () => void;
  addEvidence: (hash: string, locationStr: string) => void;
  updateLocation: (lat: number, lng: number) => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used inside an AppProvider');
  return context;
};