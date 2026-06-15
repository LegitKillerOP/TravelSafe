import { useAppState } from '../context/Context';
import { Shield, Clipboard, HardDrive } from 'lucide-react';

export const PoliceVaultDashboard = () => {
  const { state } = useAppState();
  const topLog = state.evidenceLogs[0];

  return (
    <div className="mx-auto max-w-6xl p-6 text-slate-100 font-sans min-h-[85vh]">
      {/* Page Header */}
      <div className="flex items-center gap-3.5 mb-8 border-b border-slate-900 pb-5">
        <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/10">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Shadow Witness™ Decentralized Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable Forensic Archive Ledger • Government & Courtroom Ready Evidence Packages</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Real-time Streaming Cryptographic Log Panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-emerald-400" /> Cryptographic Evidence Log Ledger
              </h3>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">Nodes Synchronized</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-900 text-slate-500">
                    <th className="p-4 font-semibold text-[10px] uppercase">Incident Ref</th>
                    <th className="p-4 font-semibold text-[10px] uppercase">Timestamp</th>
                    <th className="p-4 font-semibold text-[10px] uppercase">GPS Coordinate Anchor</th>
                    <th className="p-4 font-semibold text-[10px] uppercase">SHA-256 Ledger Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {state.evidenceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-600 italic">
                        Awaiting incident trigger activation coordinates... No packets cached.
                      </td>
                    </tr>
                  ) : (
                    state.evidenceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 text-slate-300 font-bold">{log.id}</td>
                        <td className="p-4 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="p-4 text-cyan-400 font-bold">{log.location}</td>
                        <td className="p-4 text-emerald-400 font-bold tracking-tight text-[11px]">{log.hash.slice(0, 16)}...</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dynamic Auto-FIR Automation Panel */}
        <div className="space-y-5">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-900 pb-3">
              <Clipboard className="h-4 w-4 text-cyan-400" /> Automated FIR Document
            </h3>

            {topLog ? (
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl font-mono text-[11px] text-slate-400 space-y-3 leading-relaxed">
                <div className="text-center border-b border-slate-900 pb-2 font-bold text-slate-200 text-xs">
                  COMPLIANT ACCORDING TO SEC 154 CrPC
                </div>
                <p><span className="text-slate-600 block text-[9px] uppercase">Incident Token</span> <span className="text-slate-200 font-bold">{topLog.id}</span></p>
                <p><span className="text-slate-600 block text-[9px] uppercase">Time Registered</span> <span className="text-slate-300">{new Date(topLog.timestamp).toISOString()}</span></p>
                <p><span className="text-slate-600 block text-[9px] uppercase">Geo Location Payload</span> <span className="text-cyan-400 font-bold">{topLog.location}</span></p>
                <div>
                  <span className="text-slate-600 block text-[9px] uppercase">Immutable Cryptographic Proof Hash</span>
                  <span className="text-emerald-400 break-all block mt-0.5 border border-emerald-950 bg-emerald-950/20 p-2 rounded text-[10px] leading-normal">{topLog.hash}</span>
                </div>
                <div className="pt-2 text-[10px] text-slate-500 italic border-t border-slate-900 text-center">
                  Packets sealed securely. Courtroom audit verification chain intact.
                </div>
              </div>
            ) : (
              <div className="text-slate-600 text-xs font-mono italic text-center py-12">
                System standing by. Trigger emergency to stream structured compliance report.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};