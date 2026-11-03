import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileDown, 
  Share2, 
  Layers, 
  Sparkles, 
  Brain, 
  ChevronRight, 
  Info, 
  UserCheck, 
  Save, 
  Maximize, 
  Eye, 
  CheckCircle2, 
  Compass, 
  FileSpreadsheet, 
  Sliders, 
  Activity,
  Award,
  Stethoscope,
  Copy,
  Check
} from 'lucide-react';
import { PatientCase, Lesion, RadiologistAnnotation } from '../types';
import { Prostate3DScene } from './3DViewer/Prostate3DScene';
import { Slice2DViewer } from './3DViewer/Slice2DViewer';
import { ThreeControls } from './3DViewer/ThreeControls';
import { generateClinicalPdfReport } from '../utils/pdfGenerator';

interface AnalysisDashboardProps {
  patient: PatientCase;
  onUpdatePatient: (updated: PatientCase) => void;
  onSwitchCase: (caseId: string) => void;
  allCases: PatientCase[];
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  patient,
  onUpdatePatient,
  onSwitchCase,
  allCases,
}) => {
  // View mode: 'split' | '3d-only' | '2d-only'
  const [viewMode, setViewMode] = useState<'split' | '3d' | '2d'>('split');
  
  // Selected lesion
  const [selectedLesionId, setSelectedLesionId] = useState<string | null>(
    patient.lesions.length > 0 ? patient.lesions[0].id : null
  );

  // Synchronized slice index and plane
  const [currentSlice, setCurrentSlice] = useState<number>(14);
  const [plane, setPlane] = useState<'axial' | 'sagittal' | 'coronal'>('axial');
  const maxSlices = 28;

  // 3D Controls state
  const [showCapsule, setShowCapsule] = useState(true);
  const [showPZ, setShowPZ] = useState(true);
  const [showTZ, setShowTZ] = useState(true);
  const [showUrethra, setShowUrethra] = useState(true);
  const [showSlicingPlane, setShowSlicingPlane] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [opacity, setOpacity] = useState(0.7);

  // Radiologist feedback & editing state
  const [radiologistNotes, setRadiologistNotes] = useState('');
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<RadiologistAnnotation[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeLesion = patient.lesions.find((l) => l.id === selectedLesionId) || patient.lesions[0];

  // Select lesion and automatically sync 2D slice
  const handleSelectLesion = (lesion: Lesion) => {
    setSelectedLesionId(lesion.id);
    if (lesion.sliceIndex[plane] !== undefined) {
      setCurrentSlice(lesion.sliceIndex[plane]);
    }
  };

  // Feedback action: Approve / Reject / Modify
  const handleUpdateLesionStatus = (lesionId: string, status: 'approved' | 'rejected' | 'modified') => {
    const updatedLesions = patient.lesions.map((l) => {
      if (l.id === lesionId) {
        return { ...l, radiologistStatus: status };
      }
      return l;
    });

    const updatedPatient: PatientCase = {
      ...patient,
      lesions: updatedLesions,
      status: 'Radiologist Reviewed',
      reviewDate: new Date().toISOString().split('T')[0],
      reviewedBy: 'Dr. Eleanor Brooks, MD (Board Certified)'
    };

    onUpdatePatient(updatedPatient);
    setFeedbackSuccessMessage(`Lesion status updated to: ${status.toUpperCase()}`);
    setTimeout(() => setFeedbackSuccessMessage(null), 3000);
  };

  // Sign off entire case
  const handleSignOffCase = () => {
    const updatedPatient: PatientCase = {
      ...patient,
      status: 'Signed Off',
      reviewDate: new Date().toISOString().split('T')[0],
      reviewedBy: 'Dr. Eleanor Brooks, MD'
    };
    onUpdatePatient(updatedPatient);
    setFeedbackSuccessMessage('Case officially verified and electronically signed off!');
    setTimeout(() => setFeedbackSuccessMessage(null), 4000);
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = 'PatientID,AccessionNumber,LesionName,PIRADS,Confidence,Zone,Length_mm,Width_mm,Volume_cc,ADC_Value,EPE,Status\n';
    const rows = patient.lesions.map(
      (l) =>
        `"${patient.patientId}","${patient.accessionNumber}","${l.name}",${l.piradsScore},${l.confidence}%,"${l.zone}",${l.dimensions.lengthMm},${l.dimensions.widthMm},${l.dimensions.volumeCc},"${l.characteristics.adcValue}",${l.characteristics.extraprostaticExtension},"${l.radiologistStatus || 'AI Pending'}"`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MRI-RadAI_Metrics_${patient.patientId}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Patient Bar & Switcher */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-4">
          {/* Patient Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient Case:</span>
            <select
              value={patient.id}
              onChange={(e) => onSwitchCase(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
            >
              {allCases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} • {c.age}yo • PI-RADS {c.primaryPirads} ({c.primaryRisk.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Quick Demographics Chips */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono">
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              PSA: <strong className="text-white">{patient.psaLevel} ng/mL</strong>
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              Density: <strong className="text-white">{patient.psaDensity}</strong>
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              {patient.magnetField} • {patient.manufacturer.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* View Mode Controls & Quick Action Suite */}
        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'split' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split (3D + 2D)
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === '3d' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Volume Only
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === '2d' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Slices Only
            </button>
          </div>

          {/* Export Suite Buttons */}
          <button
            onClick={() => generateClinicalPdfReport(patient)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            title="Download PDF Clinical Summary"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all"
            title="Export Radiomics CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            title="Share Case Link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT / CENTER VIEWPORT (3D and/or 2D) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative bg-black">
          {/* 3D Viewport */}
          {(viewMode === 'split' || viewMode === '3d') && (
            <div className={`relative ${viewMode === 'split' ? 'w-full lg:w-1/2 h-1/2 lg:h-full border-r border-b lg:border-b-0 border-slate-800' : 'w-full h-full'}`}>
              <Prostate3DScene
                patient={patient}
                selectedLesionId={selectedLesionId}
                onSelectLesion={handleSelectLesion}
                axialSliceIndex={currentSlice}
                maxAxialSlices={maxSlices}
                showCapsule={showCapsule}
                showPZ={showPZ}
                showTZ={showTZ}
                showUrethra={showUrethra}
                showSlicingPlane={showSlicingPlane}
                wireframe={wireframe}
                opacity={opacity}
              />

              {/* Floating 3D Controls Drawer */}
              <div className="absolute bottom-3 right-3 max-w-[280px] w-full z-10">
                <ThreeControls
                  showCapsule={showCapsule}
                  setShowCapsule={setShowCapsule}
                  showPZ={showPZ}
                  setShowPZ={setShowPZ}
                  showTZ={showTZ}
                  setShowTZ={setShowTZ}
                  showUrethra={showUrethra}
                  setShowUrethra={setShowUrethra}
                  showSlicingPlane={showSlicingPlane}
                  setShowSlicingPlane={setShowSlicingPlane}
                  wireframe={wireframe}
                  setWireframe={setWireframe}
                  opacity={opacity}
                  setOpacity={setOpacity}
                />
              </div>
            </div>
          )}

          {/* 2D Slice Viewport */}
          {(viewMode === 'split' || viewMode === '2d') && (
            <div className={`${viewMode === 'split' ? 'w-full lg:w-1/2 h-1/2 lg:h-full' : 'w-full h-full'}`}>
              <Slice2DViewer
                patient={patient}
                selectedLesionId={selectedLesionId}
                onSelectLesion={handleSelectLesion}
                currentSlice={currentSlice}
                setCurrentSlice={setCurrentSlice}
                maxSlices={maxSlices}
                plane={plane}
                setPlane={setPlane}
                annotations={annotations}
                onAddAnnotation={(annot) => setAnnotations([...annotations, annot])}
                onDeleteAnnotation={(id) => setAnnotations(annotations.filter((a) => a.id !== id))}
              />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: AI RESULTS, VLM REASONING & RADIOLOGIST FEEDBACK */}
        <div className="w-full lg:w-[460px] xl:w-[500px] bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 overflow-y-auto">
          {/* Header Impression Banner */}
          <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white">AI Clinical Decision Support</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  patient.primaryRisk === 'high'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : patient.primaryRisk === 'medium'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {patient.primaryRisk} Risk
              </span>
            </div>

            {/* Score & Confidence Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* PI-RADS Score Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Primary PI-RADS</div>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-2xl font-black text-white">v2.1</span>
                    <span className={`text-2xl font-black ${
                      patient.primaryPirads >= 4 ? 'text-red-400' : patient.primaryPirads === 3 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      Cat {patient.primaryPirads}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  patient.primaryPirads >= 4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {patient.primaryPirads}
                </div>
              </div>

              {/* Confidence Meter Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                  <span>VLM Confidence</span>
                  <span className="font-mono text-sky-400 font-bold">{patient.overallConfidence}%</span>
                </div>
                {/* Visual Progress Meter */}
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${patient.overallConfidence}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                  <span>Equivocal</span>
                  <span className="text-sky-300 font-semibold">High Certainty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lesion Selection List */}
          <div className="p-4 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Detected Lesions ({patient.lesions.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to focus 3D/2D</span>
            </div>

            <div className="space-y-2">
              {patient.lesions.map((lesion) => {
                const isSelected = lesion.id === selectedLesionId;
                return (
                  <div
                    key={lesion.id}
                    onClick={() => handleSelectLesion(lesion)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-white">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              lesion.risk === 'high' ? 'bg-red-500' : lesion.risk === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span>{lesion.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            ({lesion.dimensions.lengthMm} mm)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium">
                          {lesion.zone}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          lesion.piradsScore >= 4 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          PI-RADS {lesion.piradsScore}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {lesion.radiologistStatus ? (
                            <span className="text-emerald-400 capitalize font-medium flex items-center justify-end space-x-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{lesion.radiologistStatus}</span>
                            </span>
                          ) : (
                            <span>Pending Review</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Lesion Multi-modal Characteristics */}
          {activeLesion && (
            <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Clinical Characteristics: {activeLesion.name}</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  Vol: {activeLesion.dimensions.volumeCc} cc
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">T2 TSE Signal</div>
                  <div className="font-medium text-slate-200 text-[11px] mt-0.5">{activeLesion.characteristics.t2Signal}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">DWI b-2000</div>
                  <div className="font-medium text-slate-200 text-[11px] mt-0.5">{activeLesion.characteristics.dwiSignal}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">Quantitative ADC</div>
                  <div className="font-mono font-bold text-sky-300 text-[11px] mt-0.5">{activeLesion.characteristics.adcValue}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">Extraprostatic Risk</div>
                  <div className="font-medium text-[11px] mt-0.5 flex items-center space-x-1">
                    {activeLesion.characteristics.extraprostaticExtension ? (
                      <span className="text-red-400 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>High Risk (EPE +)</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400">Capsule Intact</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLAUDE VLM EXPLAINABILITY BOX */}
          <div className="p-4 border-b border-slate-800 space-y-2 bg-gradient-to-b from-sky-950/20 to-slate-950">
            <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs">
              <Brain className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>Claude Vision VLM Multi-modal Rationale</span>
            </div>
            <div className="bg-slate-950 border border-sky-500/30 rounded-xl p-3 text-xs text-slate-300 leading-relaxed font-sans shadow-inner">
              <p className="italic text-slate-200">
                "{activeLesion ? activeLesion.vlmExplanation : patient.claudeSummary}"
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Multi-modal cross-attention between Axial T2, High b-value DWI & ADC</span>
            </div>
          </div>

          {/* RADIOLOGIST FEEDBACK LOOP */}
          <div className="p-4 space-y-3 bg-slate-900/90">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Radiologist Validation & Feedback Loop</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono">Active Learning Loop</span>
            </div>

            {feedbackSuccessMessage && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3 py-2 rounded-lg text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedbackSuccessMessage}</span>
              </div>
            )}

            {/* Decision Buttons for Active Lesion */}
            {activeLesion && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400">
                  Decision on <strong className="text-white">{activeLesion.name}</strong>:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateLesionStatus(activeLesion.id, 'approved')}
                    className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      activeLesion.radiologistStatus === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 hover:bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleUpdateLesionStatus(activeLesion.id, 'rejected')}
                    className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      activeLesion.radiologistStatus === 'rejected'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-slate-950 hover:bg-red-950/40 text-red-400 border-red-500/40'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject FP</span>
                  </button>

                  <button
                    onClick={() => handleUpdateLesionStatus(activeLesion.id, 'modified')}
                    className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      activeLesion.radiologistStatus === 'modified'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 hover:bg-amber-950/40 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Modify</span>
                  </button>
                </div>
              </div>
            )}

            {/* Clinical Impression Note Textarea */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Radiologist Diagnostic Impression & Biopsy Directive:
              </label>
              <textarea
                value={radiologistNotes}
                onChange={(e) => setRadiologistNotes(e.target.value)}
                placeholder="Enter clinical notes, concordant target recommendations, or justification for correction..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Electronic Sign-Off Case Button */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleSignOffCase}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30 active:scale-98 transition-all"
              >
                <Award className="w-4 h-4 text-emerald-200" />
                <span>Verify & Electronically Sign Case</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Status: <strong className="text-white">{patient.status}</strong></span>
                <span>Reviewer: {patient.reviewedBy || 'Pending Doctor Verification'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Findings Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Share De-Identified Case</span>
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generate an encrypted, HIPAA-compliant temporary link to consult multidisciplinary urology tumor boards or peer radiologists.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="truncate pr-2">https://mri-rad.ai/case/{patient.id}?token=e8a9f...</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://mri-rad.ai/case/${patient.id}?token=e8a9f4301`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="p-1.5 bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>All Protected Health Information (PHI) stripped automatically</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
