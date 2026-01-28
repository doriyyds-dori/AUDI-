export enum City {
  Chengdu = '成都',
  Xian = '西安',
}

export type FormatType = 'percent' | 'integer' | 'float';
export type ReportType = 'performance' | 'observation';

export interface MetricConfig {
  label: string;
  target: number;
  colIndex: number;
  format: FormatType;
  unit?: string;
}

export interface ManagerData {
  name: string;
  metrics: Record<string, number | null>; // metricKey -> value
  failedMetrics: FailedMetric[];
}

export interface FailedMetric {
  label: string;
  value: number;
  target: number;
  unit: string;
  format: FormatType;
}

export interface DealerData {
  name: string;
  summary: ManagerData | null; // The '小计' row
  managers: ManagerData[]; // The individual rows
  isPassing: boolean;
  dealerFailures: FailedMetric[];
  analysis: string; // New field for text summary
}

export interface ReportData {
  city: City;
  dealers: DealerData[];
}