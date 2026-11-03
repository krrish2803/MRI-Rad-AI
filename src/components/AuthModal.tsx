import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Stethoscope, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ArrowRight,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  targetAction?: 'upload' | 'demo' | 'workstation' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetAction,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [role, setRole] = useState<AuthUser['role']>('Attending Radiologist');
  const [email, setEmail] = useState('e.brooks@mayoclinic.org');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Dr. Eleanor Brooks, MD');
  const [institution, setInstitution] = useState('Mayo Clinic Comprehensive Cancer Center');
  const [npiNumber, setNpiNumber] = useState('1849204912');
  const [agreeHipaa, setAgreeHipaa] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickDemoLogin = () => {
    const demoRadiologist: AuthUser = {
      id: 'usr-demo-01',
      name: 'Dr. Eleanor Brooks, MD',
      email: 'e.brooks@mayoclinic.org',
      role: 'Attending Radiologist',
      institution: 'Mayo Clinic Radiogenomics Center',
      npiNumber: '1849204912',
    };
    onSuccess(demoRadiologist);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeHipaa) {
      setError('You must confirm HIPAA clinical data authorization to proceed.');
      return;
    }
    setError(null);

    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      name: name || 'Authorized Clinician',
      email: email || 'clinician@hospital.org',
      role,
      institution: institution || 'Diagnostic Radiology Group',
      npiNumber: npiNumber || '1000000000',
    };

    onSuccess(user);
  };

  const getActionHeading = () => {
    if (targetAction === 'upload') {
      return 'Authenticate to Ingest MRI Scans';
    }
    if (targetAction === 'demo') {
      return 'Clinical Sign-In to Access 3D Demo Case';
    }
    return 'Clinical Authentication Required';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-sky-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HIPAA Verified • PACS Access Gateway</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {getActionHeading()}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Access to multi-parametric patient volumes requires verified physician or authorized researcher credentials.
          </p>
        </div>

        {/* 1-Click Radiologist Quick Login Banner */}
        <div className="px-6 pt-5 pb-2">
          <div className="bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-slate-950 border border-sky-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs font-bold text-sky-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Instant 1-Click Radiologist Login</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Sign in as <strong>Dr. Eleanor Brooks, MD</strong> (Mayo Clinic)
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-medical-600 to-sky-500 hover:from-medical-500 hover:to-sky-400 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              Demo Sign In →
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 flex border-b border-slate-800 text-xs">
          <button
            onClick={() => setAuthMode('signin')}
            className={`pb-2.5 font-bold transition-all mr-6 border-b-2 ${
              authMode === 'signin'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Clinical Sign In
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`pb-2.5 font-bold transition-all border-b-2 ${
              authMode === 'register'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Register Institution / NPI
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-red-950/80 border border-red-500/50 text-red-200 p-3 rounded-xl flex items-center space-x-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
              <span>Clinical Role:</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-xs"
            >
              <option value="Attending Radiologist">Attending Radiologist (ABR / FRCR)</option>
              <option value="Radiology Fellow">Abdominal / Body MRI Fellow</option>
              <option value="Urological Oncologist">Urological Oncologist</option>
              <option value="PACS Administrator">Hospital PACS Administrator</option>
              <option value="Guest Clinical Evaluator">Clinical Trial Evaluator (Guest)</option>
            </select>
          </div>

          {authMode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Clinician Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Brooks, MD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">NPI Identifier:</label>
                <input
                  type="text"
                  value={npiNumber}
                  onChange={(e) => setNpiNumber(e.target.value)}
                  placeholder="10-digit NPI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* Email / ID */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Hospital Email or PACS Account ID:</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="radiologist@hospital.org"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span>Password / 2FA Token:</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* HIPAA BAA Agreement Checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeHipaa}
                onChange={(e) => setAgreeHipaa(e.target.checked)}
                className="mt-0.5 rounded border-slate-800 text-sky-500 accent-sky-500 focus:ring-0"
              />
              <span className="leading-tight">
                I verify that I am an authorized medical clinician or investigator acting under institutional HIPAA and BAA protocols for de-identified MRI studies.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-medical-600 to-sky-500 hover:from-medical-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 active:scale-98 transition-all pt-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {authMode === 'signin' ? 'Verify Credentials & Open Workstation' : 'Register Clinical Account'}
            </span>
          </button>
        </form>

        <div className="px-6 pb-5 text-center text-[10px] text-slate-400">
          Encrypted with 256-bit TLS 1.3 • Audit trail logged to institutional PACS
        </div>
      </div>
    </div>
  );
};
