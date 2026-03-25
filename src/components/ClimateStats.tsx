import React from 'react';
import { Thermometer, Droplets, CloudRain, Info } from 'lucide-react';
import { motion } from 'motion/react';

import { ClimateData } from '../types';

interface ClimateStatsProps {
  region: string;
  summary: string;
  climateData?: ClimateData;
}

export function ClimateStats({ region, summary, climateData }: ClimateStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#111114] rounded-3xl border border-[#1F1F23] p-8 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Info className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{region} Intelligence</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Environmental Profile</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed font-medium mb-10 italic border-l-2 border-blue-500/30 pl-6">
        "{summary}"
      </p>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Thermometer className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Temp</span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {climateData?.temperature ? `${climateData.temperature.toFixed(1)}°C` : '28.4°C'}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Droplets className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Humidity</span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {climateData?.humidity ? `${Math.round(climateData.humidity)}%` : '64%'}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-500">
            <CloudRain className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Precip</span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {climateData?.rainfall ? `${Math.round(climateData.rainfall)}mm` : '112mm'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
