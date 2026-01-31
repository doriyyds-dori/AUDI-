import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PERFORMANCE_CSV, DEFAULT_OBSERVATION_CSV } from './constants';
import { processCSV, parseAttributionCSV } from './services/dataProcessor';
import { DealerData, ReportType, AttributionMap, MultiManagerStorage, DealerAttribution } from './types';
import ReportView from './components/ReportView';
import AnalysisPanel from './components/AnalysisPanel';
import html2canvas from 'html2canvas';
import { Download, Upload, FileText, Activity, Eye, Settings, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY_ATTRIBUTION = 'audi_dealer_attribution_v3';
const STORAGE_KEY_MULTI_DATA = 'audi_multi_manager_data_v3';

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

  const handleDownload = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#F1F3F5' });
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `Report_${activeManager}_${activeCity}_${reportType}_${startDate}.png`;
    link.click();
  };

  const decodeCSV = (buffer: ArrayBuffer): string => {
    // Attempt UTF-8 first
    const utf8Decoder = new TextDecoder('utf-8');
    const text = utf8Decoder.decode(buffer);
    // If it contains the replacement character, it's likely GBK (Excel standard)
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
        const newMap = parseAttributionCSV(text);
        setAttributions(newMap);
        alert("系统归属配置已更新。");
      } else {
        if (!activeManager) return alert("请先选择商务经理");
        setMultiData(prev => ({
          ...prev,
          [activeManager]: {
            ...(prev[activeManager] || { performance: '', observation: '' }),
            [target]: text
          }
        }));
        alert(`${activeManager} 的数据已更新。`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100 relative">
        
        {/* Top Header & Config Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
             <div className="bg-[#49377C] p-2 rounded-lg text-white">
                <FileText size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">上汽奥迪打铁看板</h1>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isConfigOpen ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white text-gray-400 hover:text-gray-600 border-gray-100'}`}
            >
              <Settings size={14} /> 
              配置中心
              {isConfigOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 bg-[#49377C] hover:bg-[#3a2c63] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
              <Download size={14} /> 下载截图
            </button>
          </div>
        </div>

        {/* Collapsible Global Config */}
        {isConfigOpen && (
          <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="text-xs text-purple-600/80 max-w-md">
                 <span className="font-bold text-purple-800 block mb-1">全局归属配置</span>
                 上传“代理商归属文件”来定义经理管辖范围。格式：代理商,城市,商务经理。
               </div>
               <label className="flex items-center gap-2 cursor-pointer bg-white hover:bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg transition-all shadow-sm">
                  <Upload size={14} className="text-purple-600" />
                  <span className="text-xs font-bold text-purple-700">更新归属 CSV</span>
                  <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'attribution')} className="hidden" />
               </label>
            </div>
          </div>
        )}

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1 space-y-1.5">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
               <UserCheck size={10} /> 商务经理
             </label>
             <div className="flex flex-wrap gap-1">
                {availableManagers.length === 0 ? (
                  <p className="text-[10px] text-orange-500 font-medium">请先上传归属文件</p>
                ) : (
                  availableManagers.map(mgr => (
                    <button
                      key={mgr}
                      onClick={() => setActiveManager(mgr)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${activeManager === mgr ? 'bg-purple-700 border-purple-700 text-white' : 'bg-white text-gray-500 border-gray-100 hover:border-purple-200'}`}
                    >
                      {mgr}
                    </button>
                  ))
                )}
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">指标</label>
             <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button onClick={() => setReportType('performance')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${reportType === 'performance' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-400'}`}>考核</button>
                <button onClick={() => setReportType('observation')} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${reportType === 'observation' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-400'}`}>观察</button>
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">日期</label>
            <div className="flex gap-1">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 text-[10px] border border-gray-100 rounded-md px-1.5 py-1 outline-none" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 text-[10px] border border-gray-100 rounded-md px-1.5 py-1 outline-none" />
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">区域</label>
             <div className="flex flex-wrap gap-1">
                {availableCities.map(city => (
                  <button
                    key={city}
                    onClick={() => setActiveCity(city)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${activeCity === city ? 'bg-white border-purple-200 text-purple-700' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                  >
                    {city}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Compact Editor Area */}
        <div className="border-t border-gray-50 pt-4">
           <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                数据预览与导入 <span className="text-purple-400">({activeManager || '-'} · {reportType === 'performance' ? '考核' : '观察'})</span>
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-purple-700 hover:text-purple-800 transition-colors">
                <Upload size={12} /> 导入经理报表
                <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, reportType)} className="hidden" />
              </label>
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
             className="w-full h-20 font-mono text-[10px] border border-gray-100 rounded-lg p-2 bg-gray-50/30 outline-none resize-none focus:ring-1 focus:ring-purple-100"
             placeholder="CSV 数据内容..."
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
          <div className="flex flex-col items-center py-20 opacity-30">
             <Activity size={32} className="animate-pulse text-purple-300" />
             <p className="text-xs mt-4">等待数据加载...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;