import React from 'react';
import { PredictionResult } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface YearlyTrendsSummaryProps {
  predictions: PredictionResult[];
  stateRiskLevels: Record<string, 'High' | 'Medium' | 'Low'>;
}

export function YearlyTrendsSummary({ predictions, stateRiskLevels }: YearlyTrendsSummaryProps) {
  if (predictions.length === 0) return null;

  const getRiskColor = (region: string) => {
    const level = stateRiskLevels[region];
    switch (level) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-orange-500';
      case 'Low': return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-[#111114] rounded-3xl border border-[#1F1F23] p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Yearly Outbreak Trends</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Historical and projected case volume</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map((prediction, idx) => {
          const trends = prediction.yearlyTrends || [];
          if (trends.length < 2) return null;

          const nonForecastTrends = trends.filter(t => !t.isForecast);
          const current = nonForecastTrends.length > 0 
            ? nonForecastTrends[nonForecastTrends.length - 1] 
            : trends[0];
          
          const previous = nonForecastTrends.length > 1
            ? nonForecastTrends[nonForecastTrends.length - 2]
            : null;
          
          const percentChange = previous && current 
            ? ((current.cases - previous.cases) / previous.cases) * 100 
            : 0;

          const riskColor = getRiskColor(prediction.region);

          return (
            <motion.div 
              key={prediction.region}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-[#151619] p-6 rounded-2xl border border-[#1F1F23] hover:border-blue-500/20 transition-all group ${
                stateRiskLevels[prediction.region] === 'High' ? 'border-red-500/20' : 
                stateRiskLevels[prediction.region] === 'Medium' ? 'border-orange-500/20' : 
                'border-emerald-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-black uppercase tracking-widest ${riskColor}`}>
                  {prediction.region} ({stateRiskLevels[prediction.region] || 'N/A'})
                </span>
                <div className={`flex items-center gap-1 text-[10px] font-black ${percentChange > 0 ? 'text-red-500' : percentChange < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {percentChange > 0 ? <TrendingUp className="w-3 h-3" /> : percentChange < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {Math.abs(percentChange).toFixed(1)}%
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xl font-black text-white font-mono tracking-tighter">
                    {current?.cases.toLocaleString()}
                  </div>
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Total Cases ({current?.year})
                  </div>
                </div>
                
                <div className="h-12 w-24">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={trends}>
                      <Line 
                        type="monotone" 
                        dataKey="cases" 
                        stroke={percentChange > 0 ? '#ef4444' : '#10b981'} 
                        strokeWidth={2} 
                        dot={false}
                        animationDuration={1500}
                      />
                      <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-[10px] font-black text-white font-mono">{current?.dengue?.toLocaleString()}</div>
                  <div className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">Dengue</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-white font-mono">{current?.malaria?.toLocaleString()}</div>
                  <div className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">Malaria</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-white font-mono">{current?.cholera?.toLocaleString()}</div>
                  <div className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">Cholera</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
