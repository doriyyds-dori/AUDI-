import React from 'react';
import { DealerData, ReportType } from '../types';
import { Copy, Check } from 'lucide-react';

interface AnalysisPanelProps {
  city: string;
  data: DealerData[];
  startDate: string;
  endDate: string;
  reportType: ReportType;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ city, data, startDate, endDate, reportType }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

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

  const typeLabel = reportType === 'performance' ? '考核数据' : '观察数据';
  const title = `${city}打铁日报${typeLabel} （数据范围：${dateRangeStr}）`;

  /**
   * 极强力复制工具：兼容 HTTP 和 HTTPS 环境
   */
  const executeCopy = (text: string, onSuccess: () => void) => {
    // 1. 如果是 HTTPS 环境且支持现代 API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => onSuccess())
        .catch(() => fallbackCopy(text, onSuccess));
    } else {
      // 2. 如果是 HTTP 环境（如群晖本地访问），必须使用同步方案
      fallbackCopy(text, onSuccess);
    }
  };

  /**
   * 同步降级方案：解决 HTTP 环境下 API 禁用的问题
   */
  const fallbackCopy = (text: string, onSuccess: () => void) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // 样式确保它在屏幕外但不被隐藏（隐藏会导致复制失败）
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.style.opacity = "0";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        onSuccess();
      } else {
        alert("浏览器限制了自动复制，请手动选择文字复制。");
      }
    } catch (err) {
      console.error('Fallback copy error:', err);
      alert("复制功能在当前浏览器环境中不可用。");
    }
  };

  const handleCopy = (text: string, index: number) => {
    executeCopy(text, () => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleCopyAll = () => {
    const allContent = data.map(d => d.analysis).join('\n\n');
    const fullText = `${title}\n\n${allContent}`;
    executeCopy(fullText, () => {
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
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
              <p className="text-gray-800 text-sm leading-relaxed pr-10 whitespace-pre-line">
                {dealer.analysis}
              </p>
              <button
                onClick={() => handleCopy(dealer.analysis, idx)}
                className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                title="复制此行"
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