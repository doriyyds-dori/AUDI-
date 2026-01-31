import React from 'react';
import { DealerData, ReportType } from '../types';
import ReportHeader from './ReportHeader';
import DealerCard from './DealerCard';

interface ReportViewProps {
  city: string;
  data: DealerData[];
  startDate: string;
  endDate: string;
  reportRef: React.RefObject<HTMLDivElement>;
  reportType: ReportType;
}

const ReportView: React.FC<ReportViewProps> = ({ city, data, startDate, endDate, reportRef, reportType }) => {
  const generatedTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="overflow-auto shadow-2xl rounded-lg max-w-3xl mx-auto my-8 border border-gray-200">
      <div 
        ref={reportRef} 
        className="bg-[#F1F3F5] min-h-[600px] w-[600px] mx-auto text-left relative"
        id={`report-${city}`}
      >
        <ReportHeader city={city} startDate={startDate} endDate={endDate} reportType={reportType} />
        
        <div className="p-5 space-y-4">
          {data.length === 0 ? (
             <div className="text-center text-gray-400 py-20 flex flex-col items-center">
               <div className="w-12 h-1 bg-gray-200 rounded mb-2"></div>
               <p className="text-sm font-medium">暂无该区域数据</p>
             </div>
          ) : (
            data.map((dealer, idx) => (
              <DealerCard key={idx} data={dealer} />
            ))
          )}
        </div>

        {/* Watermark-style Footer */}
        <div className="pb-8 pt-4 flex flex-col items-center justify-center opacity-40">
           <div className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center mb-1">
              <span className="font-serif font-bold text-gray-500 text-xs">A</span>
           </div>
          <div className="text-[10px] text-gray-500 font-medium tracking-wider">
            SAIC AUDI PERFORMANCE REPORT
          </div>
          <div className="text-[9px] text-gray-400 mt-0.5 font-mono">
            Generated: {generatedTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;