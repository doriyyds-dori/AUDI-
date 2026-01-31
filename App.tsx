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

// The initial data provided by the user
const INITIAL_ATTRIBUTION_CSV = `代理商,城市,商务经理
奥迪之城成都万象城店,成都市,米宗桦
成都武侯华星用户中心,成都市,米宗桦
成都鹭洲里都市店,成都市,米宗桦
成都高新华星用户中心,成都市,米宗桦
成都金牛华星用户中心,成都市,米宗桦
西安浐灞用户中心,西安市,杜仪
西安航天城用户中心,西安市,杜仪
西安曲江都市店,西安市,杜仪
西安泛想用户中心,西安市,杜仪
昆明华星名仕用户中心,昆明市,唐广林
昆明同德广场都市店,昆明市,唐广林
昆明捷通达用户中心,昆明市,唐广林
昆明江东捷通达用户中心,昆明市,唐广林
贵阳通源用户中心,贵阳市,唐广林
贵阳中达盛用户中心,贵阳市,唐广林
遵义尊奥用户中心,遵义市,唐广林
银川铠晟用户中心,银川市,唐广林
重庆华星名仕用户中心,重庆市,高金杰
重庆新元素用户中心,重庆市,高金杰
重庆新盛立用户中心,重庆市,高金杰
重庆万象城AUDI新能源店,重庆市,高金杰
乌鲁木齐国奥用户中心,乌鲁木齐市,高金杰
乌鲁木齐鑫迪用户中心,乌鲁木齐市,高金杰
榆林东方用户中心,榆林市,高金杰
宝鸡盛通奥达用户中心,宝鸡市,高金杰
兰州中盛奥泽用户中心,兰州市,鲁盛
兰州悦奥汇安宁都市店,兰州市,鲁盛
绵阳长韵用户中心,绵阳市,鲁盛
达州天马用户中心,达州市,鲁盛
西宁尊通用户中心,西宁市,鲁盛
拉萨康迪用户中心,拉萨市,鲁盛`;

const App: React.FC = () => {
  // 1. Core State: Attribution & Managers
  const [attributions, setAttributions] = useState<AttributionMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ATTRIBUTION);
    return saved ? JSON.parse(saved) : parseAttributionCSV(INITIAL_ATTRIBUTION_CSV);
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
        alert(`${activeManager} 的 ${target === 'performance' ? '考核' : '观察'}数据已覆盖。`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
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
                {availableManagers.map(mgr => (
                  <button
                    key={mgr}
                    onClick={() => setActiveManager(mgr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeManager === mgr ? 'bg-purple-700 border-purple-700 text-white shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200 hover:text-purple-600'}`}
                  >
                    {mgr}
                  </button>
                ))}
             </div>
          </div>

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

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">时间范围</label>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-purple-100" />
            </div>
          </div>

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
                    数据输入区 <span className="text-[10px] text-gray-400 font-normal uppercase">({activeManager} - {reportType === 'performance' ? '考核' : '观察'})</span>
                 </h3>
                 <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg transition-all text-gray-600 shadow-sm">
                    <Upload size={14} /> 导入经理报表 CSV
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
                className="w-full h-44 font-mono text-[11px] border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-purple-50 outline-none resize-none bg-gray-50/50 leading-relaxed"
                placeholder="在此粘贴或导入 CSV 数据..."
              />
           </div>

           <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex flex-col justify-between shadow-inner">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-2">
                  <Settings size={18} /> 系统全局配置
                </h4>
                <p className="text-xs text-purple-600/80 mb-6 leading-relaxed">
                  通过上传归属文件（格式：代理商,城市,商务经理）来刷新系统人员管辖架构。
                </p>
              </div>
              <label className="flex flex-col items-center justify-center gap-3 cursor-pointer bg-white hover:bg-purple-100/50 border-2 border-dashed border-purple-200 p-6 rounded-2xl transition-all group shadow-sm">
                 <Upload size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                 <span className="text-xs font-black text-purple-700 uppercase tracking-widest text-center">覆盖归属配置文件</span>
                 <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'attribution')} className="hidden" />
              </label>
           </div>
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