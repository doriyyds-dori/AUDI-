import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PERFORMANCE_CSV, DEFAULT_OBSERVATION_CSV } from './constants';
import { processCSV, parseAttributionCSV } from './services/dataProcessor';
import { DealerData, ReportType, AttributionMap, MultiManagerStorage, DealerAttribution } from './types';
import ReportView from './components/ReportView';
import AnalysisPanel from './components/AnalysisPanel';
import html2canvas from 'html2canvas';
import { Download, Upload, FileText, Activity, Eye, Settings, UserCheck } from 'lucide-react';

const STORAGE_KEY_ATTRIBUTION = 'audi_dealer_attribution_v3';
const STORAGE_KEY_MULTI_DATA = 'audi_multi_manager_data_v3';

const App: React.FC = () => {
  // 1. Core State: Attribution & Managers
  const [attributions, setAttributions] = useState<AttributionMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ATTRIBUTION);
    return saved ? JSON.parse(saved) : {};
  });
  const [activeManager, setActiveManager] = useState<string>('');

  // 2. Core State: Multi-Manager Data
  const [multiData, setMultiData] = useState<MultiManagerStorage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MULTI_DATA);
    return saved ? JSON.parse(saved) : {};
  });

  // 3. View State
  const [reportType, setReportType] = useState<ReportType>('performance');
  const [activeCity, setActiveCity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [processedData, setProcessedData] = useState<Record<string, DealerData[]> | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Derived Values
  const availableManagers = Array.from(new Set((Object.values(attributions) as DealerAttribution[]).map(a => a.businessManager))).sort();
  const availableCities = activeManager 
    ? Array.from(new Set((Object.values(attributions) as DealerAttribution[]).filter(a => a.businessManager === activeManager).map(a => a.city))).sort()
    : [];

  const currentCsv = (activeManager && multiData[activeManager]) 
    ? multiData[activeManager][reportType] 
    : (reportType === 'performance' ? DEFAULT_PERFORMANCE_CSV : DEFAULT_OBSERVATION_CSV);

  // Effects
  useEffect(() => {
    if (availableManagers.length > 0 && !activeManager) {
      setActiveManager(availableManagers[0]);
    }
  }, [availableManagers]);

  useEffect(() => {
    if (availableCities.length > 0 && (!activeCity || !availableCities.includes(activeCity))) {
      setActiveCity(availableCities[0]);
    }
  }, [availableCities]);

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

  // Persistence
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: ReportType | 'attribution') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (target === 'attribution') {
        const newMap = parseAttributionCSV(text);
        setAttributions(newMap);
        alert("系统配置已更新。");
      } else {
        if (!activeManager) return alert("请先选择商务经理");
        setMultiData(prev => ({
          ...prev,
          [activeManager]: {
            ...(prev[activeManager] || { performance: '', observation: '' }),
            [target]: text
          }
        }));
        alert(`${activeManager} 的 ${target === 'performance' ? '考核' : '观察'}数据已覆盖更新。`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleManualEdit = (text: string) => {
    if (!activeManager) return;
    setMultiData(prev => ({
      ...prev,
      [activeManager]: {
        ...(prev[activeManager] || { performance: '', observation: '' }),
        [reportType]: text
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
             <div className="bg-[#49377C] p-2.5 rounded-xl text-white shadow-lg shadow-purple-200">
                <FileText size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">上汽奥迪打铁指标看板</h1>
                <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">Multi-Manager Performance Tracking</p>
             </div>
          </div>
          <button onClick={handleDownload} className="flex items-center gap-2 bg-[#49377C] hover:bg-[#3a2c63] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95">
            <Download size={18} /> 下载截图
          </button>
        </div>

        {/* Global Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          
          {/* Manager Selector */}
          <div className="space-y-2 lg:col-span-1">
             <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               <UserCheck size={12} /> 商务经理
             </label>
             <div className="flex flex-wrap gap-1.5">
                {availableManagers.length === 0 ? (
                  <p className="text-xs text-orange-500 font-medium">请先上传归属文件</p>
                ) : (
                  availableManagers.map(mgr => (
                    <button
                      key={mgr}
                      onClick={() => setActiveManager(mgr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeManager === mgr ? 'bg-purple-700 border-purple-700 text-white shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200 hover:text-purple-600'}`}
                    >
                      {mgr}
                    </button>
                  ))
                )}
             </div>
          </div>

          {/* Report Type */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">指标类型</label>
             <div className="flex bg-gray-200/50 p-1 rounded-xl">
                <button onClick={() => setReportType('performance')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${reportType === 'performance' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Activity size={14} /> 考核指标
                </button>
                <button onClick={() => setReportType('observation')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${reportType === 'observation' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Eye size={14} /> 观察指标
                </button>
             </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">时间范围</label>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
            </div>
          </div>

          {/* City Selector */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">查看区域</label>
             <div className="flex flex-wrap gap-1.5">
                {availableCities.map(city => (
                  <button
                    key={city}
                    onClick={() => setActiveCity(city)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeCity === city ? 'bg-white border-purple-200 text-purple-700 shadow-sm' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                  >
                    {city}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    数据编辑器 <span className="text-[10px] text-gray-400 font-normal uppercase">({activeManager || 'None'} - {reportType === 'performance' ? '考核' : '观察'})</span>
                 </h3>
                 <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg transition-all text-gray-600 shadow-sm active:translate-y-px">
                    <Upload size={14} /> 导入数据 CSV
                    <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, reportType)} className="hidden" />
                 </label>
              </div>
              <textarea 
                value={currentCsv}
                onChange={(e) => handleManualEdit(e.target.value)}
                className="w-full h-44 font-mono text-[11px] border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-purple-50 outline-none resize-none bg-gray-50/50 leading-relaxed"
                placeholder="在此粘贴或导入 CSV 数据..."
              />
           </div>

           <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex flex-col justify-between shadow-inner">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-2">
                  <Settings size={18} /> 全局配置中心
                </h4>
                <p className="text-xs text-purple-600/80 mb-6 leading-relaxed">
                  上传“代理商归属文件”来定义经理管辖范围。格式：代理商,城市,商务经理。
                </p>
              </div>
              <label className="flex flex-col items-center justify-center gap-3 cursor-pointer bg-white hover:bg-purple-100/50 border-2 border-dashed border-purple-200 p-6 rounded-2xl transition-all group shadow-sm">
                 <Upload size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                 <span className="text-xs font-black text-purple-700 uppercase tracking-widest">上传归属配置</span>
                 <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'attribution')} className="hidden" />
              </label>
           </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="flex flex-col items-center">
        {availableManagers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 w-full max-w-2xl shadow-sm">
             <Settings className="w-16 h-16 text-gray-200 mx-auto mb-6 animate-spin-slow" />
             <h2 className="text-xl font-bold text-gray-400">系统未初始化</h2>
             <p className="text-sm text-gray-300 mt-2">请在上方“全局配置中心”上传归属文件</p>
          </div>
        ) : processedData && activeCity ? (
          <>
            <ReportView 
              city={activeCity as any} 
              data={processedData[activeCity] || []} 
              startDate={startDate} 
              endDate={endDate} 
              reportRef={reportRef} 
              reportType={reportType} 
            />
            <AnalysisPanel 
              city={activeCity as any} 
              data={processedData[activeCity] || []} 
              startDate={startDate} 
              endDate={endDate} 
              reportType={reportType} 
            />
          </>
        ) : (
          <div className="flex flex-col items-center py-20 opacity-50">
             <Activity className="animate-pulse text-purple-200 w-12 h-12" />
             <p className="text-xs text-gray-400 mt-4">等待数据加载...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;