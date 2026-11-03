import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileCheck, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  Database,
  ArrowRight,
  FileText
} from 'lucide-react';
import { PatientCase } from '../types';
import { MOCK_PATIENTS } from '../mockData';

interface UploadPageProps {
  onAnalysisComplete: (patient: PatientCase) => void;
  onSelectSampleCase: (patient: PatientCase) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onAnalysisComplete,
  onSelectSampleCase,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('PX-4092');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisSteps = [
    'Parsing DICOM headers & validating multi-frame sequence...',
    'Applying client-side HIPAA de-identification (PS 3.15 profile)...',
    'Registering multi-modal T2, DWI b-2000, and ADC channels...',
    'Executing Claude 3.5 Sonnet Vision VLM multi-modal reasoning...',
    'Synthesizing 3D anatomical coordinates & PI-RADS v2.1 scoring...'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      // DICOM fallback preview
      setPreviewUrl(null);
    }
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(() => {
            setIsAnalyzing(false);
            // Return selected case
            const matchedCase = MOCK_PATIENTS.find((c) => c.id === selectedPresetId) || MOCK_PATIENTS[0];
            onAnalysisComplete(matchedCase);
          }, 800);
          return prev;
        }
      });
    }, 900);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Upload className="w-3.5 h-3.5" />
            <span>DICOM & Image Ingestion</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Upload Prostate MRI Scan
          </h1>
          <p className="mt-2 text-slate-300 text-sm">
            Drag & drop raw DICOM multi-frame volumes or standard radiological scans for instant Claude Vision VLM multi-modal analysis.
          </p>
        </div>

        {/* Quick Sample Benchmark Presets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Or Choose a Pre-Loaded PROSTATEx Clinical Case:</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Expert Annotated Cohort</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {MOCK_PATIENTS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPresetId(p.id);
                    onSelectSampleCase(p);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{p.id}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.primaryRisk === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : p.primaryRisk === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      PI-RADS {p.primaryPirads}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    PSA: {p.psaLevel} • {p.age}yo
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-1">
                    {p.lesions[0]?.zone.split('-')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Upload Dropzone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dropzone Column */}
          <div className="md:col-span-2 space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px] ${
                dragActive
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".dcm,.dicom,image/png,image/jpeg,image/webp"
                onChange={handleChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-105 transition-transform">
                <Upload className="w-8 h-8" />
              </div>

              <h3 className="font-bold text-base text-white">
                Drag & drop your MRI scan files here
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports DICOM (.dcm), axial T2 TSE, DWI b-2000, ADC maps, or medical PNG/JPG volumes (Up to 50MB per series).
              </p>

              <button
                type="button"
                className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Browse Local Files
              </button>

              {selectedFile && (
                <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
                  <FileCheck className="w-4 h-4" />
                  <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* HIPAA Statement Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Automatic client-side de-identification removes Patient Names & MRNs prior to processing.
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase shrink-0">
                HIPAA Safe
              </span>
            </div>
          </div>

          {/* Metadata & Sequence Extraction Preview */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <span>Extracted DICOM Metadata</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">16-bit Depth</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Modality:</span>
                    <span className="text-white font-medium">MR (Multi-parametric)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Magnetic Field:</span>
                    <span className="text-white font-medium">3.0 Tesla</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Slice Thickness:</span>
                    <span className="text-white font-medium">3.0 mm</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Matrix Size:</span>
                    <span className="text-white font-medium">384 × 384</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sequences Found:</span>
                    <span className="text-sky-300 font-medium">T2, DWI (b2000), ADC</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300">Anatomical Target:</div>
                  <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    Prostate Gland & Seminal Vesicles (Pelvis Protocol)
                  </div>
                </div>
              </div>

              {/* Primary Analyze CTA */}
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-medical-600 via-sky-500 to-indigo-600 hover:from-medical-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 active:scale-98 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Scan with Claude...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Analyze with Claude Vision VLM →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis In-Progress Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="font-bold text-lg text-white">Analyzing Prostate mpMRI Scan</h3>
              <p className="text-xs text-slate-400">
                Claude Vision VLM is extracting multi-parametric radiomics and spatial lesion coordinates...
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3">
              {analysisSteps.map((step, idx) => {
                const isCurrent = idx === analysisStep;
                const isDone = idx < analysisStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-start space-x-2.5 text-xs transition-opacity duration-300 ${
                      isDone ? 'text-emerald-400' : isCurrent ? 'text-white font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0 mt-0.5" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
