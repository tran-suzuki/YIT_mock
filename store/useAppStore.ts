import { create } from 'zustand';
import { Worker, Site, AttendanceRecord, ViewMode, AttendanceStatus } from '../types';
import { generateMockData, generateStaticMonthData, analyzeSiteProductivity } from '../services/geminiService';

// --- Mock Data Definitions (Moved from App.tsx) ---
const MOCK_WORKERS: Worker[] = [
  // 山田建設
  { id: 'w1', name: '山田 太郎', company: '山田建設', occupation: '現場監督', avatarUrl: 'https://picsum.photos/id/1005/100/100' },
  { id: 'w1-2', name: '石川 健', company: '山田建設', occupation: '現場事務', avatarUrl: 'https://picsum.photos/id/1003/100/100' },
  // 鈴木電設
  { id: 'w2', name: '鈴木 一郎', company: '鈴木電設', occupation: '電気工事士', avatarUrl: 'https://picsum.photos/id/1012/100/100' },
  { id: 'w2-2', name: '鈴木 次郎', company: '鈴木電設', occupation: '電気工事士', avatarUrl: 'https://picsum.photos/id/1025/100/100' },
  { id: 'w2-3', name: '電気屋 サブ', company: '鈴木電設', occupation: '見習い', avatarUrl: 'https://picsum.photos/id/1024/100/100' },
  // 佐藤内装
  { id: 'w3', name: '佐藤 花子', company: '佐藤内装', occupation: '内装工', avatarUrl: 'https://picsum.photos/id/1027/100/100' },
  // 田中配管
  { id: 'w4', name: '田中 健太', company: '田中配管', occupation: '配管工', avatarUrl: 'https://picsum.photos/id/1011/100/100' },
  // 高橋塗装
  { id: 'w5', name: '高橋 優', company: '高橋塗装', occupation: '塗装工', avatarUrl: 'https://picsum.photos/id/1006/100/100' },
  { id: 'w5-2', name: '高橋 誠', company: '高橋塗装', occupation: '塗装工', avatarUrl: 'https://picsum.photos/id/1008/100/100' },
];

const MOCK_SITES: Site[] = [
  { id: 's1', name: '渋谷桜丘プロジェクト A工区', address: '東京都渋谷区桜丘町', qrCodeValue: 'site-shibuya-a' },
  { id: 's2', name: '新宿駅西口再開発 B工区', address: '東京都新宿区西新宿', qrCodeValue: 'site-shinjuku-b' },
];

const CURRENT_WORKER_ID = 'w2';

// --- Store Interface ---

interface AppState {
  // Data
  workers: Worker[];
  sites: Site[];
  records: AttendanceRecord[];
  currentUser: Worker | null;
  
  // UI State
  viewMode: ViewMode;
  scannedSite: Site | null;
  selectedDate: string;
  lastActionMessage: string | null;
  
  // Filters
  filterSiteId: string;
  filterCompany: string;
  filterName: string;
  
  // AI Analysis State
  aiAnalysis: string;
  isAnalyzing: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setScannedSite: (site: Site | null) => void;
  setSelectedDate: (date: string) => void;
  setFilterSiteId: (id: string) => void;
  setFilterCompany: (company: string) => void;
  setFilterName: (name: string) => void;
  setAiAnalysis: (text: string) => void;
  
  // Complex Actions
  checkIn: () => void;
  checkOut: () => void;
  loadMonthlyData: (targetDate: string) => Promise<void>;
  runAiAnalysis: () => Promise<void>;
  
  // Manual Edit Actions
  upsertRecord: (record: Partial<AttendanceRecord> & { workerId: string; date: string }) => void;
  deleteRecord: (recordId: string) => void;
}

// --- Store Implementation ---

export const useAppStore = create<AppState>((set, get) => ({
  // Initial Data
  workers: MOCK_WORKERS,
  sites: MOCK_SITES,
  records: [],
  currentUser: MOCK_WORKERS.find(w => w.id === CURRENT_WORKER_ID) || null,
  
  viewMode: 'DASHBOARD',
  scannedSite: null,
  selectedDate: new Date().toISOString().split('T')[0],
  lastActionMessage: null,
  
  filterSiteId: '',
  filterCompany: '',
  filterName: '',
  
  aiAnalysis: '',
  isAnalyzing: false,

  // Simple Setters
  setViewMode: (mode) => set({ viewMode: mode }),
  setScannedSite: (site) => set({ scannedSite: site, lastActionMessage: null }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFilterSiteId: (id) => set({ filterSiteId: id }),
  setFilterCompany: (company) => set({ filterCompany: company }),
  setFilterName: (name) => set({ filterName: name }),
  setAiAnalysis: (text) => set({ aiAnalysis: text }),

  // Complex Logic
  
  checkIn: () => {
    const { scannedSite, currentUser, selectedDate, records } = get();
    if (!scannedSite || !currentUser) return;

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      workerId: currentUser.id,
      siteId: scannedSite.id,
      date: selectedDate,
      checkInTime: new Date().toISOString(),
      status: AttendanceStatus.CHECKED_IN
    };

    // Remove existing record for the same day/worker to prevent dupes in this demo
    const otherRecords = records.filter(r => r.workerId !== currentUser.id || r.date !== selectedDate);

    set({ 
      records: [...otherRecords, newRecord],
      lastActionMessage: `「${scannedSite.name}」に入場しました。`
    });

    setTimeout(() => {
        set({ viewMode: 'DASHBOARD', scannedSite: null });
    }, 2000);
  },

  checkOut: () => {
    const { scannedSite, currentUser, selectedDate, records } = get();
    if (!scannedSite || !currentUser) return;

    const updatedRecords = records.map(r => {
      if (r.workerId === currentUser.id && r.date === selectedDate && !r.checkOutTime) {
        return {
          ...r,
          checkOutTime: new Date().toISOString(),
          status: AttendanceStatus.CHECKED_OUT
        };
      }
      return r;
    });

    set({ 
      records: updatedRecords,
      lastActionMessage: `「${scannedSite.name}」から退場しました。`
    });

    setTimeout(() => {
        set({ viewMode: 'DASHBOARD', scannedSite: null });
    }, 2000);
  },

  loadMonthlyData: async (targetDate: string) => {
    const { records, sites, workers } = get();
    if (!sites[0]) return;

    const d = new Date(targetDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    const hasDataForMonth = records.some(r => r.date.startsWith(monthKey));

    if (!hasDataForMonth) {
      // Static Data
      const monthRecords = generateStaticMonthData(workers, sites[0], year, month);
      
      // AI Generated Data for specific day
      const specificDayRecords = await generateMockData(workers, sites[0], targetDate);
      
      const filteredStatic = monthRecords.filter(r => r.date !== targetDate);
      const existingIds = new Set(records.map(r => r.id));
      const newRecords = [...filteredStatic, ...specificDayRecords].filter(r => !existingIds.has(r.id));
      
      set({ records: [...records, ...newRecords] });
    }
  },

  runAiAnalysis: async () => {
    const { records, workers, selectedDate } = get();
    set({ isAnalyzing: true });

    const monthPrefix = selectedDate.substring(0, 7);
    const relevantRecords = records.filter(r => r.date.startsWith(monthPrefix));
    
    const result = await analyzeSiteProductivity(relevantRecords, workers);
    set({ aiAnalysis: result, isAnalyzing: false });
  },

  upsertRecord: (partialRecord) => {
    const { records, sites } = get();
    const defaultSite = sites[0]?.id || 'unknown';
    
    const existingIndex = records.findIndex(
      r => (partialRecord.id && r.id === partialRecord.id) || (r.workerId === partialRecord.workerId && r.date === partialRecord.date)
    );

    if (existingIndex >= 0) {
      // Update
      const updatedRecords = [...records];
      updatedRecords[existingIndex] = { ...updatedRecords[existingIndex], ...partialRecord };
      set({ records: updatedRecords });
    } else {
      // Insert
      const newRecord: AttendanceRecord = {
        id: partialRecord.id || `manual-${Date.now()}`,
        workerId: partialRecord.workerId,
        siteId: partialRecord.siteId || defaultSite,
        date: partialRecord.date,
        checkInTime: partialRecord.checkInTime || '',
        checkOutTime: partialRecord.checkOutTime,
        status: partialRecord.status || AttendanceStatus.CHECKED_IN
      };
      set({ records: [...records, newRecord] });
    }
  },

  deleteRecord: (recordId: string) => {
    const { records } = get();
    set({ records: records.filter(r => r.id !== recordId) });
  }
}));
