import React, { useMemo } from 'react';
import { Briefcase, Clock, Users, Building2, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const CompanySummary: React.FC = () => {
  const { workers, records, sites, filterSiteId, selectedDate } = useAppStore();

  // Calculations
  const stats = useMemo<{ company: string; workerCount: number; totalManDays: number; totalHours: number }[]>(() => {
    const uniqueCompanies = Array.from(new Set(workers.map(w => w.company))) as string[];
    const monthPrefix = selectedDate.substring(0, 7); // YYYY-MM
    
    // Calculate stats for each company
    const companyStats = uniqueCompanies.map(company => {
      const companyWorkers = workers.filter(w => w.company === company);
      const companyWorkerIds = companyWorkers.map(w => w.id);
      
      // Filter records: Match Company, Match Month, Match Site Filter (if active)
      const relevantRecords = records.filter(r => {
        const isCompanyWorker = companyWorkerIds.includes(r.workerId);
        const isSameMonth = r.date.startsWith(monthPrefix);
        const isSameSite = !filterSiteId || r.siteId === filterSiteId;
        return isCompanyWorker && isSameMonth && isSameSite;
      });

      const totalManDays = relevantRecords.length;
      
      const totalHours = relevantRecords.reduce((acc, r) => {
        if (!r.checkInTime || !r.checkOutTime) return acc;
        const start = new Date(r.checkInTime).getTime();
        const end = new Date(r.checkOutTime).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        return acc + hours;
      }, 0);

      return {
        company,
        workerCount: companyWorkers.length,
        totalManDays,
        totalHours
      };
    });

    // Sort by Total Hours Descending
    return companyStats.sort((a, b) => b.totalHours - a.totalHours);
  }, [workers, records, selectedDate, filterSiteId]);

  // Calculate max value for bar charts
  const maxHours = Math.max(...stats.map(s => s.totalHours), 1);

  // Format display date
  const d = new Date(selectedDate);
  const displayMonth = `${d.getFullYear()}年${d.getMonth() + 1}月`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="text-indigo-600" />
              会社別月次集計
            </h2>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Calendar size={14} />
              集計対象月: <span className="font-bold text-slate-700">{displayMonth}</span>
              {filterSiteId && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-md font-bold">
                    現場絞り込み中
                  </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-4 text-right">
             <div>
                 <div className="text-xs text-slate-400 font-bold uppercase">総工数</div>
                 <div className="text-2xl font-bold text-slate-800">
                     {stats.reduce((acc, s) => acc + s.totalHours, 0).toFixed(1)} <span className="text-sm text-slate-400">h</span>
                 </div>
             </div>
             <div>
                 <div className="text-xs text-slate-400 font-bold uppercase">総人工</div>
                 <div className="text-2xl font-bold text-slate-800">
                     {stats.reduce((acc, s) => acc + s.totalManDays, 0)} <span className="text-sm text-slate-400">人日</span>
                 </div>
             </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">協力会社名</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-32">登録人員</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-32">月間出勤日数</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <div className="flex items-center justify-between">
                                <span>合計作業時間 (h)</span>
                                <Clock size={14} />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {stats.map((stat, index) => (
                        <tr key={stat.company} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${index < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="font-bold text-slate-700">{stat.company}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                    <Users size={14} className="text-slate-400" />
                                    {stat.workerCount}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="font-bold text-slate-700">{stat.totalManDays} <span className="text-xs text-slate-400 font-normal">日</span></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-indigo-600 w-16 text-right">{stat.totalHours.toFixed(1)} h</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${(stat.totalHours / maxHours) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {stats.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                集計データがありません
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default CompanySummary;