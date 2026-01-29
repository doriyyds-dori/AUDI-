import { DEALERS_BY_CITY, PERFORMANCE_METRICS, OBSERVATION_METRICS, PERFORMANCE_CATEGORIES, OBSERVATION_CATEGORIES } from '../constants';
import { City, DealerData, FailedMetric, ManagerData, MetricConfig, ReportType } from '../types';

// Helper to parse a cell value
const parseValue = (value: string | undefined): number | null => {
  if (!value || value.trim() === '-' || value.trim() === '') return null;
  // Remove commas (thousands separator) and percent signs
  const clean = value.replace(/,/g, '').replace(/%/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
};

// Check if a value fails the target
const checkFailure = (value: number | null, config: MetricConfig): boolean => {
  if (value === null) return false;
  // All metrics provided seem to be "Higher is better"
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
      // Handle escaped quotes: "" inside a quoted string becomes "
      if (inQuotes && line[i + 1] === '"') {
        currentVal += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
};

const getAnalysisParts = (failures: FailedMetric[], categories: Record<string, string[]>): string[] => {
  // Exclude specific metrics from textual analysis as requested
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
  let fullText = '';

  if (dealerParts.length > 0) {
    fullText = `${name}：主要问题集中在${dealerParts.join('；')}。`;
  } else {
    fullText = `${name}：各项指标达成情况良好，无明显短板，请保持。`;
  }

  const managerIssues: string[] = [];
  managers.forEach(mgr => {
    const mgrParts = getAnalysisParts(mgr.failedMetrics, categories);
    if (mgrParts.length > 0) {
      // Format: "ManagerName（Issue1；Issue2）"
      managerIssues.push(`${mgr.name}（${mgrParts.join('；')}）`);
    }
  });

  if (managerIssues.length > 0) {
    // Add newlines to separate each manager for better readability and clear layout
    fullText += `\n需重点关注管家：\n${managerIssues.join('；\n')}。`;
  }

  return fullText;
};

export const processCSV = (csvContent: string, reportType: ReportType): Record<City, DealerData[]> => {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const result: Record<City, DealerData[]> = {
    [City.Chengdu]: [],
    [City.Xian]: [],
  };

  const metricsConfig = reportType === 'performance' ? PERFORMANCE_METRICS : OBSERVATION_METRICS;
  const categoriesConfig = reportType === 'performance' ? PERFORMANCE_CATEGORIES : OBSERVATION_CATEGORIES;

  // Build a map of Dealer Name -> Lines
  const rawDealerMap: Record<string, string[][]> = {};

  for (const line of lines) {
    const row = parseCSVLine(line);
    
    // Check if it's a data row. Column 0 should be a dealer name.
    if (row.length > 1) {
      const dealerName = row[0]?.trim();
      if (dealerName && dealerName !== '代理商' && dealerName !== '总计') {
        if (!rawDealerMap[dealerName]) {
          rawDealerMap[dealerName] = [];
        }
        rawDealerMap[dealerName].push(row);
      }
    }
  }

  // Process each city
  for (const city of Object.values(City)) {
    const dealerNames = DEALERS_BY_CITY[city];
    
    for (const dName of dealerNames) {
      const rows = rawDealerMap[dName];
      if (!rows) continue; // Dealer not found in CSV

      let summary: ManagerData | null = null;
      const managers: ManagerData[] = [];

      for (const row of rows) {
        const managerName = row[1]?.trim();
        const failures = getFailures(row, metricsConfig);
        const metricValues = parseMetricsForRow(row, metricsConfig);

        const data: ManagerData = {
          name: managerName,
          metrics: metricValues,
          failedMetrics: failures,
        };

        if (managerName === '小计') {
          summary = data;
        } else {
            // Only add managers if they have failures
            if (failures.length > 0) {
                 managers.push(data);
            }
        }
      }

      if (summary) {
        result[city].push({
          name: dName,
          summary: summary,
          managers: managers,
          isPassing: summary.failedMetrics.length === 0,
          dealerFailures: summary.failedMetrics,
          analysis: generateDealerAnalysis(dName, summary.failedMetrics, managers, categoriesConfig),
        });
      }
    }
  }

  return result;
};
