import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileDown, 
  TrendingUp, 
  ArrowUpRight,
  Database,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { PatientCase } from '../types';
import { generateClinicalPdfReport } from '../utils/pdfGenerator';

interface DashboardOverviewProps {
  cases: PatientCase[];
  onSelectCase: (c: PatientCase) => void;
  onNavigateToUpload: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  cases,
  onSelectCase,
  onNavigateToUpload,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.patientId.toLowerCase().includes(search.toLowerCase()) ||
      c.accessionNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || c.primaryRisk === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const highRiskCount = cases.filter((c) => c.primaryRisk === 'high').length;
  const signedOffCount = cases.filter((c) => c.status === 'Signed Off').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Radiology PACS Worklist & Case Archive
              </h1>
              <span className="text-[11px] font-mono bg-medical-500/10 text-sky-400 border border-medical-500/30 px-2 py-0.5 rounded-full">
                DICOMweb Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time multi-parametric prostate MRI clinical reading queue and AI decision support analytics.
            </p>
          </div>

          <button
            onClick={onNavigateToUpload}
            className="self-start md:self-auto px-4 py-2 bg-gradient-to-r from-medical-600 to-sky-500 hover:from-medical-500 hover:to-sky-400 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
          >
            + Ingest New MRI Study
          </button>
        </div>

        {/* Institutional Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Average Turnaround Time</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">4.8 min</span>
              <span className="text-xs text-emerald-400 font-medium">92% faster</span>
            </div>
            <p className="text-[11px] text-slate-400">Baseline reading: 45-120 minutes</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>High-Risk Findings</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-red-400">{highRiskCount} cases</span>
              <span className="text-xs text-slate-400">PI-RADS 4-5</span>
            </div>
            <p className="text-[11px] text-slate-400">Prioritized for immediate biopsy review</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Radiologist Concordance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-400">94.2%</span>
              <span className="text-xs text-emerald-400 font-medium">Cohen κ 0.88</span>
            </div>
            <p className="text-[11px] text-slate-400">High agreement on index lesions</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Cases Signed Off</span>
              <Stethoscope className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{signedOffCount}</span>
              <span className="text-xs text-slate-400">of {cases.length} studies</span>
            </div>
            <p className="text-[11px] text-slate-400">Stored in DICOM archive with audit trail</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Patient ID, Accession #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <span className="text-slate-400 px-2 font-semibold">Status:</span>
              {['all', 'AI Analyzed', 'Radiologist Reviewed', 'Signed Off'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === s ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <span className="text-slate-400 px-2 font-semibold">Risk:</span>
              {['all', 'high', 'medium', 'low'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    riskFilter === r ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patient Worklist Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Patient / Accession</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">PSA / Density</th>
                  <th className="py-3 px-4">Hardware</th>
                  <th className="py-3 px-4">Primary PI-RADS</th>
                  <th className="py-3 px-4">Risk Category</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-white text-sm">{c.patientId}</div>
                      <div className="text-[11px] text-slate-400">{c.accessionNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{c.age} yo • {c.gender}</div>
                      <div className="text-[11px] text-slate-400">{c.scanDate}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-white font-semibold">{c.psaLevel} ng/mL</div>
                      <div className="text-[11px] text-slate-400">PSAD: {c.psaDensity}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{c.magnetField}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{c.manufacturer.split(' ')[0]}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-1 rounded font-bold text-xs ${
                        c.primaryPirads >= 4 ? 'bg-red-500/20 text-red-400' : c.primaryPirads === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        Score {c.primaryPirads}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`capitalize font-semibold ${
                        c.primaryRisk === 'high' ? 'text-red-400' : c.primaryRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {c.primaryRisk} Risk
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        c.status === 'Signed Off'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : c.status === 'Radiologist Reviewed'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectCase(c)}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/30 transition-all font-semibold"
                      >
                        Open 3D
                      </button>
                      <button
                        onClick={() => generateClinicalPdfReport(c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
                        title="Download PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
