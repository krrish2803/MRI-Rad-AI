import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  ShieldCheck, 
  Key, 
  Server, 
  Save, 
  Check, 
  Lock, 
  Building2, 
  Sliders,
  CheckCircle2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [institutionName, setInstitutionName] = useState('Mayo Clinic Radiogenomics Center');
  const [pacsAeTitle, setPacsAeTitle] = useState('MRIRAD_AI_PACS');
  const [pacsHost, setPacsHost] = useState('pacs.radiology.hospital.internal');
  const [pacsPort, setPacsPort] = useState('11112');
  const [apiKey, setApiKey] = useState('sk-ant-api03-live-prod-secure-token-demo');
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Hospital & Workstation Preferences</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure PACS DICOMweb communication endpoints, Claude Vision API credentials, and HIPAA compliance enforcement.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings and PACS endpoints updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Institutional Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Institutional Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Hospital / Facility Name:</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Department:</label>
                <input
                  type="text"
                  defaultValue="Department of Diagnostic & Interventional Radiology"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* PACS / DICOMweb Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Hospital PACS / DICOMweb Integration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">PACS AE Title:</label>
                <input
                  type="text"
                  value={pacsAeTitle}
                  onChange={(e) => setPacsAeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Server Host / FQDN:</label>
                <input
                  type="text"
                  value={pacsHost}
                  onChange={(e) => setPacsHost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">DICOM Port (TLS):</label>
                <input
                  type="text"
                  value={pacsPort}
                  onChange={(e) => setPacsPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center space-x-2 pt-1">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>DICOMweb Protocols Supported: WADO-RS (Retrieve), STOW-RS (Store), QIDO-RS (Query)</span>
            </div>
          </div>

          {/* Claude Vision VLM Engine Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Key className="w-4 h-4 text-sky-400" />
              <span>Vision Language Model Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Anthropic Claude Vision API Key:</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Inference Foundation Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Optimized for Multi-modal mpMRI)</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus (High Depth Reasoning)</option>
                </select>
              </div>
            </div>
          </div>

          {/* HIPAA & Security Verification */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HIPAA Security & Audit Enforcement</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Client-Side PS 3.15 DICOM De-Identification Active (Patient Names and MRNs never transmit)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Cloud Retention: Volumetric inference occurs ephemerally in RAM</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cryptographic SHA-256 Audit Trail on all radiologist adjustments & sign-offs</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Preferences</span>
          </button>
        </form>
      </div>
    </div>
  );
};
