import React, { useState, Suspense, lazy } from 'react';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Brain, 
  Zap, 
  Users, 
  Building2, 
  HeartHandshake, 
  ChevronRight, 
  AlertCircle,
  Stethoscope,
  TrendingUp,
  FileCheck,
  Check,
  Upload,
  Cpu,
  Eye,
  FileDown,
  Lock,
  Compass,
  Database,
  Sliders,
  Award,
  Loader2
} from 'lucide-react';
import { INSTITUTIONS, BENCHMARK_METRICS, MOCK_PATIENTS } from '../mockData';
import { FAQSection } from './FAQSection';

const Prostate3DScene = lazy(() =>
  import('./3DViewer/Prostate3DScene').then((m) => ({ default: m.Prostate3DScene }))
);

interface LandingPageProps {
  onNavigateToUpload: () => void;
  onOpenQuickDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToUpload,
  onOpenQuickDemo,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'DICOM Ingestion & Auto De-Identification',
      subtitle: 'Native PACS DICOMweb or local drag-and-drop',
      description:
        'Upload multi-parametric MRI exams (.dcm, PNG, JPG). Client-side PS 3.15 algorithms scrub all patient protected health information (PHI) before any transmission. 16-bit radiometric values and spatial matrices are preserved.',
      icon: Upload,
      tag: 'Zero PHI Leakage'
    },
    {
      step: '02',
      title: 'Multi-Modal Claude Vision VLM Reasoning',
      subtitle: 'Cross-attention across T2, DWI b-2000 & ADC',
      description:
        'Unlike black-box CNNs, Claude 3.5 Sonnet Vision reasons across anatomical T2 TSE, high b-value diffusion restriction, and quantitative ADC maps. It generates transparent clinical justifications differentiating carcinoma from BPH.',
      icon: Brain,
      tag: 'Multi-Modal Reasoning'
    },
    {
      step: '03',
      title: 'Interactive 3D Anatomical Organ Reconstruction',
      subtitle: 'Real-time Three.js spatial mapping',
      description:
        'AI detections are projected onto an interactive 3D model of the prostate capsule, peripheral zone (PZ), and transition zone (TZ). Lesions pulse with PI-RADS color-coding and dynamic axial cut planes sync directly with 2D slices.',
      icon: Layers,
      tag: 'Three.js WebGL 2.0'
    },
    {
      step: '04',
      title: 'Radiologist Validation & One-Click PDF Sign-Off',
      subtitle: 'Clinical feedback loop & official documentation',
      description:
        'Radiologists approve, modify, or reject findings, add manual ROI annotations, and generate a board-certified clinical PDF report with PI-RADS v2.1 scoring, radiomics table, and institutional letterhead.',
      icon: Award,
      tag: 'Clinical Decision Support'
    }
  ];

  const featuresList = [
    {
      title: 'Explainable VLM Diagnostic Reasoning',
      description:
        'Every lesion detection is paired with a fellowship-grade clinical explanation articulating specific signal characteristics (e.g., "Marked focal restriction on b-2000 with ADC nadir 0.64 x 10^-3 mm²/s").',
      icon: Brain,
      badge: 'Claude Vision 3.5',
      color: 'from-sky-500/20 to-indigo-500/10'
    },
    {
      title: 'Interactive 3D Anatomical Organ Model',
      description:
        'Full 360° spatial understanding. Rotate, zoom, and inspect peripheral vs transition zone lesions in relation to the urethra, capsule, and neurovascular bundles.',
      icon: Layers,
      badge: 'Three.js / WebGL',
      color: 'from-medical-500/20 to-sky-500/10'
    },
    {
      title: 'Synchronized Multi-Planar 2D MPR Viewer',
      description:
        'Inspect axial, sagittal, and coronal planes with instant sequence toggling (T2 TSE, DWI b-2000, ADC Map) and cine loop playback synchronized with 3D cutting planes.',
      icon: Eye,
      badge: 'MPR 2D Viewport',
      color: 'from-indigo-500/20 to-purple-500/10'
    },
    {
      title: 'Radiologist Feedback Loop & Active Learning',
      description:
        'Full physician autonomy: approve findings, flag false positives, adjust contours, and drop manual ROIs. Adjustments are logged to institutional audit archives.',
      icon: Stethoscope,
      badge: 'Physician In The Loop',
      color: 'from-emerald-500/20 to-teal-500/10'
    },
    {
      title: 'Hospital-Grade Clinical PDF & CSV Export',
      description:
        'Generate PI-RADS v2.1 compliant radiology reports with institutional header, patient radiomics, AI narrative, and electronic signature sign-off in seconds.',
      icon: FileDown,
      badge: 'Instant jsPDF Export',
      color: 'from-amber-500/20 to-orange-500/10'
    },
    {
      title: 'PACS DICOMweb & Zero Data Retention',
      description:
        'Built for modern radiology infrastructures. Connect via WADO-RS / QIDO-RS / STOW-RS. In-memory processing guarantees patient scans are wiped post-inference.',
      icon: Database,
      badge: 'HIPAA & BAA Covered',
      color: 'from-sky-500/20 to-cyan-500/10'
    }
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* 1. HERO SECTION WITH PROBLEM STATEMENT & PRIMARY CTA */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-medical-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">
                Next-Gen Medical Decision Support • Powered by Claude Vision
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              AI-Powered Prostate Lesion Detection{' '}
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Radiologists Can Trust
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Prostate cancer is the 2nd most common cancer in men. Radiologists spend 45-120 minutes manually reading multi-modal scans. MRI-RadAI combines explainable Vision-Language Model reasoning with interactive 3D spatial visualization—reducing turnaround time to 5-10 minutes.
            </p>

            {/* HERO CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateToUpload}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-medical-600 via-sky-500 to-indigo-600 hover:from-medical-500 hover:to-sky-400 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-sky-500/25 active:scale-95 transition-all"
              >
                <span>Upload Your MRI Now →</span>
              </button>

              <button
                onClick={onOpenQuickDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 hover:border-slate-600 flex items-center justify-center space-x-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Try the Demo (Sample Data) →</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Get instant AI-powered lesion detection in under 2 minutes • HIPAA Compliant • Zero Data Retention
            </p>
          </div>

          {/* Clinical Pain Points vs MRI-RadAI Solution */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-red-950/60 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>The Diagnostic Bottleneck Radiologists Face</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2.5">
                  <span className="text-red-400 font-bold">⏳</span>
                  <span><strong>Time Pressure:</strong> 45-120 minutes per patient analyzing T2, DWI, and ADC maps causes severe reporting backlogs.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-red-400 font-bold">🎯</span>
                  <span><strong>Inter-Rater Disagreement:</strong> Even experienced specialists disagree 15-25% of the time on subtle peripheral zone lesions.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-red-400 font-bold">❌</span>
                  <span><strong>Unnecessary Biopsies:</strong> High false positive rates subject patients to painful invasive biopsies and infection risk.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-red-400 font-bold">💭</span>
                  <span><strong>The "Black Box" Deficit:</strong> Traditional CNN AI tools flag bounding boxes without explaining <em>why</em>, destroying physician trust.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-sky-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>How MRI-RadAI Transforms The Workflow</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>Decision Support, Not Replacement:</strong> Empowers radiologists as the final authority with instant pre-screening.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>Explainable VLM Reasoning:</strong> Claude Vision explains findings in natural clinical lexicon (e.g. "Restricted diffusion typical of adenocarcinoma").</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>True 3D Spatial Context:</strong> Interactive Three.js model lets doctors rotate and inspect lesions in anatomical relation to urethra and capsule.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>80-90% Time Saved:</strong> Cuts reading and reporting turnaround from 1-2 hours down to 5-10 minutes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 border-b border-slate-800 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Clinical Pipeline Walkthrough</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How MRI-RadAI Works
            </h2>
            <p className="text-sm text-slate-300">
              From DICOM ingestion to radiologist sign-off in 4 streamlined, transparent steps.
            </p>
          </div>

          {/* Workflow Interactive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((ws, idx) => {
              const Icon = ws.icon;
              const isSelected = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-black text-sky-400/80">
                        {ws.step}
                      </span>
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                        {ws.tag}
                      </span>
                      <h3 className="font-bold text-base text-white mt-2 leading-snug">
                        {ws.title}
                      </h3>
                      <p className="text-xs text-sky-300/80 font-medium mt-1">
                        {ws.subtitle}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ws.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Clinical Step {idx + 1} of 4</span>
                    <ChevronRight className="w-4 h-4 text-sky-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* How It Works Action Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-bold text-white text-sm">See the 4-step pipeline live on a real patient scan</div>
              <p className="text-xs text-slate-300">Analyze patient PX-4092 with index PI-RADS 5 lesion in right mid-gland peripheral zone.</p>
            </div>
            <button
              onClick={onOpenQuickDemo}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shrink-0 transition-all"
            >
              <span>Test Pipeline Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. FEATURES DEEP DIVE SECTION */}
      <section id="features" className="py-20 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Medical Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Platform Features Built for Radiologists
            </h2>
            <p className="text-sm text-slate-300">
              Engineered for clinical decision accuracy, explainability, and frictionless PACS integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresList.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 space-y-4 hover:shadow-xl hover:shadow-sky-500/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 group-hover:scale-105 group-hover:border-sky-500/40 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-sky-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. INSTITUTIONS / SOCIAL PROOF TICKER */}
      <section className="py-8 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Validated against premier oncology benchmarks & research cohorts
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {INSTITUTIONS.map((inst, i) => (
              <div key={i} className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold">{inst.name}</span>
                <span className="text-[10px] text-sky-400 font-mono">({inst.badge})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BENCHMARK VALIDATION METRICS */}
      <section className="py-14 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Clinically Validated on PROSTATEx Benchmark
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Evaluated across 346 multi-parametric prostate MRI exams with histopathology-proven ground truth.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-sky-400 font-mono">89.4%</div>
              <div className="text-xs font-bold text-slate-200">Clinical Sensitivity</div>
              <p className="text-[11px] text-slate-400">Catches subtle ISUP Grade ≥ 2 lesions</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">91.2%</div>
              <div className="text-xs font-bold text-slate-200">Clinical Specificity</div>
              <p className="text-[11px] text-slate-400">Prevents false alarms and unnecessary biopsies</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono">0.941</div>
              <div className="text-xs font-bold text-slate-200">AUC-ROC Metric</div>
              <p className="text-[11px] text-slate-400">Multi-parametric discrimination accuracy</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">5-10 min</div>
              <div className="text-xs font-bold text-slate-200">Reading Turnaround</div>
              <p className="text-[11px] text-slate-400">Down from 45-120 minutes baseline</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE 3D TEASER PREVIEW */}
      <section className="py-16 border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Next-Gen Three.js Visualization</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Inspect Tumors in Full 3D Volumetric Space
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                2D slices alone make it difficult to visualize anatomical margins and distance to critical structures. MRI-RadAI projects AI detections directly onto a 3D anatomical organ model of the prostate capsule, peripheral zone (PZ), and transition zone (TZ).
              </p>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>360° rotation, pan, zoom, and crosshair localization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Synchronized axial cut plane linked to 2D slice stack</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Color-coded risk spheres (Red = PI-RADS 5, Yellow = PI-RADS 3)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenQuickDemo}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                >
                  <span>Launch 3D Workstation →</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 h-[420px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-black">
              <Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-slate-950 text-slate-400">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    <span className="text-xs font-mono">Initializing 3D Medical Volume Engine...</span>
                  </div>
                }
              >
                <Prostate3DScene
                  patient={MOCK_PATIENTS[0]}
                  selectedLesionId="lesion-1"
                  onSelectLesion={() => {}}
                  axialSliceIndex={14}
                  maxAxialSlices={28}
                  showCapsule={true}
                  showPZ={true}
                  showTZ={true}
                  showUrethra={true}
                  showSlicingPlane={true}
                  wireframe={false}
                  opacity={0.65}
                />
              </Suspense>
              <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-slate-700 pointer-events-none">
                Live Interactive Teaser
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE MRI-RadAI */}
      <section className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why Choose MRI-RadAI?
            </h2>
            <p className="text-xs text-slate-400">
              Tailored value for every stakeholder in the prostate cancer diagnostic continuum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">For Radiologists</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Saves Time:</strong> 45-120 min → 5-10 min per patient</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Improves Accuracy:</strong> VLM catches subtle multi-modal patterns</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Reduces Fatigue:</strong> Decreases cognitive overload on long shifts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Explainable:</strong> Understand <em>why</em> the AI flagged a region</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Integrates Easily:</strong> Works with existing PACS DICOMweb</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">For Hospital Systems</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Reduces Costs:</strong> Fewer missed diagnoses & malpractice liability</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Higher Throughput:</strong> Radiologists can handle 4x-6x more volume</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Hardware Cost:</strong> Cloud API or lightweight gateway</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Scalable:</strong> Compatible with 1.5T and 3.0T multi-vendor scanners</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>HIPAA Compliant:</strong> BAA covered with automated PHI de-id</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">For Patients</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Quicker Diagnosis:</strong> Results in hours instead of weeks</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Fewer Unnecessary Biopsies:</strong> High specificity stops false alarms</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Early Intervention:</strong> Detects aggressive lesions before metastasis</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Clear Visuals:</strong> 3D visuals help patients understand their diagnosis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. UNIQUE SELLING PROPOSITION (USP) */}
      <section className="py-16 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-sky-950/20 to-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unique Selling Proposition</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The Only VLM-Powered Prostate MRI Decision Support System with Explainable 3D Visualization
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto italic font-medium pt-2">
            "AI-powered lesion detection that radiologists can trust—because they can see exactly why."
          </p>
        </div>
      </section>

      {/* 9. PRICING PLANS */}
      <section className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white tracking-tight">Transparent Institutional Pricing</h2>
            <p className="text-xs text-slate-400 mt-2">
              Flexible options for independent radiology practices to enterprise multi-hospital networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="font-bold text-base text-white">Pay-Per-Scan</h3>
                <p className="text-xs text-slate-400 mt-1">For outpatient imaging centers with variable volume</p>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-white">$12</span>
                <span className="text-xs text-slate-400">/ completed study</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Full Claude Vision 3D reasoning</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Clinical PDF & CSV reports</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>HIPAA BAA agreement</span>
                </li>
              </ul>
              <button
                onClick={onNavigateToUpload}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition-all"
              >
                Start Pay-As-You-Go
              </button>
            </div>

            <div className="bg-slate-900 border border-sky-500 rounded-2xl p-6 space-y-5 relative shadow-xl shadow-sky-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                Most Popular
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Department Subscription</h3>
                <p className="text-xs text-slate-400 mt-1">For radiology departments & clinic groups</p>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-white">$1,250</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Unlimited mpMRI studies</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Up to 8 concurrent radiologist seats</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>DICOMweb PACS direct sync</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>1-hour clinician onboarding session</span>
                </li>
              </ul>
              <button
                onClick={onNavigateToUpload}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all"
              >
                Deploy Department Tier
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="font-bold text-base text-white">Enterprise Health System</h3>
                <p className="text-xs text-slate-400 mt-1">For multi-hospital academic medical systems</p>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-white">Custom</span>
                <span className="text-xs text-slate-400">/ annual SLA</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>On-premise Kubernetes appliance option</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Direct EHR (Epic / Cerner) integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dedicated 99.95% uptime SLA</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Institutional Research Export API</span>
                </li>
              </ul>
              <button
                onClick={onNavigateToUpload}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                Request Enterprise Quote
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. COMPREHENSIVE 20-ITEM FAQ SECTION */}
      <div id="faq">
        <FAQSection />
      </div>

      {/* 11. FINAL BOTTOM HIGH-CONVERTING CTA */}
      <section id="cta" className="py-20 text-center bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 relative">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ready for Clinical Evaluation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Cut Reading Turnaround to Under 10 Minutes?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Experience clinical-grade explainable lesion detection on your workstation today. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onNavigateToUpload}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-medical-600 to-sky-500 hover:from-medical-500 hover:to-sky-400 text-white font-bold text-xs shadow-xl shadow-sky-500/25 active:scale-95 transition-all"
            >
              Upload Your MRI Now →
            </button>
            <button
              onClick={onOpenQuickDemo}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Try the Demo Case →</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 font-mono pt-4">
            <span>✓ DICOM PS 3.15 De-Identification</span>
            <span>✓ 99.95% API Uptime SLA</span>
            <span>✓ Free Onboarding & CME Training</span>
          </div>
        </div>
      </section>
    </div>
  );
};
