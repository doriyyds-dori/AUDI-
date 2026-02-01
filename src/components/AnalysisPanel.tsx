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
   * 核心复制函数：针对群晖 HTTP 访问环境优化的同步复制
   */
  const performCopy = (text: string, index: number) => {
    const onSuccess = () => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    };

    // 1. 尝试现代 API (仅在 HTTPS 或 localhost 启用)
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(onSuccess)
        .catch(() => fallbackCopy(text, onSuccess));
    } else {
      // 2. 针对 HTTP 环境（群晖 IP 访问），直接使用同步 fallback
      fallbackCopy(text, onSuccess);
    }
  };

  /**
   * 同步降级方案：这是在非安全环境下唯一可靠的复制方式
   */
  const fallbackCopy = (text: string, callback: () => void) => {
    let textArea: HTMLTextAreaElement | null = null;
    try {
      textArea = document.createElement("textarea");
      textArea.value = text;
      
      // 必须设置的样式，确保在文档流中但对用户不可见
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      
      // 移动端兼容性属性
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      
      // 选中逻辑
      textArea.focus();
      textArea.setSelectionRange(0, textArea.value.length);
      textArea.select();
      
      const successful = document.execCommand('copy');
      if (successful) {
        callback();
      } else {
        throw new Error('execCommand returned false');
      }
    } catch (err) {
      console.error('Fallback copy error:', err);
      // 如果自动复制完全被拦截，至少给个弹窗让用户知道出了什么问题
      alert("复制失败。请检查：\n1. 浏览器是否禁用了剪贴板访问\n2. 建议尝试使用 HTTPS 访问群晖");
    } finally {
      if (textArea && textArea.parentNode) {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleCopy = (text: string, index: number) => {
    performCopy(text, index);
  };

  const handleCopyAll = () => {
    const allContent = data.map(d => d.analysis).join('\n\n');
    const fullText = `${title}\n\n${allContent}`;
    performCopy(fullText, -1);
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