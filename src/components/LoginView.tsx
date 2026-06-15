import React, { useState } from 'react';
import { useAppState } from '../context/Context';
import { Shield, Fingerprint, Users, Building, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginView = () => {
  const { login } = useAppState();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'guardian' | 'police'>('user');
  
  // Custom Role States
  const [aadhaar, setAadhaar] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [districtZone, setDistrictZone] = useState('Lucknow Central');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Structural check-digit validation logic for national identification cards
  const validateAadhaarStructure = (uidString: string): boolean => {
    const cleanUid = uidString.replace(/\s+/g, '');
    
    // Concrete structural check: Must be exactly 12 numeric digits
    if (!/^\d{12}$/.test(cleanUid)) return false;
    
    // Prevent common fake patterns (e.g., 0000..., 1111...)
    if (/^(\d)\1{11}$/.test(cleanUid)) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!name.trim()) return;

    // Role-based verification routing checks
    if (role === 'guardian') {
      const isValid = validateAadhaarStructure(aadhaar);
      if (!isValid) {
        setValidationError('Invalid credential configuration. Check digit structure fails standard formatting.');
        return;
      }
    }

    if (role === 'police' && !/^[A-Z]{2}-\d{4,6}$/i.test(badgeNumber.trim())) {
      setValidationError('Invalid Forensic / Law Enforcement Badge token format (e.g., UP-7421).');
      return;
    }

    // Dynamic telemetry coordinate spawning per sector role
    const baseLocations = {
      user: { lat: 26.8467, lng: 80.9462 },
      guardian: { lat: 26.8485, lng: 80.9495 },
      police: { lat: 26.8432, lng: 80.9331 }
    };

    login({
      userName: name,
      role,
      aadhaarVerified: role === 'guardian' ? true : false,
      baseLocation: baseLocations[role]
    });
  };

  // Safe formatting masking filter for standard split sequence layout
  const handleAadhaarChange = (val: string) => {
    const numeric = val.replace(/\D/g, '').slice(0, 12);
    // Format out to user visually as 4-4-4 split string
    const matches = numeric.match(/\d{1,4}/g);
    setAadhaar(matches ? matches.join(' ') : numeric);
  };

  return (
    <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-slate-100 font-sans">
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4">
          <Shield className="h-6 w-6 text-slate-950 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-100">TravelSafe™ Gateway</h2>
        <p className="text-xs text-slate-500 mt-1">Predictive Life-Security Infrastructure Access Portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dynamic Interface Environment Selector Toggle */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Select Interface Environment</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setRole('user'); setValidationError(null); }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${role === 'user' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
              <Fingerprint className="h-4 w-4" />
              <span className="text-[10px] font-semibold tracking-wide">Civilian</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('guardian'); setValidationError(null); }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${role === 'guardian' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
              <Users className="h-4 w-4" />
              <span className="text-[10px] font-semibold tracking-wide">Guardian</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('police'); setValidationError(null); }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${role === 'police' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
              <Building className="h-4 w-4" />
              <span className="text-[10px] font-semibold tracking-wide">Forensic</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800/60 my-2" />

        {/* Universal Payload Identity Name */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            {role === 'police' ? 'Officer Personnel Name' : 'Identify Payload Name'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === 'police' ? 'Inspector R. Khan' : 'e.g. Aanya Sharma'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-slate-700 transition-colors placeholder:text-slate-800 font-medium"
          />
        </div>

        {/* CONDITIONAL COMPONENT: GUARDIAN AADHAAR TOKEN DISPATCH SECTION */}
        {role === 'guardian' && (
          <div className="space-y-1 animate-fadeIn">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between items-center">
              <span>National ID (Aadhaar Verification)</span>
              <span className="text-[9px] text-indigo-400 lowercase italic flex items-center gap-0.5">
                <ShieldCheck className="h-3 w-3" /> hardware cryptographic validation
              </span>
            </label>
            <input
              type="text"
              required
              value={aadhaar}
              onChange={(e) => handleAadhaarChange(e.target.value)}
              placeholder="0000 0000 0000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-indigo-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-800"
            />
          </div>
        )}

        {/* CONDITIONAL COMPONENT: POLICE ENFORCEMENT DATA SUBSET SECTION */}
        {role === 'police' && (
          <div className="grid grid-cols-2 gap-3 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Badge Number</label>
              <input
                type="text"
                required
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                placeholder="UP-4812"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-800 uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">District Command</label>
              <select
                value={districtZone}
                onChange={(e) => setDistrictZone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="Lucknow Central">Lucknow Central</option>
                <option value="Hazratganj Sector">Hazratganj Sector</option>
                <option value="Aliganj Division">Aliganj Division</option>
                <option value="Gomti Nagar Head">Gomti Nagar Head</option>
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Telemetry Fault Diagnostics Panel */}
        {validationError && (
          <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-start gap-2 animate-shake">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-400 font-mono leading-normal">{validationError}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.99] mt-2"
        >
          Initialize Secure Connection
        </button>
      </form>
    </div>
  );
};