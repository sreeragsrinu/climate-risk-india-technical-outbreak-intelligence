import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  ReferenceLine,
  Label
} from 'recharts';
import { PredictionResult } from '../types';
import { TrendingUp, Activity, Download, Filter, Clock } from 'lucide-react';
import { downloadCSV } from '../lib/export';

interface TrendsChartProps {
  predictions: PredictionResult[];
}

type DiseaseFilter = 'all' | 'dengue' | 'malaria' | 'cholera';

export function TrendsChart({ predictions }: TrendsChartProps) {
  const [activeFilter, setActiveFilter] = useState<DiseaseFilter>('all');
  
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    grid: '#1F1F23',
    text: '#8E9299',
    tooltipBg: '#151619',
    tooltipBorder: '#2F2F35',
    dengue: '#F43F5E',
    malaria: '#F59E0B',
    cholera: '#10B981',
    regions: ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899']
  };

  const filterButtons = [
    { id: 'all', label: 'Overview', color: 'bg-white text-black' },
    { id: 'dengue', label: 'Dengue', color: 'bg-[#F43F5E] text-white' },
    { id: 'malaria', label: 'Malaria', color: 'bg-[#F59E0B] text-white' },
    { id: 'cholera', label: 'Cholera', color: 'bg-[#10B981] text-white' },
  ];

  // Prepare combined data for charts
  const combinedYearlyTrends = React.useMemo(() => {
    const years = Array.from(new Set(predictions.flatMap(p => (p.yearlyTrends || []).map(t => t.year)))).sort((a, b) => Number(a) - Number(b));
    return years.map(year => {
      const point: any = { year };
      predictions.forEach((p, idx) => {
        const trend = p.yearlyTrends?.find(t => t.year === year);
        if (trend) {
          point[`cases_${idx}`] = trend.cases;
          point[`dengue_${idx}`] = trend.dengue;
          point[`malaria_${idx}`] = trend.malaria;
          point[`cholera_${idx}`] = trend.cholera;
          point[`isForecast_${idx}`] = trend.isForecast;
        }
      });
      return point;
    });
  }, [predictions]);

  const totalYearlyTrends = React.useMemo(() => {
    const years = Array.from(new Set(predictions.flatMap(p => (p.yearlyTrends || []).map(t => t.year)))).sort((a, b) => Number(a) - Number(b));
    return years.map(year => {
      let totalCases = 0;
      let totalDengue = 0;
      let totalMalaria = 0;
      let totalCholera = 0;
      let isForecast = false;

      predictions.forEach(p => {
        const trend = p.yearlyTrends?.find(t => t.year === year);
        if (trend) {
          totalCases += (Number(trend.cases) || 0);
          totalDengue += (Number(trend.dengue) || 0);
          totalMalaria += (Number(trend.malaria) || 0);
          totalCholera += (Number(trend.cholera) || 0);
          if (trend.isForecast) isForecast = true;
        }
      });

      return {
        year,
        totalCases,
        totalDengue,
        totalMalaria,
        totalCholera,
        isForecast
      };
    });
  }, [predictions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#151619] border border-[#2F2F35] p-4 rounded-xl shadow-2xl min-w-[220px]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
            <span className="text-xs font-black text-white tracking-widest uppercase">{label}</span>
          </div>
          <div className="space-y-3">
            {payload.map((entry: any, index: number) => {
              const dataKey = entry.dataKey;
              let displayName = entry.name;
              let isForecast = false;

              if (dataKey.startsWith('total')) {
                isForecast = entry.payload.isForecast;
              } else if (dataKey.includes('_')) {
                const regionIdx = parseInt(dataKey.split('_')[1]);
                const regionName = predictions[regionIdx]?.region || 'Unknown';
                const diseaseName = dataKey.split('_')[0];
                const capitalizedDisease = diseaseName.charAt(0).toUpperCase() + diseaseName.slice(1);
                displayName = `${regionName} (${capitalizedDisease})`;
                isForecast = entry.payload[`isForecast_${regionIdx}`];
              }
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[10px] text-white font-black uppercase tracking-wider">{displayName}</span>
                    </div>
                    {isForecast && (
                      <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[7px] font-black uppercase tracking-widest rounded border border-indigo-500/30">
                        Forecast
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-[10px] text-white font-black font-mono">{entry.value.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Annual Outbreak Trends */}
      <div className="bg-[#111114] p-8 rounded-2xl border border-[#1F1F23] shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Annual Outbreak Trends</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Total burden across all selected regions</p>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={totalYearlyTrends}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151619', border: '1px solid #2F2F35', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#FFF', fontWeight: 'bold' }}
              />
              {totalYearlyTrends.find(t => t.isForecast) && (
                <ReferenceLine 
                  x={totalYearlyTrends.find(t => t.isForecast)?.year} 
                  stroke="#6366f1" 
                  strokeDasharray="3 3"
                  strokeWidth={1}
                >
                  <Label 
                    value="FORECAST" 
                    position="top" 
                    fill="#6366f1" 
                    fontSize={8} 
                    fontWeight="bold" 
                    fontFamily="JetBrains Mono"
                    dy={-10}
                  />
                </ReferenceLine>
              )}
              <Area 
                type="monotone" 
                dataKey="totalCases" 
                stroke={chartColors.primary} 
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                strokeWidth={3}
                name="Total Cases"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yearly Outbreak Trends Chart */}
      <div className="bg-[#111114] p-8 rounded-2xl border border-[#1F1F23] shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Regional Comparison: Outbreak Trends</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Comparative analysis of case volume</p>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full flex items-center justify-center">
          {combinedYearlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedYearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {combinedYearlyTrends.find(t => Object.keys(t).some(k => k.startsWith('isForecast_') && t[k])) && (
                  <ReferenceLine 
                    x={combinedYearlyTrends.find(t => Object.keys(t).some(k => k.startsWith('isForecast_') && t[k]))?.year} 
                    stroke="#6366f1" 
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  >
                    <Label 
                      value="FORECAST" 
                      position="top" 
                      fill="#6366f1" 
                      fontSize={8} 
                      fontWeight="bold" 
                      fontFamily="JetBrains Mono"
                      dy={-10}
                    />
                  </ReferenceLine>
                )}
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '30px', color: chartColors.text }}
                />
                {predictions.map((p, idx) => (
                  <Line 
                    key={p.region}
                    type="monotone" 
                    dataKey={`cases_${idx}`} 
                    name={p.region}
                    stroke={chartColors.regions[idx % chartColors.regions.length]} 
                    strokeWidth={3}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                      if (payload[`isForecast_${idx}`]) return <circle cx={cx} cy={cy} r={3} fill="none" stroke={chartColors.regions[idx % chartColors.regions.length]} strokeWidth={1} />;
                      return <circle cx={cx} cy={cy} r={4} fill={chartColors.regions[idx % chartColors.regions.length]} strokeWidth={0} />;
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy } = props;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                      return <circle cx={cx} cy={cy} r={6} fill="#FFF" strokeWidth={0} />;
                    }}
                    animationDuration={2000}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <Activity className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Disease-Specific Trends Chart */}
      <div className="bg-[#111114] p-8 rounded-2xl border border-[#1F1F23] shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">
                {activeFilter === 'all' ? 'Disease Comparison' : `${activeFilter} Regional Analysis`}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Comparative trends across selected regions
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 bg-[#151619] p-1 rounded-xl border border-[#1F1F23]">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveFilter(btn.id as DiseaseFilter)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === btn.id 
                    ? `${btn.color} shadow-lg scale-105` 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full flex items-center justify-center">
          {combinedYearlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeFilter === 'all' ? totalYearlyTrends : combinedYearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {totalYearlyTrends.find(t => t.isForecast) && (
                  <ReferenceLine 
                    x={totalYearlyTrends.find(t => t.isForecast)?.year} 
                    stroke="#6366f1" 
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  >
                    <Label 
                      value="FORECAST" 
                      position="top" 
                      fill="#6366f1" 
                      fontSize={8} 
                      fontWeight="bold" 
                      fontFamily="JetBrains Mono"
                      dy={-10}
                    />
                  </ReferenceLine>
                )}
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '30px', color: chartColors.text }}
                />
                
                {activeFilter === 'all' ? (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="totalDengue" 
                      name="Total Dengue"
                      stroke={chartColors.dengue} 
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        if (payload.isForecast) return <circle cx={cx} cy={cy} r={3} fill="none" stroke={chartColors.dengue} strokeWidth={1} />;
                        return <circle cx={cx} cy={cy} r={4} fill={chartColors.dengue} strokeWidth={0} />;
                      }}
                      activeDot={(props: any) => {
                        const { cx, cy } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        return <circle cx={cx} cy={cy} r={6} fill="#FFF" strokeWidth={0} />;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalMalaria" 
                      name="Total Malaria"
                      stroke={chartColors.malaria} 
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        if (payload.isForecast) return <circle cx={cx} cy={cy} r={3} fill="none" stroke={chartColors.malaria} strokeWidth={1} />;
                        return <circle cx={cx} cy={cy} r={4} fill={chartColors.malaria} strokeWidth={0} />;
                      }}
                      activeDot={(props: any) => {
                        const { cx, cy } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        return <circle cx={cx} cy={cy} r={6} fill="#FFF" strokeWidth={0} />;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalCholera" 
                      name="Total Cholera"
                      stroke={chartColors.cholera} 
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        if (payload.isForecast) return <circle cx={cx} cy={cy} r={3} fill="none" stroke={chartColors.cholera} strokeWidth={1} />;
                        return <circle cx={cx} cy={cy} r={4} fill={chartColors.cholera} strokeWidth={0} />;
                      }}
                      activeDot={(props: any) => {
                        const { cx, cy } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        return <circle cx={cx} cy={cy} r={6} fill="#FFF" strokeWidth={0} />;
                      }}
                    />
                  </>
                ) : (
                  predictions.map((p, idx) => (
                    <Line 
                      key={p.region}
                      type="monotone" 
                      dataKey={`${activeFilter}_${idx}`} 
                      name={p.region}
                      stroke={chartColors.regions[idx % chartColors.regions.length]} 
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        const color = chartColors.regions[idx % chartColors.regions.length];
                        if (payload[`isForecast_${idx}`]) return <circle cx={cx} cy={cy} r={3} fill="none" stroke={color} strokeWidth={1} />;
                        return <circle cx={cx} cy={cy} r={4} fill={color} strokeWidth={0} />;
                      }}
                      activeDot={(props: any) => {
                        const { cx, cy } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                        return <circle cx={cx} cy={cy} r={6} fill="#FFF" strokeWidth={0} />;
                      }}
                      animationDuration={2000}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <Activity className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No disease-specific data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Performance Analysis (Only for first region to avoid clutter) */}
      {predictions.length === 1 && (
        <div className="bg-[#111114] p-8 rounded-2xl border border-[#1F1F23] shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Model Performance Analysis: {predictions[0].region}</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Regression accuracy verification</p>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full flex items-center justify-center">
            {predictions[0].actualVsPredicted && predictions[0].actualVsPredicted.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictions[0].actualVsPredicted}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="point" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '30px', color: chartColors.text }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    name="Actual Data"
                    stroke="#475569" 
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy } = props;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                      return <circle cx={cx} cy={cy} r={3} fill="#475569" strokeWidth={0} />;
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy } = props;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                      return <circle cx={cx} cy={cy} r={5} fill="#FFF" strokeWidth={0} />;
                    }}
                    animationDuration={2000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    name="ML Prediction"
                    stroke={chartColors.primary} 
                    strokeWidth={3}
                    dot={(props: any) => {
                      const { cx, cy } = props;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                      return <circle cx={cx} cy={cy} r={4} fill={chartColors.primary} strokeWidth={0} />;
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy } = props;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                      return <circle cx={cx} cy={cy} r={6} fill="#FFF" strokeWidth={0} />;
                    }}
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <Activity className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Insufficient data for performance analysis</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
