import React, { useMemo } from 'react';
import { Calendar, Building2, Users, Search, Filter, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AttendanceStatus, Worker } from '../types';

const SearchFilter: React.FC = () => {
  const {
    selectedDate, setSelectedDate,
    filterSiteId, setFilterSiteId,
    filterCompany, setFilterCompany,
    filterName, setFilterName,
    sites, workers, records
  } = useAppStore();

  const uniqueCompanies = useMemo<string[]>(() => {
    return Array.from(new Set(workers.map((w: Worker) => w.company)));
  }, [workers]);

  const handleDownloadCSV = () => {
    // Local Filtering Logic for CSV to ensure it matches current view state
    const filteredWorkers = workers.filter(worker => {
        const matchesCompany = !filterCompany || worker.company === filterCompany;
        const matchesName = !filterName || worker.name.includes(filterName);
        return matchesCompany && matchesName;
    });

    const filteredRecords = records.filter(record => {
        const matchesSite = !filterSiteId || record.siteId === filterSiteId;
        return matchesSite;
    });

    const headers = ['日付', '現場名', '会社名', '作業員名', '職種', '入場時間', '退場時間', '状態'];
    const exportMonthPrefix = selectedDate.substring(0, 7);

    const exportData = filteredRecords.filter(record => {
       const matchesMonth = record.date.startsWith(exportMonthPrefix);
       const matchesWorker = filteredWorkers.some(w => w.id === record.workerId);
       return matchesMonth && matchesWorker;
    }).sort((a, b) => a.date.localeCompare(b.date))
    .map(record => {
      const worker = workers.find(w => w.id === record.workerId);
      const site = sites.find(s => s.id === record.siteId);
      
      const checkIn = record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
      const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
      const status = record.status === AttendanceStatus.CHECKED_IN ? '作業中' : '退場済';

      return [
        `"${record.date}"`,
        `"${site?.name || ''}"`,
        `"${worker?.company || ''}"`,
        `"${worker?.name || ''}"`,
        `"${worker?.occupation || ''}"`,
        `"${checkIn}"`,
        `"${checkOut}"`,
        `"${status}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...exportData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `genba_export_${exportMonthPrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Filter size={18} className="text-indigo-600" />
          <span>絞り込み検索</span>
        </div>
        <button 
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 text-green-600 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          <Download size={16} />
          <span>CSV出力</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Filter (Period) */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block pl-1">対象日</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer hover:bg-slate-100 transition-colors"
            />
          </div>
        </div>

        {/* Site Filter */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block pl-1">現場選択</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterSiteId}
              onChange={(e) => setFilterSiteId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="">全ての現場</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Company Filter */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block pl-1">協力会社</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="">全ての会社</option>
              {uniqueCompanies.map((company: string) => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Name Search */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block pl-1">作業員検索</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="名前で検索..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:bg-slate-100 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;