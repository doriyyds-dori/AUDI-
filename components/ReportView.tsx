
import React from 'react';
// Changed: removed City from imports
import { DealerData, ReportType } from '../types';
import ReportHeader from './ReportHeader';
import DealerCard from './DealerCard';

interface ReportViewProps {
  // Changed: City type replaced with string
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
    <div className="overflow-auto shadow-2xl rounded-lg max-w-2xl mx-auto my-8">
      <div 
        ref={reportRef} 
        className="bg-[#F8F9FA] min-h-[600px] w-[600px] mx-auto text-left"
        id={`report-${city}`}
      >
        <ReportHeader city={city} startDate={startDate} endDate={endDate} reportType={reportType} />
        
        <div className="p-6 space-y-4">
          {data.length === 0 ? (
             <div className="text-center text-gray-400 py-10">
               No data found for this city in the provided CSV.
             </div>
          ) : (
            data.map((dealer, idx) => (
              <DealerCard key={idx} data={dealer} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pb-6 pt-2 text-center text-gray-400 text-xs font-light">
          数据来源：打铁报表V2_1 | 生成时间： {generatedTime}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
