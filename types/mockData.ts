export interface ClimateEvent {
  id: string;
  name: string;
  date: string;
  type: 'drought' | 'flood' | 'typhoon' | 'heatwave' | 'wildfire' | 'other';
  region: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface PolicyUpdate {
  id: string;
  title: string;
  date: string;
  country: string;
  type: 'carbon_tax' | 'emission_regulation' | 'subsidy' | 'green_finance' | 'other';
  impact: 'high' | 'medium' | 'low';
  summary: string;
}

export interface RiskScore {
  id: string;
  name: string;
  physicalRisk: number; // 1-10
  transitionRisk: number; // 1-10
  totalRisk: number; // 1-10
  industry: string;
  percentile: number; // 行业百分位
}

export interface Corporation {
  id: string;
  name: string;
  code: string;
  industry: string;
  location: string;
  carbonIntensity: number;
  greenElectricityRatio: number;
  riskScore: RiskScore;
  financialImpact: {
    ebitdaChange: number;
    valuationAdjustment: number;
  };
}

export interface Industry {
  id: string;
  name: string;
  physicalRiskExposure: number;
  transitionRiskExposure: number;
  overallRiskScore: number;
  financialImpact: {
    revenueChange: number; 
    marginChange: number;
    valuationMultiple: number;
  };
  adaptationScore: number;
  riskType: 'resilient' | 'neutral' | 'high_potential' | 'vulnerable';
}

export interface Bank {
  id: string;
  name: string;
  assetSize: number; // 单位：亿元
  highCarbonLoanRatio: number; // 高碳产业贷款占比
  physicalRiskExposure: number; // 1-10
  transitionRiskExposure: number; // 1-10
  carBaseline: number; // 资本充足率基准值
  carStressTest: number; // 压力测试后的资本充足率
  provisionCoverage: number; // 拨备覆盖率
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export interface TableData {
  headers: string[];
  rows: Record<string, any>[];
} 