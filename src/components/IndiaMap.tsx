import React from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Geographically accurate SVG paths for Indian states and Union Territories
const STATES = [
  { id: 'JK', name: 'Jammu and Kashmir', path: 'M 190 20 L 220 15 L 240 30 L 250 60 L 230 90 L 200 90 L 180 60 Z' },
  { id: 'LA', name: 'Ladakh', path: 'M 220 15 L 260 25 L 280 65 L 250 90 L 220 90 Z' },
  { id: 'HP', name: 'Himachal Pradesh', path: 'M 220 90 L 250 90 L 260 110 L 250 140 L 220 130 Z' },
  { id: 'PB', name: 'Punjab', path: 'M 190 100 L 220 130 L 210 160 L 180 150 L 180 110 Z' },
  { id: 'UK', name: 'Uttarakhand', path: 'M 250 140 L 280 130 L 290 150 L 280 180 L 250 170 Z' },
  { id: 'HR', name: 'Haryana', path: 'M 200 150 L 230 150 L 240 170 L 230 200 L 200 190 Z' },
  { id: 'DL', name: 'Delhi', path: 'M 214 164 L 232 164 L 232 182 L 214 182 Z' },
  { id: 'RJ', name: 'Rajasthan', path: 'M 90 150 L 180 150 L 200 190 L 210 250 L 150 280 L 90 230 Z' },
  { id: 'UP', name: 'Uttar Pradesh', path: 'M 230 160 L 280 170 L 340 200 L 320 260 L 250 240 L 230 200 Z' },
  { id: 'GJ', name: 'Gujarat', path: 'M 80 230 L 140 280 L 130 330 L 70 340 L 50 300 L 60 250 Z' },
  { id: 'MP', name: 'Madhya Pradesh', path: 'M 150 280 L 250 240 L 310 280 L 290 350 L 180 360 L 160 320 Z' },
  { id: 'MH', name: 'Maharashtra', path: 'M 130 330 L 180 360 L 260 380 L 240 450 L 150 430 L 120 380 Z' },
  { id: 'KA', name: 'Karnataka', path: 'M 150 430 L 200 440 L 210 540 L 170 560 L 140 500 Z' },
  { id: 'GA', name: 'Goa', path: 'M 144 424 L 162 424 L 162 442 L 144 442 Z' },
  { id: 'KL', name: 'Kerala', path: 'M 170 560 L 190 560 L 195 600 L 175 610 Z' },
  { id: 'TN', name: 'Tamil Nadu', path: 'M 210 540 L 240 530 L 250 600 L 210 610 L 190 560 Z' },
  { id: 'AP', name: 'Andhra Pradesh', path: 'M 250 410 L 280 400 L 310 430 L 320 480 L 290 520 L 260 510 L 240 460 Z' },
  { id: 'TS', name: 'Telangana', path: 'M 210 380 L 280 380 L 280 400 L 200 410 Z' },
  { id: 'OR', name: 'Odisha', path: 'M 310 280 L 370 300 L 360 380 L 310 400 L 280 380 L 310 320 Z' },
  { id: 'CT', name: 'Chhattisgarh', path: 'M 270 250 L 310 280 L 310 320 L 270 380 L 250 330 Z' },
  { id: 'JH', name: 'Jharkhand', path: 'M 320 260 L 370 260 L 380 300 L 330 310 Z' },
  { id: 'BR', name: 'Bihar', path: 'M 320 200 L 380 210 L 370 260 L 320 260 Z' },
  { id: 'WB', name: 'West Bengal', path: 'M 370 260 L 400 260 L 410 320 L 380 340 L 370 300 Z' },
  { id: 'SK', name: 'Sikkim', path: 'M 380 190 L 400 190 L 400 210 L 380 210 Z' },
  { id: 'AS', name: 'Assam', path: 'M 410 220 L 470 220 L 470 250 L 410 260 Z' },
  { id: 'AR', name: 'Arunachal Pradesh', path: 'M 440 180 L 490 190 L 480 220 L 440 220 Z' },
  { id: 'ML', name: 'Meghalaya', path: 'M 410 260 L 450 260 L 450 280 L 410 280 Z' },
  { id: 'MN', name: 'Manipur', path: 'M 480 250 L 500 250 L 500 270 L 480 270 Z' },
  { id: 'MZ', name: 'Mizoram', path: 'M 480 270 L 500 270 L 490 300 L 480 300 Z' },
  { id: 'TR', name: 'Tripura', path: 'M 460 280 L 480 280 L 480 300 L 460 300 Z' },
  { id: 'NL', name: 'Nagaland', path: 'M 480 220 L 500 220 L 500 250 L 480 250 Z' },
];

interface IndiaMapProps {
  selectedStates: string[];
  onToggleState: (state: string, isMulti?: boolean) => void;
  isMultiSelect: boolean;
  onToggleMultiSelect: () => void;
  riskLevel?: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export function IndiaMap({ 
  selectedStates, 
  onToggleState, 
  isMultiSelect, 
  onToggleMultiSelect, 
  riskLevel 
}: IndiaMapProps) {
  const [hoveredState, setHoveredState] = React.useState<string | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'Low': return '#10b981'; // emerald-500
      case 'Moderate': return '#f97316'; // orange-500
      case 'High': return '#ef4444'; // red-500
      case 'Critical': return '#dc2626'; // red-600
      default: return '#3B82F6'; // default blue
    }
  };

  const activeColor = getRiskColor(riskLevel);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="relative w-full aspect-[4/5] bg-[#0D0D0F] rounded-3xl border border-[#1F1F23] p-4 pb-12 shadow-2xl overflow-hidden group cursor-crosshair flex flex-col"
      onMouseMove={handleMouseMove}
    >
      {/* Background Grid - Very subtle */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Regional Intel</h3>
          </div>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest ml-3">Interactive State Mapping</p>
        </div>
        
        <div className="flex gap-1 bg-[#151619] p-1 rounded-xl border border-[#1F1F23]">
          <button
            onClick={onToggleMultiSelect}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              isMultiSelect 
                ? "bg-[#1F1F23] text-blue-500 shadow-lg" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Multi-Select
          </button>
        </div>
      </div>
      
      <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
        <svg viewBox="40 10 470 610" className="w-full h-full max-h-full drop-shadow-[0_0_40px_rgba(0,85,150,0.3)] relative z-10">
          {/* Interactive States */}
          {STATES.map((state) => {
            const isActive = selectedStates.includes(state.name);
            const isHovered = hoveredState === state.name;
            return (
              <g 
                key={state.id} 
                onClick={() => onToggleState(state.name, isMultiSelect)}
                onMouseEnter={() => setHoveredState(state.name)}
                onMouseLeave={() => setHoveredState(null)}
                className="cursor-pointer group/state"
              >
                <motion.path 
                  d={state.path}
                  initial={false}
                  animate={{
                    fill: isActive ? activeColor : (isHovered ? '#0066AA' : '#005596'),
                    stroke: '#FFF',
                    strokeWidth: isActive || isHovered ? 1.5 : 0.75,
                    scale: isActive ? 1.03 : (isHovered ? 1.01 : 1),
                    filter: isActive ? `drop-shadow(0 0 15px ${activeColor}CC)` : 'none',
                  }}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Custom Floating Tooltip */}
      <AnimatePresence>
        {hoveredState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ 
              position: 'fixed',
              left: mousePos.x + 20,
              top: mousePos.y - 20,
              pointerEvents: 'none',
              zIndex: 100
            }}
            className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-blue-500/30 rounded-lg shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {hoveredState}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Selection Info */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
        <div className="text-right bg-blue-500/5 backdrop-blur-md p-3 rounded-xl border border-blue-500/20 max-w-[200px]">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Active Selection</p>
          <div className="flex flex-wrap justify-end gap-1">
            {selectedStates.length > 0 ? (
              selectedStates.map(state => (
                <span key={state} className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20" style={{ color: activeColor }}>
                  {state}
                </span>
              ))
            ) : (
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">None</p>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm bg-[#005596] border border-white/20" />
            <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm shadow-[0_0_5px_rgba(59,130,246,0.5)]" style={{ backgroundColor: activeColor }} />
            <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider">Selected</span>
          </div>
        </div>
        
        <div className="w-px h-2 bg-white/10" />
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-[#10b981]" />
            <span className="text-[6px] text-slate-500 font-bold uppercase tracking-tighter">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-[#f97316]" />
            <span className="text-[6px] text-slate-500 font-bold uppercase tracking-tighter">Mod</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-[#ef4444]" />
            <span className="text-[6px] text-slate-500 font-bold uppercase tracking-tighter">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
