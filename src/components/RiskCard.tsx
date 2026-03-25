import React from 'react';
import { DiseaseRisk } from '../types';
import { cn } from '../lib/utils';
import { AlertTriangle, ShieldCheck, Info, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface RiskCardProps {
  risk: DiseaseRisk;
  index: number;
}

export function RiskCard({ risk, index }: RiskCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Moderate': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'High': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Critical': return 'text-red-600 bg-red-600/10 border-red-600/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'Low': return <ShieldCheck className="w-5 h-5" />;
      case 'Moderate': return <Info className="w-5 h-5" />;
      case 'High': return <AlertTriangle className="w-5 h-5" />;
      case 'Critical': return <Activity className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#111114] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-2xl group hover:border-blue-500/30 transition-all"
    >
      <div className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">{risk.disease}</h3>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(risk.riskLevel)}`}>
                {risk.riskLevel} Risk
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
                Score: {risk.score}/100
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl border ${getRiskColor(risk.riskLevel)}`}>
            {getIcon(risk.riskLevel)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-[#151619] p-4 rounded-xl border border-[#1F1F23]">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Predicted Cases</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {risk.predictedCases?.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#151619] p-4 rounded-xl border border-[#1F1F23]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Trend Analysis</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {risk.trendPercent && risk.trendPercent > 0 ? '+' : ''}{risk.trendPercent}%
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-8 font-medium italic border-l-2 border-[#1F1F23] pl-4">
          "{risk.description}"
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Info className="w-3 h-3" />
            Recommended Actions
          </div>
          <div className="flex flex-wrap gap-2">
            {risk.recommendations.map((rec) => (
              <span 
                key={rec} 
                className="px-3 py-1.5 bg-[#1F1F23] text-slate-300 text-[10px] font-bold rounded-lg border border-[#2F2F35] hover:border-blue-500/50 transition-colors cursor-default"
              >
                {rec}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="h-1.5 w-full bg-[#1F1F23]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${risk.score}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full ${
            risk.score < 30 ? 'bg-emerald-500' : 
            risk.score < 60 ? 'bg-orange-500' : 
            risk.score < 85 ? 'bg-red-500' : 'bg-red-600'
          } shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
        />
      </div>
    </motion.div>
  );
}
