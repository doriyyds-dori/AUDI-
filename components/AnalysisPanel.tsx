
import React from 'react';
// Changed: removed City from imports
import { DealerData, ReportType } from '../types';
import { Copy, Check } from 'lucide-react';

interface AnalysisPanelProps {
  // Changed: City type replaced with string
  city: string;
  data: DealerData[];
  startDate: string;
  endDate: string;
  reportType: ReportType;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ city, data, startDate, endDate, reportType }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  // Helper to format date from YYYY-MM-DD to M/D
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return `${m}/${d}`;
    }
    return dateStr;
  };

  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);
  const dateRangeStr = startDate === endDate ? formattedStart : `${formattedStart}-${formattedEnd}`;

  // Generate the dynamic title based on report type
  const typeLabel = reportType === 'performance' ? '考核数据' : '观察数据';
  const title = `${city}打铁日报${typeLabel} （数据范围：${dateRangeStr}）`;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allContent = data.map(d => d.analysis).join('\n\n'); // Double newline between dealers
    // Include the title when copying all
    const fullText = `${title}\n\n${allContent}`;
    
    navigator.clipboard.writeText(fullText);
    setCopiedIndex(-1); // -1 represents 'All'
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (data.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center">
            <span className="w-2 h-6 bg-purple-700 rounded-full mr-2"></span>
            {title}
          </h3>
          <button
            onClick={handleCopyAll}
            className="text-xs font-medium px-3 py-1.5 rounded bg-white border border-gray-300 hover:bg-gray-50 flex items-center gap-1 transition-colors text-gray-600"
          >
            {copiedIndex === -1 ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copiedIndex === -1 ? "已复制全部" : "复制全部"}
          </button>
        </div>
        
        <div className="divide-y divide-gray-100">
          {data.map((dealer, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors group relative">
              <p className="text-gray-800 text-sm leading-relaxed pr-8 whitespace-pre-line">
                {dealer.analysis}
              </p>
              <button
                onClick={() => handleCopy(dealer.analysis, idx)}
                className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy line"
              >
                {copiedIndex === idx ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
