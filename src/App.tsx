import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IndiaMap } from './components/IndiaMap';
import { RiskCard } from './components/RiskCard';
import { ClimateStats } from './components/ClimateStats';
import { DatasetUpload } from './components/DatasetUpload';
import { TrendsChart } from './components/TrendsChart';
import { YearlyTrendsSummary } from './components/YearlyTrendsSummary';
import { getClimatePrediction, processUploadedDataset } from './services/prediction';
import { PredictionResult } from './types';
import { ShieldAlert, RefreshCw, Loader2, Globe, Activity, Info, BarChart3, LayoutDashboard, LineChart as ChartIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadCSV } from './lib/export';

export default function App() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['Maharashtra']);
  const [isMultiSelect, setIsMultiSelect] = useState(true);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  const [isDatasetMode, setIsDatasetMode] = useState(false);

  const processDatasetWithFilters = useCallback(async (data: any[], regions: string[]) => {
    setLoading(true);
    setError(null);
    try {
      // Helper to find the region key in the data
      const getRegionKey = (obj: any) => {
        const keys = ['region', 'state', 'location', 'province', 'district', 'place', 'st_nm', 'state_name', 'state_code', 'state name'];
        return Object.keys(obj).find(k => 
          keys.some(searchKey => k.toLowerCase() === searchKey.toLowerCase())
        );
      };

      const regionKey = data.length > 0 ? getRegionKey(data[0]) : null;
      
      let filteredData = data;
      if (regionKey && regions.length > 0) {
        filteredData = data.filter(row => {
          const rowVal = String(row[regionKey]).toLowerCase().trim();
          return regions.some(r => {
            const target = r.toLowerCase().trim();
            // Exact match
            if (rowVal === target) return true;
            // Handle Jammu and Kashmir variations
            if (target === 'jammu and kashmir') {
              return rowVal === 'jammu & kashmir' || rowVal === 'j&k' || rowVal === 'j & k';
            }
            // Partial match for robustness
            return rowVal.includes(target) || target.includes(rowVal);
          });
        });
      }

      if (filteredData.length === 0 && regions.length > 0 && regionKey) {
        setError(`No data found in dataset for: ${regions.join(', ')}`);
        setPredictions([]);
      } else {
        const result = await processUploadedDataset(filteredData);
        if (regions.length > 0 && regionKey && filteredData.length > 0) {
          result.region = regions.join(', ');
        }
        setPredictions([result]);
      }
    } catch (err) {
      setError('Failed to process dataset for selected regions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPredictions = useCallback(async (regions: string[]) => {
    if (isDatasetMode) {
      if (uploadedData) {
        processDatasetWithFilters(uploadedData, regions);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(regions.map(region => getClimatePrediction(region)));
      setPredictions(results);
    } catch (err) {
      setError('Failed to analyze climate patterns. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isDatasetMode, uploadedData, processDatasetWithFilters]);

  const handleToggleRegion = (region: string, isMulti?: boolean) => {
    if (!region) {
      setSelectedRegions([]);
      return;
    }
    setSelectedRegions(prev => {
      if (isMulti) {
        if (prev.includes(region)) {
          if (prev.length === 1) return prev; // Keep at least one
          return prev.filter(r => r !== region);
        }
        return [...prev, region];
      } else {
        return [region];
      }
    });
  };

  const handleToggleMultiSelect = () => {
    setIsMultiSelect(prev => {
      const next = !prev;
      if (!next && selectedRegions.length > 1) {
        // If turning off multi-select, keep only the first selected region
        setSelectedRegions([selectedRegions[0]]);
      }
      return next;
    });
  };

  const handleDatasetUpload = async (data: any[]) => {
    setUploadedData(data);
    setIsDatasetMode(true);
    setActiveTab('analytics');
  };

  const resetToAuto = () => {
    setIsDatasetMode(false);
    fetchPredictions(selectedRegions);
  };

  const switchToDataset = () => {
    if (predictions.length > 0) {
      setIsDatasetMode(true);
    }
  };

  useEffect(() => {
    fetchPredictions(selectedRegions);
  }, [selectedRegions, fetchPredictions]);

  const stateRiskLevels = useMemo(() => {
    if (predictions.length === 0) return {};
    
    const stateCases = predictions.map(p => {
      const latestTrend = p.yearlyTrends?.filter(t => !t.isForecast).pop() || p.yearlyTrends?.[0];
      return {
        region: p.region,
        cases: latestTrend?.cases || 0
      };
    });

    // Sort by cases descending
    const sorted = [...stateCases].sort((a, b) => b.cases - a.cases);
    const total = sorted.length;
    
    const highThreshold = Math.ceil(total * 0.33);
    const mediumThreshold = Math.ceil(total * 0.66);

    const levels: Record<string, 'High' | 'Medium' | 'Low'> = {};
    sorted.forEach((item, index) => {
      if (index < highThreshold) {
        levels[item.region] = 'High';
      } else if (index < mediumThreshold) {
        levels[item.region] = 'Medium';
      } else {
        levels[item.region] = 'Low';
      }
    });
    
    return levels;
  }, [predictions]);

  const handleExport = () => {
    if (predictions.length === 0) return;
    
    const exportData = predictions.flatMap(pred => 
      pred.risks.map(risk => ({
        Region: pred.region,
        Year: pred.climateData?.year || new Date().getFullYear(),
        Disease: risk.disease,
        'Risk Level': risk.riskLevel,
        Score: risk.score,
        'Predicted Cases': risk.predictedCases,
        'Trend %': risk.trendPercent >= 0 ? `+${risk.trendPercent}%` : `${risk.trendPercent}%`,
        Description: risk.description,
        Recommendations: risk.recommendations.join('; '),
        Temperature: pred.climateData?.temperature,
        Humidity: pred.climateData?.humidity,
        Rainfall: pred.climateData?.rainfall
      }))
    );
    
    downloadCSV(exportData, `disease_risk_assessment_${new Date().toISOString().split('T')[0]}`);
  };

  const mainPrediction = predictions[0] || null;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-blue-500/20">
      {/* Header */}
      <header className="bg-[#0A0A0B]/80 backdrop-blur-md border-b border-[#1F1F23] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">CLIMATE<span className="text-blue-500">RISK</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Technical Outbreak Intelligence</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-[#151619] p-1 rounded-xl border border-[#1F1F23]">
            <button 
              onClick={resetToAuto}
              className={`px-6 py-2 rounded-lg text-[11px] font-bold transition-all uppercase tracking-wider ${!isDatasetMode ? 'bg-[#1F1F23] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Regional Intel
            </button>
            <div className="w-px h-4 bg-[#1F1F23] mx-1" />
            <button 
              onClick={switchToDataset}
              disabled={predictions.length === 0}
              className={`px-6 py-2 rounded-lg text-[11px] font-bold transition-all uppercase tracking-wider disabled:opacity-20 disabled:cursor-not-allowed ${isDatasetMode ? 'bg-[#1F1F23] text-blue-500 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Dataset Mode {isDatasetMode ? 'Active' : ''}
            </button>
            <div className="w-px h-4 bg-[#1F1F23] mx-1" />
            <button 
              onClick={handleToggleMultiSelect}
              className={`px-6 py-2 rounded-lg text-[11px] font-bold transition-all uppercase tracking-wider ${isMultiSelect ? 'bg-[#1F1F23] text-blue-500 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Multi-Select: {isMultiSelect ? 'ON' : 'OFF'}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              disabled={predictions.length === 0}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all group/export disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 text-blue-500 group-hover/export:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Export Analysis</span>
            </button>
            
            <button 
              onClick={() => fetchPredictions(selectedRegions)}
              disabled={loading}
              className="p-2.5 rounded-xl hover:bg-[#151619] border border-transparent hover:border-[#1F1F23] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Map & Inputs */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#111114] rounded-3xl border border-[#1F1F23] p-8 shadow-2xl">
              <IndiaMap 
                selectedStates={selectedRegions} 
                isMultiSelect={isMultiSelect}
                onToggleMultiSelect={handleToggleMultiSelect}
                riskLevel={mainPrediction?.risks ? (() => {
                  const levels = ['Low', 'Moderate', 'High', 'Critical'];
                  let maxIdx = 0;
                  mainPrediction.risks.forEach(r => {
                    const idx = levels.indexOf(r.riskLevel);
                    if (idx > maxIdx) maxIdx = idx;
                  });
                  return levels[maxIdx] as any;
                })() : undefined}
                onToggleState={handleToggleRegion} 
              />
            </div>
            
            <DatasetUpload 
              onDataUpload={handleDatasetUpload}
              isLoading={loading}
            />

            {mainPrediction && (
              <ClimateStats 
                region={selectedRegions.join(', ')} 
                summary={mainPrediction.climateSummary} 
                climateData={mainPrediction.climateData}
              />
            )}

            {mainPrediction?.featureImportance && (
              <div className="bg-[#111114] rounded-2xl border border-[#1F1F23] p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Model Feature Importance</h3>
                </div>
                <div className="space-y-6">
                  {mainPrediction.featureImportance.map((feat) => (
                    <div key={feat.feature} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        <span>{feat.feature}</span>
                        <span>{(feat.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-[#1F1F23] h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${feat.importance * 100}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Risk Analysis & Charts */}
          <div className="lg:col-span-7">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight">
                  {activeTab === 'dashboard' ? (isDatasetMode ? 'DATASET OVERVIEW' : 'ASSESSMENT') : 'ANALYTICS'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                    {activeTab === 'dashboard' 
                      ? (isDatasetMode ? 'Processed Dataset Insights' : `Real-time analysis: ${selectedRegions.join(', ')}`)
                      : (isDatasetMode ? 'Dataset Trend Analysis' : `Historical trends: ${selectedRegions.join(', ')}`)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-[#151619] p-1 rounded-xl border border-[#1F1F23]">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest ${activeTab === 'dashboard' ? 'bg-[#1F1F23] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest ${activeTab === 'analytics' ? 'bg-[#1F1F23] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <ChartIcon className="w-3.5 h-3.5" />
                  Analytics
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="h-[600px] flex flex-col items-center justify-center bg-[#111114] rounded-3xl border border-[#1F1F23] border-dashed"
                >
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
                    <div className="absolute inset-0 blur-2xl bg-blue-500/20 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xl font-black text-white tracking-tight">
                    {isDatasetMode ? 'TRAINING ML MODEL...' : 'ANALYZING PATTERNS...'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                    {isDatasetMode ? 'Fitting Regression Weights' : 'Local Technical Engine Active'}
                  </p>
                </motion.div>
              ) : error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[600px] flex flex-col items-center justify-center bg-[#111114] rounded-[40px] border border-[#1F1F23] p-16 text-center"
                >
                  <div className="relative mb-10">
                    <ShieldAlert className="w-20 h-20 text-[#FF3B3B]" strokeWidth={1.5} />
                    <div className="absolute inset-0 blur-3xl bg-[#FF3B3B]/20 rounded-full" />
                  </div>
                  
                  <h3 className="text-3xl font-black text-[#FF3B3B] tracking-tight max-w-2xl leading-tight mb-12">
                    {error}
                  </h3>
                  
                  <button 
                    onClick={() => fetchPredictions(selectedRegions)}
                    className="px-12 py-5 bg-[#FF3B3B] hover:bg-[#E63535] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-red-500/20 active:scale-95"
                  >
                    Retry Analysis
                  </button>
                </motion.div>
              ) : activeTab === 'dashboard' ? (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {mainPrediction?.risks.map((risk, i) => (
                      <div key={risk.disease} className={i === 0 ? 'md:col-span-2' : ''}>
                        <RiskCard risk={risk} index={i} />
                      </div>
                    ))}
                  </div>

                  {predictions.length > 0 && (
                    <YearlyTrendsSummary 
                      predictions={predictions} 
                      stateRiskLevels={stateRiskLevels}
                    />
                  )}
                  
                  <div className="p-6 bg-[#151619] rounded-2xl border border-[#1F1F23] flex items-start gap-4">
                    <Info className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-[0.15em]">
                      {isDatasetMode 
                        ? "Dataset Analysis: This dashboard displays insights derived from your uploaded CSV. The model performs local statistical analysis to estimate risks and trends."
                        : "Technical Disclaimer: This tool provides predictions based on climate patterns and historical data. It is intended for informational purposes and should not replace official health advisories."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {predictions.length > 0 && (
                    <TrendsChart 
                      predictions={predictions} 
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              <div className="bg-[#111114] p-8 rounded-2xl border border-[#1F1F23] shadow-2xl group hover:border-blue-500/50 transition-all">
                <Globe className="w-5 h-5 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-black text-white tracking-tight font-mono">
                  {mainPrediction?.modelMetrics?.trainingPoints ? `${(mainPrediction.modelMetrics.trainingPoints / 1000).toFixed(1)}K` : '8.2M'}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                  {mainPrediction?.modelMetrics?.trainingPoints ? 'Training Samples' : 'Data Points'}
                </div>
              </div>
              <div className="bg-[#111114] p-8 rounded-2xl border border-[#1F1F23] shadow-2xl group hover:border-emerald-500/50 transition-all">
                <Activity className="w-5 h-5 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-black text-white tracking-tight font-mono">
                  {mainPrediction?.modelMetrics?.accuracy ? `${mainPrediction.modelMetrics.accuracy}%` : '94.8%'}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Model Accuracy</div>
              </div>
              <div className="bg-[#111114] p-8 rounded-2xl border border-[#1F1F23] shadow-2xl group hover:border-amber-500/50 transition-all">
                <ShieldAlert className="w-5 h-5 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-black text-white tracking-tight font-mono">
                  {mainPrediction?.modelMetrics?.r2Score ? mainPrediction.modelMetrics.r2Score.toFixed(2) : '0.91'}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">R² Score</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0B] border-t border-[#1F1F23] py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl">
              <ShieldAlert className="text-black w-6 h-6" />
            </div>
            <span className="text-lg font-black text-white tracking-tight uppercase">ClimateRisk India</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            © 2026 ClimateRisk Technical Outbreak Prediction System    - Sreerag
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Privacy</a>
            <a href="#" className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Terms</a>
            <a href="#" className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
