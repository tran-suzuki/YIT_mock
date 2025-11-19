import React, { useMemo, useState } from 'react';
import { AttendanceRecord, Worker } from '../types';
import { Clock, Calendar, ChevronLeft, ChevronRight, AlertCircle, ArrowUp, ArrowDown, SlidersHorizontal, Edit3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import EditAttendanceModal from './EditAttendanceModal';

type TableMode = 'day' | 'month';
type SortKey = 'company' | 'name' | 'workTime' | 'daysPresent';
type SortDirection = 'asc' | 'desc';

// --- Unified Worker Profile Component ---
const WorkerProfile: React.FC<{ worker: Worker; compact?: boolean }> = ({ worker, compact }) => (
  <div className="flex items-center gap-3 pl-6 h-full">
    <img src={worker.avatarUrl} alt={worker.name} className="w-8 h-8 rounded-full bg-slate-200 object-cover flex-shrink-0" />
    <div className="overflow-hidden">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase tracking-tight truncate max-w-[120px]">
          {worker.company}
        </span>
      </div>
      <div className="text-sm font-bold text-slate-700 truncate">{worker.name}</div>
      <div className="text-[10px] text-slate-400 truncate">{worker.occupation}</div>
    </div>
  </div>
);

const DezuraTable: React.FC = () => {
  const { selectedDate: date, workers, records, filterSiteId, filterCompany, filterName } = useAppStore();
  const [tableMode, setTableMode] = useState<TableMode>('day');
  const [sortKey, setSortKey] = useState<SortKey>('company');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Editing State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | undefined>(undefined);

  const openEditModal = (worker: Worker, targetDate: string, record?: AttendanceRecord) => {
    setEditingWorker(worker);
    setEditingDate(targetDate);
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // --- Filtering Logic (Derived State) ---
  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const matchesCompany = !filterCompany || worker.company === filterCompany;
      const matchesName = !filterName || worker.name.includes(filterName);
      return matchesCompany && matchesName;
    });
  }, [workers, filterCompany, filterName]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSite = !filterSiteId || record.siteId === filterSiteId;
      return matchesSite;
    });
  }, [records, filterSiteId]);
  
  // --- Shared Utils ---
  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth() + 1;
  
  // Japanese Date String
  const jpDateString = `${year}年${month}月${parsedDate.getDate()}日`;

  // --- Sorting Logic ---
  const workerMetrics = useMemo(() => {
    const metrics = new Map<string, { workTime: number, daysPresent: number }>();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    
    filteredWorkers.forEach(worker => {
        // Days Present (Monthly)
        const workerMonthlyRecords = filteredRecords.filter(r => r.workerId === worker.id && r.date.startsWith(monthPrefix));
        const daysPresent = workerMonthlyRecords.length;

        // Work Time (Daily - Today)
        const todayRecord = filteredRecords.find(r => r.workerId === worker.id && r.date === date);
        let workTime = 0;
        if (todayRecord && todayRecord.checkInTime) {
            const start = new Date(todayRecord.checkInTime).getTime();
            const end = todayRecord.checkOutTime ? new Date(todayRecord.checkOutTime).getTime() : new Date().getTime();
            workTime = (end - start) / (1000 * 60 * 60);
        }
        
        metrics.set(worker.id, { workTime, daysPresent });
    });
    return metrics;
  }, [filteredWorkers, filteredRecords, year, month, date]);

  const sortedWorkers = useMemo(() => {
    return [...filteredWorkers].sort((a, b) => {
      const mA = workerMetrics.get(a.id) || { workTime: 0, daysPresent: 0 };
      const mB = workerMetrics.get(b.id) || { workTime: 0, daysPresent: 0 };
      
      let comparison = 0;
      switch (sortKey) {
          case 'company':
              comparison = a.company.localeCompare(b.company);
              if (comparison === 0) comparison = a.name.localeCompare(b.name);
              break;
          case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
          case 'workTime':
              comparison = mA.workTime - mB.workTime;
              break;
          case 'daysPresent':
              comparison = mA.daysPresent - mB.daysPresent;
              break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredWorkers, sortKey, sortDirection, workerMetrics]);

  // --- Day View Logic ---
  const startHour = 6;
  const endHour = 20;
  const totalHours = endHour - startHour;
  const hoursArray = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  const dailyRecords = useMemo(() => {
    return filteredRecords.filter(r => r.date === date);
  }, [filteredRecords, date]);

  const getBarMetrics = (checkIn: string, checkOut?: string) => {
    const start = new Date(checkIn);
    const startH = start.getHours() + start.getMinutes() / 60;
    
    let endH = startH + 1; 
    if (checkOut) {
      const end = new Date(checkOut);
      endH = end.getHours() + end.getMinutes() / 60;
    }

    const clampedStart = Math.max(startHour, startH);
    const clampedEnd = Math.min(endHour, endH);
    
    const leftPercent = ((clampedStart - startHour) / totalHours) * 100;
    const widthPercent = ((clampedEnd - clampedStart) / totalHours) * 100;

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getWorkDuration = (record: AttendanceRecord | undefined) => {
    if (!record || !record.checkInTime || !record.checkOutTime) return '-';
    const start = new Date(record.checkInTime).getTime();
    const end = new Date(record.checkOutTime).getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    return `${diffHours.toFixed(1)}h`;
  };

  const getMonthlyCount = (workerId: string) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return filteredRecords.filter(r => r.workerId === workerId && r.date.startsWith(prefix)).length;
  };

  // --- Month View Logic ---
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayOfWeek = (d: number) => {
    const dayIndex = new Date(year, month - 1, d).getDay();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return { 
      label: days[dayIndex], 
      isWeekend: dayIndex === 0 || dayIndex === 6,
      isSunday: dayIndex === 0
    };
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              {tableMode === 'day' ? <Clock size={18} className="text-indigo-500" /> : <Calendar size={18} className="text-indigo-500" />}
              {tableMode === 'day' ? '日次出面' : '月次出面'}
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tableMode === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setTableMode('day')}
              >
                日次
              </button>
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tableMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setTableMode('month')}
              >
                月次
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            {/* Sort Controls */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <SlidersHorizontal size={14} className="text-slate-400" />
                <select 
                  value={sortKey} 
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                >
                  <option value="company">会社順</option>
                  <option value="name">氏名順</option>
                  <option value="workTime">時間順</option>
                  <option value="daysPresent">日数順</option>
                </select>
                <button 
                  onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                  className="ml-1 p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                  title={sortDirection === 'asc' ? '昇順' : '降順'}
                >
                  {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
            </div>

            {/* Date Nav */}
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium border-l border-slate-100 pl-4">
              <button className="p-1 hover:bg-slate-100 rounded-full transition"><ChevronLeft size={16} /></button>
              <span className="whitespace-nowrap min-w-[100px] text-center">{tableMode === 'day' ? jpDateString : `${year}年${month}月`}</span>
              <button className="p-1 hover:bg-slate-100 rounded-full transition"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          
          {/* --- DAY VIEW --- */}
          {tableMode === 'day' && (
            <div className="overflow-auto h-full scrollbar-hide">
              <div className="min-w-[1000px]">
                <div className="flex border-b border-slate-100 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                  <div className="w-60 flex-shrink-0 p-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 pl-6">
                    作業員名
                  </div>
                  <div className="w-24 flex-shrink-0 p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center border-r border-slate-100">
                    作業時間
                  </div>
                  <div className="w-20 flex-shrink-0 p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center border-r border-slate-100">
                    出勤日数
                  </div>
                  <div className="flex-1 relative h-8 mt-1">
                    {hoursArray.map((h) => (
                      <div 
                        key={h} 
                        className="absolute text-[10px] text-slate-400 transform -translate-x-1/2 top-1"
                        style={{ left: `${((h - startHour) / totalHours) * 100}%` }}
                      >
                        {h}:00
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-50">
                  {sortedWorkers.map((worker, index) => {
                    const record = dailyRecords.find(r => r.workerId === worker.id);
                    const isNewCompany = (index === 0 || sortedWorkers[index - 1].company !== worker.company) && sortKey === 'company';

                    return (
                      <div key={worker.id} className={`flex hover:bg-slate-50/50 transition-colors group ${isNewCompany && index !== 0 ? 'border-t-4 border-slate-100' : ''}`}>
                        {/* Worker Info */}
                        <div className="w-60 flex-shrink-0 py-2 border-r border-slate-100 relative group">
                          <WorkerProfile worker={worker} />
                          <button 
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-white shadow-sm border border-slate-200 rounded-md text-slate-400 hover:text-indigo-600 transition"
                            onClick={() => openEditModal(worker, date, record)}
                            title="編集"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>

                        {/* Work Time */}
                        <div className="w-24 flex-shrink-0 flex items-center justify-center border-r border-slate-100 text-sm font-medium text-slate-600">
                          {getWorkDuration(record)}
                        </div>

                        {/* Monthly Count */}
                        <div className="w-20 flex-shrink-0 flex items-center justify-center border-r border-slate-100 text-sm font-bold text-indigo-600 bg-slate-50/30">
                          {getMonthlyCount(worker.id)}日
                        </div>

                        {/* Timeline */}
                        <div 
                          className="flex-1 relative h-14 cursor-pointer"
                          onClick={() => openEditModal(worker, date, record)}
                          title="クリックして編集"
                        >
                          {hoursArray.map((h) => (
                              <div key={h} className="absolute top-0 bottom-0 border-l border-slate-100 border-dashed" style={{ left: `${((h - startHour) / totalHours) * 100}%` }}/>
                          ))}
                          {record ? (
                            <div 
                              className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-md shadow-sm flex items-center justify-center overflow-hidden text-white transition-all hover:scale-[1.02] hover:shadow-md ${!record.checkOutTime ? 'bg-amber-400 ring-2 ring-amber-100' : 'bg-indigo-500'}`}
                              style={getBarMetrics(record.checkInTime, record.checkOutTime)}
                            >
                              {!record.checkOutTime && <span className="text-[10px] font-bold animate-pulse px-2">作業中</span>}
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                              <div className="h-8 w-[80%] border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center bg-slate-50/50">
                                <span className="text-xs text-slate-400 font-bold">クリックして追加</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* --- MONTH VIEW --- */}
          {tableMode === 'month' && (
            <div className="overflow-auto h-full scrollbar-hide">
              <div className="min-w-[1200px]"> 
                {/* Header Row */}
                <div className="flex border-b border-slate-100 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                  <div className="w-60 flex-shrink-0 p-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 pl-6 flex items-center z-20 sticky left-0 bg-white">
                    作業員名
                  </div>
                  {monthDays.map((d) => {
                    const { label, isWeekend, isSunday } = getDayOfWeek(d);
                    return (
                      <div key={d} className={`flex-1 min-w-[32px] text-center py-2 border-r border-slate-50 last:border-r-0 ${isSunday ? 'bg-rose-50/30 text-rose-600' : isWeekend ? 'bg-blue-50/30 text-blue-600' : 'text-slate-600'}`}>
                        <div className="text-xs font-bold mb-0.5">{d}</div>
                        <div className="text-[9px] opacity-70">{label}</div>
                      </div>
                    );
                  })}
                  <div className="w-20 flex-shrink-0 p-2 text-center text-xs font-bold text-slate-400 border-l border-slate-100 flex items-center justify-center bg-slate-50/50">
                    出勤日数
                  </div>
                </div>

                {/* Worker Rows */}
                <div className="divide-y divide-slate-50">
                  {sortedWorkers.map((worker, index) => {
                    const workerRecords = filteredRecords.filter(r => r.workerId === worker.id && r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`));
                    const daysPresent = workerRecords.length;
                    const isNewCompany = (index === 0 || sortedWorkers[index - 1].company !== worker.company) && sortKey === 'company';

                    return (
                      <div key={worker.id} className={`flex hover:bg-slate-50/50 transition-colors ${isNewCompany && index !== 0 ? 'border-t-4 border-slate-100' : ''}`}>
                          <div className="w-60 flex-shrink-0 py-2 border-r border-slate-100 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <WorkerProfile worker={worker} />
                          </div>
                          
                          {monthDays.map((d) => {
                            const { isSunday } = getDayOfWeek(d);
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const record = workerRecords.find(r => r.date === dateStr);
                            
                            return (
                              <div 
                                key={d} 
                                className={`flex-1 min-w-[32px] border-r border-slate-50 flex items-center justify-center h-14 cursor-pointer hover:bg-indigo-50/50 transition-colors ${isSunday ? 'bg-rose-50/10' : ''}`}
                                onClick={() => openEditModal(worker, dateStr, record)}
                                title={`${dateStr} の詳細を編集`}
                              >
                                  {record ? (
                                    <div className={`w-3 h-3 rounded-full ${record.checkOutTime ? 'bg-indigo-500' : 'bg-amber-400 animate-pulse'}`}></div>
                                  ) : (
                                    <div className="w-1 h-1 rounded-full bg-slate-200 opacity-0 hover:opacity-100"></div>
                                  )}
                              </div>
                            );
                          })}

                          <div className="w-20 flex-shrink-0 flex items-center justify-center text-sm font-bold text-indigo-600 bg-slate-50/30 border-l border-slate-100">
                            {daysPresent}
                          </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {filteredWorkers.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <span className="text-sm">データがありません</span>
              </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingWorker && (
        <EditAttendanceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          worker={editingWorker}
          date={editingDate}
          existingRecord={editingRecord}
        />
      )}
    </>
  );
};

export default DezuraTable;
