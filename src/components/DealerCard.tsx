import React from 'react';
import { DealerData, FailedMetric } from '../types';
import { ThumbsUp, AlertTriangle, Phone, Car, Smile, TrendingDown } from 'lucide-react';
import { PERFORMANCE_CATEGORIES, OBSERVATION_CATEGORIES } from '../constants';

interface DealerCardProps {
  data: DealerData;
}

const formatValue = (value: number, format: string): string => {
  if (format === 'float') {
    return value.toFixed(2);
  }
  if (format === 'integer') {
    return Math.round(value).toString();
  }
  return value.toString();
};

const formatTarget = (value: number, format: string): string => {
   if (format === 'float') {
    return value.toFixed(2);
   }
   return value.toString();
}

const FailedMetricTag: React.FC<{ metric: FailedMetric; isManager?: boolean }> = ({ metric, isManager }) => {
  const formattedValue = formatValue(metric.value, metric.format);
  const formattedTarget = formatTarget(metric.target, metric.format);

  return (
    <div className={`inline-flex items-center gap-1.5 ${isManager ? 'bg-white border border-gray-200' : 'bg-red-50 border border-red-100'} px-2 py-1 rounded text-xs leading-none`}>
      <span className="text-gray-500 font-medium">{metric.label}</span>
      <div className="h-3 w-[1px] bg-gray-300 mx-0.5"></div>
      <span className={`${isManager ? 'text-gray-900' : 'text-red-700'} font-bold font-mono`}>
        {formattedValue}{metric.unit}
      </span>
      {!isManager && (
        <span className="text-[10px] text-gray-400">
          / {formattedTarget}{metric.unit}
        </span>
      )}
    </div>
  );
};

// Merge all categories to find the dominant one
const ALL_CATEGORIES = { ...PERFORMANCE_CATEGORIES, ...OBSERVATION_CATEGORIES };

const getDominantCategory = (failures: FailedMetric[]) => {
  const counts: Record<string, number> = {};
  
  failures.forEach(f => {
    for (const [category, metrics] of Object.entries(ALL_CATEGORIES)) {
      if (metrics.includes(f.label)) {
        counts[category] = (counts[category] || 0) + 1;
      }
    }
  });

  let max = 0;
  let dominant = null;

  for (const [cat, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      dominant = cat;
    }
  }
  return dominant;
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType, color: string, label: string }> = {
  // Performance Categories
  '线索邀约': { icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-100', label: '线索' },
  '试乘试驾': { icon: Car, color: 'text-purple-600 bg-purple-50 border-purple-100', label: '试驾' },
  '客户满意度': { icon: Smile, color: 'text-orange-600 bg-orange-50 border-orange-100', label: '满意度' },
  
  // Observation Categories
  '邀约相关': { icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-100', label: '邀约' },
  '接待和跟进相关': { icon: Car, color: 'text-purple-600 bg-purple-50 border-purple-100', label: '接待' },
};

const DealerCard: React.FC<DealerCardProps> = ({ data }) => {
  const isAllGood = data.isPassing && data.managers.length === 0;
  const dominantIssue = !data.isPassing ? getDominantCategory(data.dealerFailures) : null;
  const issueConfig = dominantIssue ? CATEGORY_CONFIG[dominantIssue] : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-5">
      {/* Card Header */}
      <div className="px-5 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-6 rounded-full ${data.isPassing ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="text-lg font-bold text-gray-800 tracking-tight">{data.name}</h3>
        </div>

        <div className="flex items-center gap-3">
          {issueConfig && (
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wider ${issueConfig.color}`}
            >
              <issueConfig.icon size={12} strokeWidth={2.5} />
              <span>{issueConfig.label}</span>
            </div>
          )}
          
          <div
            className={`px-3 py-1 rounded text-xs font-bold ${
              data.isPassing
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {data.isPassing ? '达标' : '未达标'}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Scenario 1: Everything is perfect */}
        {isAllGood && (
          <div className="flex flex-col items-center justify-center py-4 text-gray-400">
            <div className="bg-green-50 p-2 rounded-full mb-2">
              <ThumbsUp className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-xs font-medium">各项指标表现优异</p>
          </div>
        )}

        {/* Scenario 2: Dealer Level Failures */}
        {!data.isPassing && (
          <div className="mb-5">
            <h4 className="flex items-center text-red-900/60 text-[10px] font-bold uppercase tracking-widest mb-2.5">
              <TrendingDown className="w-3 h-3 mr-1.5" />
              店端未达标项
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.dealerFailures.map((fail, idx) => (
                <FailedMetricTag key={idx} metric={fail} />
              ))}
            </div>
          </div>
        )}

        {/* Scenario 3: Manager Failures */}
        {data.managers.length > 0 && (
          <div>
             {/* Divider if both exist */}
            {!data.isPassing && <div className="h-px bg-gray-100 mb-5"></div>}

            <h4 className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3">
              <AlertTriangle className="w-3 h-3 mr-1.5" />
              需关注管家 ({data.managers.length})
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              {data.managers.map((manager, idx) => (
                <div key={idx} className="flex items-start bg-slate-50 p-2.5 rounded border border-slate-100">
                  {/* Avatar Name Tag */}
                  <div className="flex-shrink-0 w-16 bg-white border border-gray-200 rounded text-center py-1 mr-3 shadow-sm">
                    <span className="block text-xs font-bold text-gray-700">{manager.name}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-wrap gap-1.5 pt-0.5">
                    {manager.failedMetrics.map((fail, fIdx) => (
                      <FailedMetricTag key={fIdx} metric={fail} isManager />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerCard;