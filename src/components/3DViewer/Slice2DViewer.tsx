import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Crosshair, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Sliders, 
  Edit3, 
  Trash2, 
  PlusCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { Lesion, PatientCase, RadiologistAnnotation } from '../../types';

interface Slice2DViewerProps {
  patient: PatientCase;
  selectedLesionId: string | null;
  onSelectLesion: (lesion: Lesion) => void;
  currentSlice: number;
  setCurrentSlice: React.Dispatch<React.SetStateAction<number>>;
  maxSlices: number;
  plane: 'axial' | 'sagittal' | 'coronal';
  setPlane: (plane: 'axial' | 'sagittal' | 'coronal') => void;
  annotations: RadiologistAnnotation[];
  onAddAnnotation: (annotation: RadiologistAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const Slice2DViewer: React.FC<Slice2DViewerProps> = ({
  patient,
  selectedLesionId,
  onSelectLesion,
  currentSlice,
  setCurrentSlice,
  maxSlices,
  plane,
  setPlane,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation
}) => {
  const [activeSeries, setActiveSeries] = useState<'T2' | 'DWI' | 'ADC' | 'TRIVIEW'>('T2');
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(8);
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [windowLevel, setWindowLevel] = useState<'standard' | 'high_contrast' | 'invert'>('standard');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAnnotating, setIsAnnotating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play cine loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlice((prev) => (prev + 1) % maxSlices);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fps, maxSlices, setCurrentSlice]);

  // Render procedural medical slice canvas for realistic clinical rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Save context for zoom/pan
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    // Synthetic high-fidelity MRI slice generation based on series & slice position
    const sliceRatio = currentSlice / (maxSlices - 1);
    const glandRadius = Math.sin(sliceRatio * Math.PI) * (width * 0.28) + 20;

    // 1. Prostate Gland Parenchyma background
    const centerX = width / 2;
    const centerY = height / 2;

    if (glandRadius > 15) {
      // Pelvic outer body contour
      ctx.fillStyle = activeSeries === 'ADC' ? '#182030' : '#0f172a';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, width * 0.44, height * 0.40, 0, 0, Math.PI * 2);
      ctx.fill();

      // Prostate Capsule & Peripheral Zone
      const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, glandRadius);
      if (activeSeries === 'T2') {
        grad.addColorStop(0, '#222f3e'); // Transition zone
        grad.addColorStop(0.7, '#34495e'); // Peripheral zone brighter
        grad.addColorStop(0.95, '#1e272e'); // Capsule rim
        grad.addColorStop(1, '#0b101b');
      } else if (activeSeries === 'DWI') {
        // DWI background is dark, benign tissue is suppressed
        grad.addColorStop(0, '#10141e');
        grad.addColorStop(0.8, '#151d2a');
        grad.addColorStop(1, '#05080f');
      } else {
        // ADC: benign parenchyma is bright, restricted tumor is dark
        grad.addColorStop(0, '#64748b');
        grad.addColorStop(0.75, '#94a3b8');
        grad.addColorStop(1, '#334155');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, glandRadius, glandRadius * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();

      // Central Urethra slit
      ctx.fillStyle = activeSeries === 'ADC' ? '#cbd5e1' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rectum posterior impression
      ctx.fillStyle = '#060a12';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + glandRadius + 22, glandRadius * 0.6, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Detected Lesions intersecting this slice
    if (showOverlays) {
      patient.lesions.forEach((lesion) => {
        // Check if slice matches lesion slice
        const targetSlice = lesion.sliceIndex[plane];
        const sliceDiff = Math.abs(currentSlice - targetSlice);

        if (sliceDiff <= 2) {
          const proximityFade = 1 - sliceDiff * 0.35;
          // Calculate screen coordinates
          const lx = centerX + lesion.coordinates.x * 4.8;
          const ly = centerY + lesion.coordinates.y * 4.8;
          const lRadius = (lesion.dimensions.lengthMm * 1.5) * proximityFade;

          // Render pathology according to MRI sequence!
          if (activeSeries === 'T2') {
            // T2: Cancer is hypointense (dark focal spot)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.beginPath();
            ctx.ellipse(lx, ly, lRadius, lRadius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (activeSeries === 'DWI') {
            // DWI: Cancer is intensely hyperintense (bright white/yellow)
            const dwiGrad = ctx.createRadialGradient(lx, ly, 1, lx, ly, lRadius);
            dwiGrad.addColorStop(0, '#ffffff');
            dwiGrad.addColorStop(0.4, '#fef08a');
            dwiGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
            ctx.fillStyle = dwiGrad;
            ctx.beginPath();
            ctx.arc(lx, ly, lRadius * 1.2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // ADC: Cancer shows marked signal loss (black focal restriction)
            ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
            ctx.beginPath();
            ctx.arc(lx, ly, lRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw clinical detection bounding box & contour
          const isSelected = selectedLesionId === lesion.id;
          ctx.strokeStyle = lesion.risk === 'high' ? '#ef4444' : lesion.risk === 'medium' ? '#f59e0b' : '#10b981';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.setLineDash(isSelected ? [] : [4, 3]);

          ctx.beginPath();
          ctx.ellipse(lx, ly, lRadius + 4, lRadius * 0.8 + 4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Lesion Tag Callout
          ctx.fillStyle = lesion.risk === 'high' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)';
          ctx.fillRect(lx + lRadius + 6, ly - 10, 80, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.fillText(`PI-RADS ${lesion.piradsScore} (${lesion.confidence}%)`, lx + lRadius + 10, ly + 2);
        }
      });

      // 3. Render manual radiologist annotations on this slice
      annotations
        .filter((a) => a.plane === plane && a.sliceIndex === currentSlice)
        .forEach((annot) => {
          const ax = (annot.x / 100) * width;
          const ay = (annot.y / 100) * height;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ax, ay, annot.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Annotation pin
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(ax, ay, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px JetBrains Mono';
          ctx.fillText(annot.label, ax + annot.radius + 6, ay + 3);
        });
    }

    // 4. Crosshairs
    if (showCrosshairs) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    }

    ctx.restore();
  }, [
    currentSlice,
    maxSlices,
    plane,
    activeSeries,
    showOverlays,
    showCrosshairs,
    zoomLevel,
    patient.lesions,
    selectedLesionId,
    annotations
  ]);

  // Handle canvas click for lesion selection or adding annotation
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isAnnotating) {
      // Create manual annotation
      const newAnnot: RadiologistAnnotation = {
        id: `annot-${Date.now()}`,
        sliceIndex: currentSlice,
        plane,
        x: (x / canvas.width) * 100,
        y: (y / canvas.height) * 100,
        radius: 14,
        label: `ROI #${annotations.length + 1}`,
        notes: 'Manual radiologist region of interest',
        createdAt: new Date().toLocaleTimeString()
      };
      onAddAnnotation(newAnnot);
      setIsAnnotating(false);
      return;
    }

    // Check if clicked near any lesion on this slice
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (const lesion of patient.lesions) {
      if (Math.abs(currentSlice - lesion.sliceIndex[plane]) <= 2) {
        const lx = centerX + lesion.coordinates.x * 4.8;
        const ly = centerY + lesion.coordinates.y * 4.8;
        const dist = Math.hypot(x - lx, y - ly);
        if (dist <= 30) {
          onSelectLesion(lesion);
          return;
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      {/* Top Controls Toolbar */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Orthogonal Plane Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          {(['axial', 'sagittal', 'coronal'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlane(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-all ${
                plane === p
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Multi-modal Sequence Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
          {(['T2', 'DWI', 'ADC'] as const).map((seq) => (
            <button
              key={seq}
              onClick={() => setActiveSeries(seq)}
              className={`px-2 py-0.5 rounded font-medium transition-all ${
                activeSeries === seq
                  ? 'bg-slate-800 text-sky-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {seq === 'T2' ? 'T2 TSE' : seq === 'DWI' ? 'DWI b-2000' : 'ADC Map'}
            </button>
          ))}
        </div>

        {/* Display Toggles */}
        <div className="flex items-center space-x-1.5 text-slate-300">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            title="Toggle AI Lesion Contours"
            className={`p-1.5 rounded-lg border transition-all ${
              showOverlays
                ? 'bg-medical-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            title="Toggle Crosshairs"
            className={`p-1.5 rounded-lg border transition-all ${
              showCrosshairs
                ? 'bg-medical-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAnnotating(!isAnnotating)}
            title="Draw Manual Radiologist ROI"
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-all text-[11px] ${
              isAnnotating
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3 h-3 text-amber-400" />
            <span>ROI Tool</span>
          </button>
          <div className="flex items-center space-x-1 pl-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Medical Canvas Viewport */}
      <div 
        ref={containerRef} 
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-black p-2 select-none"
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          onClick={handleCanvasClick}
          className={`rounded-lg border border-slate-850 shadow-2xl ${
            isAnnotating ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* Clinical DICOM HUD Corner Tags */}
        <div className="absolute top-4 left-4 font-mono text-[10px] text-sky-400/90 pointer-events-none space-y-0.5 drop-shadow-md">
          <div className="font-bold text-white">{patient.patientId} • {patient.accessionNumber}</div>
          <div>{patient.scanDate} | 3.0 Tesla</div>
          <div>Series: {activeSeries === 'T2' ? 'T2 TSE hr_axial' : activeSeries === 'DWI' ? 'DWI_b2000' : 'ADC_map_quant'}</div>
          <div>FOV: 180mm • Thk: 3.0mm</div>
        </div>

        <div className="absolute top-4 right-4 font-mono text-[10px] text-right text-slate-400 pointer-events-none space-y-0.5 drop-shadow-md">
          <div className="text-white font-semibold">W: 650  L: 320</div>
          <div>Matrix: 384 × 384</div>
          <div>Zoom: {(zoomLevel * 100).toFixed(0)}%</div>
          <div className="text-emerald-400">DICOM 3.0 Verified</div>
        </div>

        {/* Current Plane / Orientation Letters */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono font-bold text-xs text-sky-400/70 pointer-events-none">
          {plane === 'axial' ? 'A (Anterior)' : plane === 'sagittal' ? 'S (Superior)' : 'S (Superior)'}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono font-bold text-xs text-sky-400/70 pointer-events-none">
          {plane === 'axial' ? 'P (Posterior)' : plane === 'sagittal' ? 'I (Inferior)' : 'I (Inferior)'}
        </div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-sky-400/70 pointer-events-none">
          {plane === 'axial' ? 'R (Right)' : plane === 'sagittal' ? 'A (Anterior)' : 'R (Right)'}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-sky-400/70 pointer-events-none">
          {plane === 'axial' ? 'L (Left)' : plane === 'sagittal' ? 'P (Posterior)' : 'L (Left)'}
        </div>

        {/* Annotation active prompt banner */}
        {isAnnotating && (
          <div className="absolute top-14 bg-amber-950/90 text-amber-200 border border-amber-500/50 text-[11px] px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
            <span>Click anywhere on slice to place manual ROI target</span>
          </div>
        )}
      </div>

      {/* Bottom Cine Navigation & Slice Scrubber */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center space-x-3 text-xs">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors"
          title={isPlaying ? 'Pause Cine' : 'Play Cine'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="Previous Slice"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Slice Scrubber Bar */}
        <div className="flex-1 flex items-center space-x-2">
          <input
            type="range"
            min={0}
            max={maxSlices - 1}
            value={currentSlice}
            onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={() => setCurrentSlice(Math.min(maxSlices - 1, currentSlice + 1))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="Next Slice"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Slice Counter Tag */}
        <div className="font-mono text-slate-300 text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800">
          Slice <span className="font-bold text-sky-400">{currentSlice + 1}</span>/{maxSlices}
        </div>
      </div>
    </div>
  );
};
