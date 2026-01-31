import React from 'react';
import { ReportType } from '../types';

interface ReportHeaderProps {
  city: string;
  startDate: string;
  endDate: string;
  reportType: ReportType;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ city, startDate, endDate, reportType }) => {
  return (
    <div className="bg-[#49377C] text-white p-8 pb-10 text-center rounded-t-lg relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      <div className="absolute top-10 -left-10 w-24 h-24 bg-purple-400/10 rounded-full blur-xl"></div>
      
      {/* Date Tag */}
      <div className="inline-block px-3 py-1 mb-4 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
        <span className="uppercase tracking-[0.2em] text-[10px] font-semibold opacity-90">
          DATA REPORT {startDate}
          {endDate && endDate !== startDate ? ` - ${endDate}` : ''}
        </span>
      </div>
      
      {/* Main Title */}
      <h1 className="text-5xl font-black mb-3 tracking-wide font-sans drop-shadow-sm">
        {city}
      </h1>
      
      {/* Divider */}
      <div className="flex items-center justify-center gap-2 my-5 opacity-40">
        <div className="h-[1px] w-12 bg-white"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
        <div className="h-[1px] w-12 bg-white"></div>
      </div>
      
      {/* Subtitle */}
      <h2 className="text-lg font-medium tracking-widest text-white/90">
        {reportType === 'performance' ? '代理商打铁日报过程考核指标' : '代理商打铁日报过程观察指标'}
      </h2>
    </div>
  );
};

export default ReportHeader;