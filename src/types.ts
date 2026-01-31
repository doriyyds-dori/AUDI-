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
  summary: ManagerData | null;
  managers: ManagerData[];
  isPassing: boolean;
  dealerFailures: FailedMetric[];
  analysis: string;
}

// Support dynamic cities from CSV
export interface DealerAttribution {
  dealerName: string;
  city: string;
  businessManager: string;
}

export type AttributionMap = Record<string, DealerAttribution>;

export interface MultiManagerStorage {
  [managerName: string]: {
    performance: string;
    observation: string;
  };
}