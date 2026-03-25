export interface ClimateData {
  temperature: number;
  humidity: number;
  rainfall: number;
  region: string;
  year: number;
}

export interface DiseaseRisk {
  disease: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  score: number; // 0-100
  description: string;
  recommendations: string[];
  predictedCases?: number;
  trendPercent?: number;
}

export interface TrendPoint {
  year: number;
  cases: number;
  predicted?: number;
  dengue?: number;
  malaria?: number;
  cholera?: number;
  isForecast?: boolean;
}

export interface PredictionResult {
  region: string;
  risks: DiseaseRisk[];
  climateSummary: string;
  climateData?: ClimateData;
  featureImportance?: { feature: string; importance: number }[];
  yearlyTrends?: TrendPoint[];
  actualVsPredicted?: { point: number; actual: number; predicted: number }[];
  modelMetrics?: {
    accuracy?: number;
    r2Score?: number;
    trainingPoints?: number;
    modelType?: string;
  };
}
