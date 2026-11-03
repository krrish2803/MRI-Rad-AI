import React from 'react';
import { ShieldCheck, Lock, FileCode, ExternalLink, HeartPulse, Building2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-5 h-5 text-sky-400" />
              <span className="font-bold text-slate-100 text-sm tracking-tight">MRI-RadAI Medical Platform</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Clinical decision-support system utilizing Claude Vision VLM multi-modal reasoning and interactive 3D spatial reconstruction for prostate mpMRI lesion detection.
            </p>
            <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HIPAA Compliant • BAA Covered</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Clinical Specs</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="text-slate-300">PI-RADS® v2.1 Guideline Adherent</li>
              <li className="text-slate-300">Multi-modal T2, DWI b-2000 & ADC Analysis</li>
              <li className="text-slate-300">PROSTATEx Benchmark Validated (AUC 0.94)</li>
              <li className="text-slate-300">3D Interactive Spatial Mesh (Three.js)</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Integrations</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="text-slate-300">DICOMweb & WADO-RS / QIDO-RS</li>
              <li className="text-slate-300">HL7 / FHIR Clinical Messaging</li>
              <li className="text-slate-300">Cornerstone.js Medical Viewport</li>
              <li className="text-slate-300">Enterprise Cloud or On-Premise Gateway</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Security & Regulatory</h4>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-slate-200 font-semibold">
                <Lock className="w-3 h-3 text-sky-400" />
                <span>Zero Data Retention Policy</span>
              </div>
              <p className="leading-normal">
                Scans are de-identified client-side before transmission. In-flight data encrypted via TLS 1.3 and discarded immediately after inference unless archived by institution.
              </p>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="mt-8 pt-6 border-t border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-300">
          <p className="max-w-3xl leading-relaxed">
            <span className="font-bold text-amber-400/90">FDA Investigational Device & CE Mark Notice:</span> MRI-RadAI is engineered as a computer-aided decision support instrument for qualified radiologist review. It is not an autonomous primary diagnostic device. All clinical biopsy directives and medical actions require verification by a board-certified physician.
          </p>
          <div className="shrink-0 text-right font-mono">
            © 2026 MRI-RadAI Systems Inc.
          </div>
        </div>
      </div>
    </footer>
  );
};
