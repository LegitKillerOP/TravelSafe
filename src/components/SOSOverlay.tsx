import { useAppState } from '../context/Context';

export const SOSOverlay = () => {
  const { state } = useAppState();

  if (state.safetyTimer === null) return null;

  return (
    <div className="fixed top-4 right-4 z-[10000] bg-red-950/90 border-2 border-red-500 px-4 py-3 rounded-2xl flex items-center gap-3 animate-bounce shadow-2xl backdrop-blur-md">
      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
      <div className="font-mono text-xs">
        <span className="text-red-400 font-bold uppercase tracking-wider block">SOS Broadcast Streamed</span>
        <span className="text-slate-300 font-semibold text-[10px]">Elapsed Grid Duration: {state.safetyDuration}</span>
      </div>
    </div>
  );
};