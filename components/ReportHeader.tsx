import React from 'react';
import { City, ReportType } from '../types';

interface ReportHeaderProps {
  city: City;
  startDate: string;
  endDate: string;
  reportType: ReportType;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ city, startDate, endDate, reportType }) => {
  return (
    <div className="bg-[rgb(73,55,124)] text-white p-8 text-center rounded-t-lg relative overflow-hidden">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10"></div>
      
      <div className="uppercase tracking-[0.2em] text-xs font-medium opacity-80 mb-2">
        DATA REPORT {startDate}
        {endDate && endDate !== startDate ? ` - ${endDate}` : ''}
      </div>
      
      <h1 className="text-5xl font-black mb-2 tracking-wide font-sans">{city}</h1>
      
      {/* Divider */}
      <div className="w-16 h-1 bg-white/30 mx-auto my-4 rounded-full"></div>
      
      <h2 className="text-lg font-medium tracking-wider opacity-90">
        {reportType === 'performance' ? '代理商打铁日报过程考核指标' : '代理商打铁日报过程观察指标'}
      </h2>
    </div>
  );
};

export default ReportHeader;