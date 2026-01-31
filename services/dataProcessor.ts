import { PERFORMANCE_METRICS, OBSERVATION_METRICS, PERFORMANCE_CATEGORIES, OBSERVATION_CATEGORIES } from '../constants';
import { DealerData, FailedMetric, ManagerData, MetricConfig, ReportType, AttributionMap } from '../types';

const parseValue = (value: string | undefined): number | null => {
  if (!value || value.trim() === '-' || value.trim() === '') return null;
  const clean = value.replace(/,/g, '').replace(/%/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
};

const checkFailure = (value: number | null, config: MetricConfig): boolean => {
  if (value === null) return false;
  return value < config.target;
};

const getFailures = (row: string[], metrics: Record<string, MetricConfig>): FailedMetric[] => {
  const failures: FailedMetric[] = [];
  for (const key in metrics) {
    const config = metrics[key];
    const val = parseValue(row[config.colIndex]);
    if (checkFailure(val, config)) {
      failures.push({
        label: config.label,
        value: val!,
        target: config.target,
        unit: config.unit || '',
        format: config.format,
      });
    }
  }
  return failures;
};

const parseMetricsForRow = (row: string[], metrics: Record<string, MetricConfig>): Record<string, number | null> => {
  const result: Record<string, number | null> = {};
  for (const key in metrics) {
    result[key] = parseValue(row[metrics[key].colIndex]);
  }
  return result;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else currentVal += char;
  }
  result.push(currentVal);
  return result;
};

const getAnalysisParts = (failures: FailedMetric[], categories: Record<string, string[]>): string[] => {
  const meaningfulFailures = failures.filter(f => f.label !== '试乘试驾满意度');
  const categoryIssues: Record<string, string[]> = {};
  meaningfulFailures.forEach(fail => {
    for (const [category, metrics] of Object.entries(categories)) {
      if (metrics.includes(fail.label)) {
        if (!categoryIssues[category]) categoryIssues[category] = [];
        categoryIssues[category].push(fail.label);
        break;
      }
    }
  });
  return Object.keys(categoryIssues).map(cat => {
    const specificMetrics = categoryIssues[cat].join('、');
    return `${cat}方面（${specificMetrics}）`;
  });
};

const generateDealerAnalysis = (name: string, dealerFailures: FailedMetric[], managers: ManagerData[], categories: Record<string, string[]>): string => {
  const dealerParts = getAnalysisParts(dealerFailures, categories);
  let fullText = dealerParts.length > 0 ? `${name}：主要问题集中在${dealerParts.join('；')}。` : `${name}：各项指标达成情况良好，无明显短板，请保持。`;
  const managerIssues: string[] = [];
  managers.forEach(mgr => {
    const mgrParts = getAnalysisParts(mgr.failedMetrics, categories);
    if (mgrParts.length > 0) managerIssues.push(`${mgr.name}（${mgrParts.join('；')}）`);
  });
  if (managerIssues.length > 0) fullText += `\n需重点关注管家：\n${managerIssues.join('；\n')}。`;
  return fullText;
};

export const processCSV = (csvContent: string, reportType: ReportType, attribution: AttributionMap, activeManager: string): Record<string, DealerData[]> => {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const result: Record<string, DealerData[]> = {};
  const metricsConfig = reportType === 'performance' ? PERFORMANCE_METRICS : OBSERVATION_METRICS;
  const categoriesConfig = reportType === 'performance' ? PERFORMANCE_CATEGORIES : OBSERVATION_CATEGORIES;

  const rawDealerMap: Record<string, string[][]> = {};
  lines.forEach(line => {
    const row = parseCSVLine(line);
    const dealerName = row[0]?.trim();
    if (dealerName && dealerName !== '代理商' && dealerName !== '总计') {
      const attr = attribution[dealerName];
      // Only process if dealer belongs to the current manager
      if (attr && attr.businessManager === activeManager) {
        if (!rawDealerMap[dealerName]) rawDealerMap[dealerName] = [];
        rawDealerMap[dealerName].push(row);
      }
    }
  });

  Object.keys(rawDealerMap).forEach(dName => {
    const rows = rawDealerMap[dName];
    const attr = attribution[dName];
    if (!attr) return;

    if (!result[attr.city]) result[attr.city] = [];

    let summary: ManagerData | null = null;
    const managers: ManagerData[] = [];
    rows.forEach(row => {
      const managerName = row[1]?.trim();
      const failures = getFailures(row, metricsConfig);
      const metricValues = parseMetricsForRow(row, metricsConfig);
      const data: ManagerData = { name: managerName, metrics: metricValues, failedMetrics: failures };
      if (managerName === '小计') summary = data;
      else if (failures.length > 0) managers.push(data);
    });

    if (summary) {
      result[attr.city].push({
        name: dName,
        summary: summary,
        managers: managers,
        isPassing: (summary as ManagerData).failedMetrics.length === 0,
        dealerFailures: (summary as ManagerData).failedMetrics,
        analysis: generateDealerAnalysis(dName, (summary as ManagerData).failedMetrics, managers, categoriesConfig),
      });
    }
  });

  return result;
};

export const parseAttributionCSV = (csvContent: string): AttributionMap => {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const map: AttributionMap = {};
  lines.forEach((line, index) => {
    if (index === 0) return;
    const parts = line.split(',').map(s => s.trim());
    if (parts.length >= 3) {
      const [name, city, manager] = parts;
      if (name && city && manager) {
        map[name] = { dealerName: name, city, businessManager: manager };
      }
    }
  });
  return map;
};