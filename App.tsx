import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PERFORMANCE_CSV, DEFAULT_OBSERVATION_CSV } from './constants';
import { processCSV, parseAttributionCSV } from './services/dataProcessor';
import { DealerData, ReportType, AttributionMap, MultiManagerStorage, DealerAttribution } from './types';
import ReportView from './components/ReportView';
import AnalysisPanel from './components/AnalysisPanel';
import html2canvas from 'html2canvas';
import { Download, Upload, FileText, Activity, Settings, UserCheck, ChevronDown, ChevronUp, Database, Trash2 } from 'lucide-react';

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

  const availableManagers = Array.from(new Set(Object.values(attributions).map(a => a.businessManager))).filter(Boolean).sort();
  const availableCities = activeManager 
    ? Array.from(new Set(Object.values(attributions).filter(a => a.businessManager === activeManager).map(a => a.city))).filter(Boolean).sort()
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

  // 增强型解码逻辑
  const decodeCSV = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    // 检查 UTF-8 BOM
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return new TextDecoder('utf-8').decode(buffer);
    }
    // 启发式检测：先尝试严格 UTF-8，报错则退回 GBK
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
        alert(count > 0 ? `归属表导入成功：已识别 ${count} 个代理商` : "未识别到数据，请检查 CSV 格式是否为：代理商,城市,经理");
      } else {
        if (!activeManager) return alert("请先在下方选择商务经理身份");
        setMultiData(prev => ({
          ...prev,
          [activeManager]: { ...(prev[activeManager] || { performance: '', observation: '' }), [target]: text }
        }));
        alert(`报表数据已载入`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const clearAllCache = () => {
    if (window.confirm("确定要重置应用吗？这将清空所有已导入的归属表和报表数据，解决乱码问题。")) {
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
      {/* Header */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
           <div className="bg-audi p-1.5 rounded-lg text-white">
              <FileText size={18} />
           </div>
           <h1 className="text-lg font-black tracking-tighter text-gray-900">上汽奥迪打铁看板 v2.6</h1>
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

      {/* Settings Panel */}
      {isConfigOpen && (
        <div className="max-w-5xl mx-auto mb-4 p-5 bg-white rounded-2xl border-2 border-purple-100 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-purple-900 flex items-center gap-2">
                <Settings size={16} /> 系统管理面板
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                1. 优先导入代理商归属表 (CSV 格式：名称,城市,经理)<br/>
                2. 若界面出现乱码或数据无法匹配，请先点击下方的“清空所有数据”
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={clearAllCache}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-xs font-black border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                <Trash2 size={16} /> 清空所有数据 (解决乱码)
              </button>
              <div className="w-px h-8 bg-gray-100 mx-1"></div>
              <label className="flex items-center gap-2 cursor-pointer bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg hover:bg-purple-700 transition-all">
                <Upload size={16} /> 导入归属表 CSV
                <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'attribution')} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Control Card */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck size={12} /> 当前经理身份
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableManagers.length === 0 ? (
                  <p className="text-xs text-orange-500 font-bold bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">请点击右上角齿轮导入归属表以开始</p>
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">报表类型</label>
              <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                 <button onClick={() => setReportType('performance')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${reportType === 'performance' ? 'bg-white shadow-sm text-audi' : 'text-gray-400'}`}>考核指标</button>
                 <button onClick={() => setReportType('observation')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${reportType === 'observation' ? 'bg-white shadow-sm text-audi' : 'text-gray-400'}`}>观察指标</button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">统计周期</label>
              <div className="flex gap-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">查看区域</label>
              <div className="flex flex-wrap gap-1.5">
                {availableCities.length > 0 ? availableCities.map(city => (
                  <button
                    key={city}
                    onClick={() => setActiveCity(city)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeCity === city ? 'bg-white border-purple-200 text-audi shadow-sm' : 'text-gray-400 border-transparent hover:text-gray-500'}`}
                  >
                    {city}
                  </button>
                )) : <span className="text-[10px] text-gray-300">选择经理后显示区域</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-50">
           <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Database size={12} className="text-gray-400" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  数据导入状态 <span className="text-audi opacity-60">({activeManager || '未选择'})</span>
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-audi hover:underline">
                  <Upload size={12} /> 上传报表 CSV
                  <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, reportType)} className="hidden" />
                </label>
                <button 
                  onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                  className="text-[10px] font-bold text-gray-400 flex items-center gap-1 hover:text-gray-600"
                >
                  {isEditorExpanded ? '折叠编辑器' : '展开编辑器'}
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
             placeholder="粘贴 CSV 数据或点击上方上传按钮..."
           />
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex flex-col items-center">
        {processedData && activeCity && processedData[activeCity]?.length > 0 ? (
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
             <p className="text-sm font-bold mt-4 tracking-widest uppercase">
               {activeManager ? "该经理当前无匹配数据，请检查归属表名称是否一致" : "请先导入配置并选择经理"}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;