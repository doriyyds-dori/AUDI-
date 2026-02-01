import React from 'react';
import { DealerData, ReportType } from '../types';
import { Copy, Check, ExternalLink } from 'lucide-react';

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
   * 终极复制逻辑
   */
  const executeCopy = (text: string, index: number) => {
    const onSuccess = () => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    };

    // 1. 尝试现代 API (仅在 HTTPS 下有效)
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(onSuccess)
        .catch(() => tryFallback(text, onSuccess));
    } else {
      // 2. HTTP 环境下直接尝试同步降级方案
      tryFallback(text, onSuccess);
    }
  };

  /**
   * 降级方案：execCommand + 手动 Prompt 保底
   */
  const tryFallback = (text: string, callback: () => void) => {
    let textArea: HTMLTextAreaElement | null = null;
    let successful = false;

    try {
      // 创建隐藏的文本域
      textArea = document.createElement("textarea");
      textArea.value = text;
      
      // 样式确保其在视图内但不可见，增加选中成功的概率
      textArea.style.position = "fixed";
      textArea.style.left = "0";
      textArea.style.top = "0";
      textArea.style.opacity = "0.01";
      textArea.style.width = "100px";
      textArea.style.height = "100px";
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      
      // 执行复制
      successful = document.execCommand('copy');
      
      if (successful) {
        callback();
      }
    } catch (err) {
      console.error('execCommand Error:', err);
    } finally {
      if (textArea) {
        document.body.removeChild(textArea);
      }
    }

    // 3. 如果 execCommand 失败（在 HTTP + 移动端很常见），使用 Prompt 弹窗保底
    if (!successful) {
      // 这是一个 100% 成功的方案，因为它调用了系统原生的对话框
      window.prompt("由于浏览器安全限制，无法自动写入剪贴板。\n请按下 Ctrl+C (或长按手机屏幕) 复制下方内容：", text);
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
    <div className="max-w-2xl mx-auto mt-8 mb-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center">
            <span className="w-2 h-6 bg-purple-700 rounded-full mr-2"></span>
            {title}
          </h3>
          <button
            onClick={handleCopyAll}
            className="text-xs font-medium px-3 py-1.5 rounded bg-white border border-gray-300 hover:bg-gray-50 flex items-center gap-1 transition-colors text-gray-600 active:scale-95"
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
                className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity active:scale-90"
                title="复制此行"
              >
                {copiedIndex === idx ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[10px] text-gray-400 text-center">
        提示：若无法自动复制，请尝试使用 HTTPS 访问或在弹出框中手动复制。
      </p>
    </div>
  );
};

export default AnalysisPanel;