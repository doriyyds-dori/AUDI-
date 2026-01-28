import React from 'react';
import { DealerData, FailedMetric } from '../types';
import { ThumbsUp, AlertTriangle, Phone, Car, Smile } from 'lucide-react';
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
    <span className={`${isManager ? 'text-gray-700' : 'text-red-600'} font-medium mr-3 text-sm`}>
      {metric.label}: <span className={isManager ? 'text-black' : 'text-red-700 font-bold'}>{formattedValue}</span>
      {metric.unit && <span className="text-xs ml-0.5">{metric.unit}</span>}
      {!isManager && (
        <span className="text-xs text-gray-400 ml-1">
          /{formattedTarget}{metric.unit}
        </span>
      )}
    </span>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Card Header */}
      <div className="p-5 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-800">{data.name}</h3>
          
          {issueConfig && (
            <div 
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${issueConfig.color}`}
              title={`主要问题集中在：${dominantIssue}`}
            >
              <issueConfig.icon size={12} strokeWidth={2.5} />
              <span>{issueConfig.label}需关注</span>
            </div>
          )}
        </div>

        <div
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            data.isPassing
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {data.isPassing ? '达标' : '未达标'}
        </div>
      </div>

      <div className="p-5 pt-0">
        {/* Scenario 1: Everything is perfect */}
        {isAllGood && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <ThumbsUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-medium">所有管家均达标</p>
          </div>
        )}

        {/* Scenario 2: Dealer Level Failures */}
        {!data.isPassing && (
          <div className="mb-6">
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 mt-2">
              代理商维度 · 不达标项
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.dealerFailures.map((fail, idx) => (
                <div key={idx} className="bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                   <FailedMetricTag metric={fail} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scenario 3: Manager Failures */}
        {data.managers.length > 0 && (
          <div>
            <h4 className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
              <AlertTriangle className="w-3 h-3 mr-1" />
              需关注管家 ({data.managers.length}人)
            </h4>
            
            <div className="space-y-3">
              {data.managers.map((manager, idx) => (
                <div key={idx} className="flex items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {/* Avatar Placeholder */}
                  <div className="flex-shrink-0 w-10 h-10 rounded bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm mr-3 mt-0.5">
                    {manager.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-base mb-1">{manager.name}</div>
                    <div className="flex flex-wrap gap-y-1">
                      {manager.failedMetrics.map((fail, fIdx) => (
                        <FailedMetricTag key={fIdx} metric={fail} isManager />
                      ))}
                    </div>
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