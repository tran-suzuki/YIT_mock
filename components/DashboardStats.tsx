import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, Building2, Users, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const DashboardStats: React.FC = () => {
  const { records, sites, selectedDate, loadMonthlyData, filterSiteId } = useAppStore();
  
  // Real-time clock state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSite = !filterSiteId || record.siteId === filterSiteId;
      return matchesSite;
    });
  }, [records, filterSiteId]);

  const dailyCount = filteredRecords.filter(r => r.date === selectedDate).length;

  // Aggregation per site for the selected date
  const siteStats = useMemo(() => {
    return sites.map(site => {
      const siteRecords = records.filter(r => r.siteId === site.id && r.date === selectedDate);
      
      const attendees = siteRecords.length;
      
      const totalHours = siteRecords.reduce((acc, r) => {
        if (!r.checkInTime || !r.checkOutTime) return acc;
        const start = new Date(r.checkInTime).getTime();
        const end = new Date(r.checkOutTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);

      return {
        site,
        attendees,
        totalHours
      };
    });
  }, [sites, records, selectedDate]);

  const visibleSiteStats = filterSiteId 
    ? siteStats.filter(s => s.site.id === filterSiteId)
    : siteStats;

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Attendees */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">本日の入場者</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-800">{dailyCount}</span>
            <span className="text-sm text-slate-500">名</span>
          </div>
        </div>
        
        {/* Card 2: Active Sites */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">稼働現場数</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-800">{sites.length}</span>
            <span className="text-sm text-slate-500">箇所</span>
          </div>
        </div>

        {/* Card 3: Time & Sync (Replaces Simulation Button) */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Clock size={80} />
          </div>

          <div className="z-10">
            <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">現在日時</h3>
            <div className="text-3xl font-bold font-mono tracking-wider leading-none mb-1">{formattedTime}</div>
            <div className="text-sm text-indigo-100 opacity-90">{formattedDate}</div>
          </div>
          
          <button 
            onClick={() => loadMonthlyData(selectedDate)}
            className="mt-4 bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center gap-2 py-2 rounded-lg transition-all backdrop-blur-sm z-10 group"
          >
            <RefreshCw size={16} className="group-active:animate-spin" />
            <span className="text-sm font-bold">データ同期</span>
          </button>
        </div>

      </div>

      {/* Site Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-700">現場別日次サマリー ({selectedDate})</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {visibleSiteStats.map((stat) => (
             <div key={stat.site.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hidden sm:block">
                     <Building2 size={20} />
                   </div>
                   <div>
                     <div className="font-bold text-slate-800">{stat.site.name}</div>
                     <div className="text-xs text-slate-400">{stat.site.address}</div>
                   </div>
                </div>
                <div className="flex gap-4 sm:gap-8 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-right min-w-[80px]">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-0.5 flex items-center justify-end gap-1">
                       <Users size={12} /> 入場者数
                     </div>
                     <div className="font-bold text-slate-700">{stat.attendees} 名</div>
                  </div>
                  <div className="text-right min-w-[80px]">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-0.5 flex items-center justify-end gap-1">
                       <Clock size={12} /> 総工数
                     </div>
                     <div className="font-bold text-slate-700">{stat.totalHours.toFixed(1)} h</div>
                  </div>
                </div>
             </div>
          ))}
          {visibleSiteStats.length === 0 && (
             <div className="p-8 text-center text-slate-400">
               該当する現場データがありません
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;