import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PERFORMANCE_CSV, DEFAULT_OBSERVATION_CSV } from './constants';
import { processCSV, parseAttributionCSV } from './services/dataProcessor';
import { DealerData, ReportType, AttributionMap, MultiManagerStorage, DealerAttribution } from './types';
import ReportView from './components/ReportView';
import AnalysisPanel from './components/AnalysisPanel';
import html2canvas from 'html2canvas';
import { Download, Upload, FileText, Activity, Settings, UserCheck, Database, Trash2 } from 'lucide-react';

const STORAGE_KEY_ATTRIBUTION = 'audi_dealer_attribution_v6';
const STORAGE_KEY_MULTI_DATA = 'audi_multi_manager_data_v6';

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

  const availableManagers = Array.from(new Set((Object.values(attributions) as DealerAttribution[]).map(a => a.businessManager))).filter(Boolean).sort();
  const availableCities = activeManager 
    ? Array.from(new Set((Object.values(attributions) as DealerAttribution[]).filter(a => a.businessManager === activeManager).map(a => a.city))).filter(Boolean).sort()
    : [];

  const currentCsv = (activeManager && multiData[activeManager]) 
    ? multiData[activeManager][reportType] 
    : (reportType === 'performance' ? DEFAULT_PERFORMANCE_CSV : DEFAULT_OBSERVATION_CSV);

  useEffect(() => {
    if (availableManagers.length > 0 && (!activeManager || !availableManagers.includes(activeManager))) {
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
    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return new TextDecoder('utf-8').decode(buffer);
    }
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      return decoder.decode(buffer);
    } catch (e) {
      return new TextDecoder('gbk').decode(buffer);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: ReportType | 'attribution') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const text = decodeCSV(buffer);

      if (target === 'attribution') {
        const newMap = parseAttributionCSV(text);
        setAttributions(newMap);
        const count = Object.keys(newMap).length;
        alert(count > 0 ? `归属表导入成功：已识别 ${count} 个代理商` : "未识别到数据");
      } else {
        if (!activeManager) return alert("请先选择经理");
        setMultiData(prev => ({
          ...prev,
          [activeManager]: { ...(prev[activeManager] || { performance: '', observation: '' }), [target]: text }
        }));
        alert(`数据已载入`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const clearAllCache = () => {
    if (window.confirm("确定要重置应用吗？")) {
      localStorage.removeItem(STORAGE_KEY_ATTRIBUTION);
      localStorage.removeItem(STORAGE_KEY_MULTI_DATA);
      window.location.reload();
    }
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#F1F3F5' });
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `SAIC_AUDI_${activeManager}_${activeCity}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased p-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
           <div className="bg-audi p-1.5 rounded-lg text-white">
              <FileText size={18} />
           </div>
           <h1 className="text-lg font-black tracking-tighter text-gray-900">上汽奥迪打铁看板 v2.6.2</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`p-2 rounded-lg transition-all border ${isConfigOpen ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'}`}
          >
            <Settings size={18} />
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 bg-audi hover:bg-audi/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md">
            <Download size={14} /> 截图导出
          </button>
        </div>
      </div>

      {isConfigOpen && (
        <div className="max-w-5xl mx-auto mb-4 p-5 bg-white rounded-2xl border-2 border-purple-100 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-xs">
              <h4 className="font-black text-purple-900 flex items-center gap-2"><Settings size={16} /> 系统管理</h4>
              <p className="text-gray-500">导入 CSV 后若乱码，请先点击“清空数据”。</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={clearAllCache} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold border border-red-100">清空数据</button>
              <label className="bg-purple-600 text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer">
                导入归属表 <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'attribution')} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">商务经理</label>
              <div className="flex flex-wrap gap-1.5">
                {availableManagers.map(mgr => (
                  <button key={mgr} onClick={() => setActiveManager(mgr)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${activeManager === mgr ? 'bg-audi border-audi text-white shadow-md' : 'bg-white text-gray-500 border-gray-100'}`}>{mgr}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">报表类型</label>
              <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                 <button onClick={() => setReportType('performance')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${reportType === 'performance' ? 'bg-white text-audi shadow-sm' : 'text-gray-400'}`}>考核指标</button>
                 <button onClick={() => setReportType('observation')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${reportType === 'observation' ? 'bg-white text-audi shadow-sm' : 'text-gray-400'}`}>观察指标</button>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">统计周期</label>
              <div className="flex gap-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 text-xs border rounded-lg px-3 py-2" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 text-xs border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">查看区域</label>
              <div className="flex flex-wrap gap-1.5">
                {availableCities.map(city => (
                  <button key={city} onClick={() => setActiveCity(city)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${activeCity === city ? 'bg-white border-purple-200 text-audi' : 'text-gray-400 border-transparent'}`}>{city}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-gray-50">
           <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">数据编辑器</h3>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer text-[10px] font-bold text-audi hover:underline">上传报表 CSV <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, reportType)} className="hidden" /></label>
                <button onClick={() => setIsEditorExpanded(!isEditorExpanded)} className="text-[10px] font-bold text-gray-400">{isEditorExpanded ? '折叠' : '展开'}</button>
              </div>
           </div>
           <textarea value={currentCsv} onChange={(e) => setMultiData(prev => ({...prev, [activeManager]: {...(prev[activeManager] || {performance: '', observation: ''}), [reportType]: e.target.value}}))} className={`w-full font-mono text-[10px] border rounded-xl p-3 bg-gray-50 outline-none transition-all ${isEditorExpanded ? 'h-64' : 'h-16'}`} />
        </div>
      </div>

      <div className="flex flex-col items-center">
        {processedData && activeCity && processedData[activeCity]?.length > 0 ? (
          <>
            <ReportView city={activeCity} data={processedData[activeCity] || []} startDate={startDate} endDate={endDate} reportRef={reportRef} reportType={reportType} />
            <AnalysisPanel city={activeCity} data={processedData[activeCity] || []} startDate={startDate} endDate={endDate} reportType={reportType} />
          </>
        ) : (
          <div className="py-32 opacity-20 flex flex-col items-center"><Activity size={48} className="animate-pulse text-audi" /><p className="text-xs font-bold mt-4">等待数据导入...</p></div>
        )}
      </div>
    </div>
  );
};

export default App;