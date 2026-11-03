import React from 'react';
import { Layers, Eye, Sliders, Box, RotateCcw, Compass } from 'lucide-react';

interface ThreeControlsProps {
  showCapsule: boolean;
  setShowCapsule: (val: boolean) => void;
  showPZ: boolean;
  setShowPZ: (val: boolean) => void;
  showTZ: boolean;
  setShowTZ: (val: boolean) => void;
  showUrethra: boolean;
  setShowUrethra: (val: boolean) => void;
  showSlicingPlane: boolean;
  setShowSlicingPlane: (val: boolean) => void;
  wireframe: boolean;
  setWireframe: (val: boolean) => void;
  opacity: number;
  setOpacity: (val: number) => void;
}

export const ThreeControls: React.FC<ThreeControlsProps> = ({
  showCapsule,
  setShowCapsule,
  showPZ,
  setShowPZ,
  showTZ,
  setShowTZ,
  showUrethra,
  setShowUrethra,
  showSlicingPlane,
  setShowSlicingPlane,
  wireframe,
  setWireframe,
  opacity,
  setOpacity,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 backdrop-blur-md shadow-lg space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-100">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>3D Anatomical Layer Controls</span>
        </div>
        <span className="text-[10px] font-mono text-sky-400">WebGL 2.0</span>
      </div>

      {/* Anatomy Layer Toggles */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <button
          onClick={() => setShowCapsule(!showCapsule)}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
            showCapsule ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          <span>Outer Capsule</span>
          <Eye className={`w-3 h-3 ${showCapsule ? 'text-sky-400' : 'text-slate-600'}`} />
        </button>

        <button
          onClick={() => setShowPZ(!showPZ)}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
            showPZ ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          <span>Peripheral Zone (PZ)</span>
          <Eye className={`w-3 h-3 ${showPZ ? 'text-sky-400' : 'text-slate-600'}`} />
        </button>

        <button
          onClick={() => setShowTZ(!showTZ)}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
            showTZ ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          <span>Transition Zone (TZ)</span>
          <Eye className={`w-3 h-3 ${showTZ ? 'text-sky-400' : 'text-slate-600'}`} />
        </button>

        <button
          onClick={() => setShowUrethra(!showUrethra)}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
            showUrethra ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          <span>Urethra Lumen</span>
          <Eye className={`w-3 h-3 ${showUrethra ? 'text-sky-400' : 'text-slate-600'}`} />
        </button>
      </div>

      {/* Slicing Plane & Wireframe Toggles */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        <button
          onClick={() => setShowSlicingPlane(!showSlicingPlane)}
          className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
            showSlicingPlane ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          Sync Cut Plane
        </button>

        <button
          onClick={() => setWireframe(!wireframe)}
          className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
            wireframe ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          Mesh Wireframe
        </button>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Tissue Transparency</span>
          <span className="font-mono text-sky-400">{(opacity * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
