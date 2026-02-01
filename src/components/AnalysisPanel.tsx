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
   * 降级方案：execCommand + 手动 Prompt 保底
   */
  const tryFallback = (text: string, callback: () => void) => {
    let textArea: HTMLTextAreaElement | null = null;
    let successful = false;

    try {
      textArea = document.createElement("textarea");
      textArea.value = text;
      // 必须让元素在 DOM 中可见（但视觉不可见）才能被选中
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      successful = document.execCommand('copy');
      if (successful) {
        callback();
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    } finally {
      if (textArea) document.body.removeChild(textArea);
    }

    // 如果自动复制失败，弹出保底对话框
    if (!successful) {
      window.prompt("当前环境禁止自动写入剪贴板，请手动复制：", text);
    }
  };

  /**
   * 终极复制入口
   */
  const executeCopy = (text: string, index: number) => {
    const onSuccess = () => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    };

    // 只有在 HTTPS 或 Localhost 且 API 可用时才使用新 API
    if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text)
        .then(onSuccess)
        .catch(() => tryFallback(text, onSuccess));
    } else {
      // HTTP 环境直接降级
      tryFallback(text, onSuccess);
    }
  };

  const handleCopy = (text: string, index: number) => {
    executeCopy(text, index);
  };

  const handleCopyAll = () => {
    const allContent = data.map(d => d.analysis).join('\n\n');
    const fullText = `${title}\n\n${allContent}`;
    executeCopy(fullText, -1);
  };

  if (data.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-12 px-4 md:px-0">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center text-sm md:text-base">
            <span className="w-1.5 h-5 bg-purple-700 rounded-full mr-2 shrink-0"></span>
            {title}
          </h3>
          <button
            onClick={handleCopyAll}
            className="shrink-0 text-[10px] md:text-xs font-bold px-2 md:px-3 py-1.5 rounded bg-white border border-gray-300 hover:bg-gray-50 flex items-center gap-1 transition-all text-gray-600 active:scale-95 shadow-sm"
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
                className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity active:scale-90"
              >
                {copiedIndex === idx ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-1">
        <p className="text-[10px] text-gray-400 text-center">
          提示：若无法自动复制，请在弹出框中手动复制。
        </p>
        <span className="text-[8px] text-gray-300 font-mono">v2.6.2 (HTTP FIX)</span>
      </div>
    </div>
  );
};

export default AnalysisPanel;