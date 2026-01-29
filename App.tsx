import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PERFORMANCE_CSV, DEFAULT_OBSERVATION_CSV } from './constants';
import { processCSV } from './services/dataProcessor';
import { City, DealerData, ReportType } from './types';
import ReportView from './components/ReportView';
import AnalysisPanel from './components/AnalysisPanel';
import html2canvas from 'html2canvas';
import { Download, RefreshCw, Upload, FileText, Activity, Eye } from 'lucide-react';

const STORAGE_KEY_PERF = 'dealer_report_csv_data_performance';
const STORAGE_KEY_OBS = 'dealer_report_csv_data_observation';

const App: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('performance');
  
  // Manage separate state for different report types
  const [csvContentPerf, setCsvContentPerf] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PERF) || DEFAULT_PERFORMANCE_CSV;
  });
  const [csvContentObs, setCsvContentObs] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_OBS) || DEFAULT_OBSERVATION_CSV;
  });

  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [processedData, setProcessedData] = useState<Record<City, DealerData[]> | null>(null);
  const [activeCity, setActiveCity] = useState<City>(City.Xian);

  const reportRef = useRef<HTMLDivElement>(null);

  // Helper to get current CSV based on active type
  const currentCsv = reportType === 'performance' ? csvContentPerf : csvContentObs;
  const setCurrentCsv = (val: string) => {
    if (reportType === 'performance') setCsvContentPerf(val);
    else setCsvContentObs(val);
  };

  // Re-process when type or relevant csv changes
  useEffect(() => {
    handleProcess();
  }, [reportType, csvContentPerf, csvContentObs]); // Depend on both content states so switching triggers update

  // Persist CSV content
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERF, csvContentPerf);
  }, [csvContentPerf]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OBS, csvContentObs);
  }, [csvContentObs]);

  const handleProcess = () => {
    try {
      const data = processCSV(currentCsv, reportType);
      setProcessedData(data);
    } catch (e) {
      console.error("Error processing CSV", e);
      // alert("Error processing CSV data. Please check the format."); // Optional: suppress strict alerting during typing
    }
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#F8F9FA',
      logging: false,
    });

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `Report_${activeCity}_${reportType}_${startDate}.png`;
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          setCurrentCsv(text);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8 font-sans text-gray-800">
      
      {/* Header Controls */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">上汽奥迪打铁指标看板</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleProcess}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={18} />
              Refresh Data
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download size={18} />
              Download Image
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Report Type Toggle */}
           <div className="space-y-1">
             <label className="block text-xs font-semibold text-gray-500 uppercase">Report Type</label>
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setReportType('performance')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${reportType === 'performance' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Activity size={14} />
                  考核指标
                </button>
                <button
                  onClick={() => setReportType('observation')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${reportType === 'observation' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Eye size={14} />
                  观察指标
                </button>
             </div>
          </div>

           {/* Date Inputs */}
           <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* City Toggle */}
          <div className="space-y-1">
             <label className="block text-xs font-semibold text-gray-500 uppercase">Select Region</label>
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveCity(City.Chengdu)}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeCity === City.Chengdu ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  成都 (CD)
                </button>
                <button
                  onClick={() => setActiveCity(City.Xian)}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeCity === City.Xian ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  西安 (XA)
                </button>
             </div>
          </div>
        </div>

        {/* File Upload & Text Area */}
        <div className="mt-6">
           <div className="flex justify-between items-center mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText size={16} />
                <span>Raw Data ({reportType === 'performance' ? 'Performance' : 'Observation'})</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded transition-colors text-gray-600">
                <Upload size={12} />
                <span>Import CSV</span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
           </div>
           
           <textarea 
             value={currentCsv}
             onChange={(e) => setCurrentCsv(e.target.value)}
             className="w-full h-48 font-mono text-xs border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-teal-500 outline-none resize-y"
             placeholder="Paste CSV content here..."
           />
           <p className="text-xs text-gray-400 mt-2 text-right">
             Changes are saved automatically to your browser.
           </p>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex flex-col items-center">
        {processedData ? (
          <>
            <ReportView 
              city={activeCity} 
              data={processedData[activeCity]} 
              startDate={startDate}
              endDate={endDate}
              reportRef={reportRef}
              reportType={reportType}
            />
            
            <AnalysisPanel 
              city={activeCity} 
              data={processedData[activeCity]} 
              startDate={startDate}
              endDate={endDate}
              reportType={reportType}
            />
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">Processing data...</div>
        )}
      </div>

    </div>
  );
};

export default App;