import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PERFORMANCE_CSV, DEFAULT_OBSERVATION_CSV } from './constants';
import { processCSV, parseAttributionCSV } from './services/dataProcessor';
import { DealerData, ReportType, AttributionMap, MultiManagerStorage, DealerAttribution } from './types';
import ReportView from './components/ReportView';
import AnalysisPanel from './components/AnalysisPanel';
import html2canvas from 'html2canvas';
import { Download, Upload, FileText, Activity, Eye, Settings, UserCheck, ChevronDown, ChevronUp, Database } from 'lucide-react';

const STORAGE_KEY_ATTRIBUTION = 'audi_dealer_attribution_v4';
const STORAGE_KEY_MULTI_DATA = 'audi_multi_manager_data_v4';

const App: React.FC = () => {
  const [attributions, setAttributions] = useState<AttributionMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ATTRIBUTION);
    return saved ? JSON.parse(saved) : {};
  });
  const [activeManager, setActiveManager] = useState<string>('');
  const [multiData, setMultiData] = useState<MultiManagerStorage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MULTI_DATA);
    return saved ? JSON.parse(saved) : {};
  });

  const [reportType, setReportType] = useState<ReportType>('performance');
  const [activeCity, setActiveCity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [processedData, setProcessedData] = useState<Record<string, DealerData[]> | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  const availableManagers = Array.from(new Set((Object.values(attributions) as DealerAttribution[]).map(a => a.businessManager))).sort();
  const availableCities = activeManager 
    ? Array.from(new Set((Object.values(attributions) as DealerAttribution[]).filter(a => a.businessManager === activeManager).map(a => a.city))).sort()
    : [];

  const currentCsv = (activeManager && multiData[activeManager]) 
    ? multiData[activeManager][reportType] 
    : (reportType === 'performance' ? DEFAULT_PERFORMANCE_CSV : DEFAULT_OBSERVATION_CSV);

  useEffect(() => {
    if (availableManagers.length > 0 && !activeManager) {
      setActiveManager(availableManagers[0]);
    }
  }, [availableManagers, activeManager]);

  useEffect(() => {
    if (availableCities.length > 0 && (!activeCity || !availableCities.includes(activeCity))) {
      setActiveCity(availableCities[0]);
    }
  }, [availableCities, activeCity]);

  useEffect(() => {
    if (activeManager) {
      try {
        const data = processCSV(currentCsv, reportType, attributions, activeManager);
        setProcessedData(data);
      } catch (e) {
        console.error("Processing error", e);
      }
    }
  }, [activeManager, reportType, multiData, attributions, currentCsv]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ATTRIBUTION, JSON.stringify(attributions));
  }, [attributions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MULTI_DATA, JSON.stringify(multiData));
  }, [multiData]);

  const decodeCSV = (buffer: ArrayBuffer): string => {
    const utf8Decoder = new TextDecoder('utf-8');
    const text = utf8Decoder.decode(buffer);
    // Detection of common non-UTF8 chars in Chinese CSVs
    if (text.includes('')) {
      return new TextDecoder('gbk').decode(buffer);
    }
    return text;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: ReportType | 'attribution') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const text = decodeCSV(buffer);

      if (target === 'attribution') {
        setAttributions(parseAttributionCSV(text));
        alert("归属配置已更新");
      } else {
        if (!activeManager) return alert("请先选择商务经理");
        setMultiData(prev => ({
          ...prev,
          [activeManager]: { ...(prev[activeManager] || { performance: '', observation: '' }), [target]: text }
        }));
        alert(`数据已更新`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#F1F3F5' });
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `Report_${activeManager}_${activeCity}_${reportType}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased p-4">
      {/* Mini Top Utility Bar */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
           <div className="bg-audi p-1.5 rounded-lg text-white">
              <FileText size={18} />
           </div>
           <h1 className="text-lg font-black tracking-tighter text-gray-900">上汽奥迪打铁看板</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`p-2 rounded-lg transition-all ${isConfigOpen ? 'bg-purple-100 text-audi' : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-600'}`}
            title="系统设置"
          >
            <Settings size={18} />
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 bg-audi hover:bg-audi/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md">
            <Download size={14} /> 截图导出
          </button>
        </div>
      </div>

      {/* Global Config (Collapsed by default) */}
      {isConfigOpen && (
        <div className="max-w-5xl mx-auto mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="text-xs text-purple-700/80">
            <span className="font-black block uppercase tracking-tighter text-purple-900 mb-0.5">归属配置文件导入</span>
            格式：代理商,城市,商务经理 (CSV)
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg text-xs font-bold text-audi shadow-sm border border-purple-100 hover:bg-purple-50 transition-colors">
            <Upload size={14} /> 覆盖归属配置
            <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'attribution')} className="hidden" />
          </label>
        </div>
      )}

      {/* Main Controls Card */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Manager & Report Type Toggle */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck size={12} /> 商务经理身份
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableManagers.length === 0 ? (
                  <p className="text-xs text-orange-500 font-bold">请先上传归属文件</p>
                ) : (
                  availableManagers.map(mgr => (
                    <button
                      key={mgr}
                      onClick={() => setActiveManager(mgr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeManager === mgr ? 'bg-audi border-audi text-white shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}
                    >
                      {mgr}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">报表模式</label>
              <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                 <button onClick={() => setReportType('performance')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${reportType === 'performance' ? 'bg-white shadow-sm text-audi' : 'text-gray-400'}`}>考核指标</button>
                 <button onClick={() => setReportType('observation')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${reportType === 'observation' ? 'bg-white shadow-sm text-audi' : 'text-gray-400'}`}>观察指标</button>
              </div>
            </div>
          </div>

          {/* Date & Area Selector */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">时间节点</label>
              <div className="flex gap-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">查看区域</label>
              <div className="flex flex-wrap gap-1.5">
                {availableCities.map(city => (
                  <button
                    key={city}
                    onClick={() => setActiveCity(city)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeCity === city ? 'bg-white border-purple-200 text-audi shadow-sm' : 'text-gray-400 border-transparent hover:text-gray-500'}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Editor Area */}
        <div className="mt-6 pt-5 border-t border-gray-50">
           <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Database size={12} className="text-gray-400" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  数据编辑器 <span className="text-audi opacity-60">({activeManager || '-'})</span>
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-audi hover:underline">
                  <Upload size={12} /> 导入报表 CSV
                  <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, reportType)} className="hidden" />
                </label>
                <button 
                  onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                  className="text-[10px] font-bold text-gray-400 flex items-center gap-1 hover:text-gray-600"
                >
                  {isEditorExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {isEditorExpanded ? '折叠' : '展开'}
                </button>
              </div>
           </div>
           <textarea 
             value={currentCsv}
             onChange={(e) => {
               const val = e.target.value;
               setMultiData(prev => ({
                 ...prev,
                 [activeManager]: { ...(prev[activeManager] || { performance: '', observation: '' }), [reportType]: val }
               }));
             }}
             className={`w-full font-mono text-[10px] border border-gray-100 rounded-xl p-3 bg-gray-50/30 outline-none transition-all duration-300 resize-none focus:ring-1 focus:ring-purple-100 ${isEditorExpanded ? 'h-64' : 'h-16'}`}
             placeholder="此处显示 CSV 原始数据，支持手动编辑或上传更新..."
           />
        </div>
      </div>

      {/* Report Preview */}
      <div className="flex flex-col items-center">
        {processedData && activeCity ? (
          <>
            <ReportView 
              city={activeCity} 
              data={processedData[activeCity] || []} 
              startDate={startDate} 
              endDate={endDate} 
              reportRef={reportRef} 
              reportType={reportType} 
            />
            <AnalysisPanel 
              city={activeCity} 
              data={processedData[activeCity] || []} 
              startDate={startDate} 
              endDate={endDate} 
              reportType={reportType} 
            />
          </>
        ) : (
          <div className="flex flex-col items-center py-32 opacity-20">
             <Activity size={48} className="animate-pulse text-audi" />
             <p className="text-sm font-bold mt-4 tracking-widest uppercase">Waiting for Data Source</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;