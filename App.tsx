
import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import QRScanner from './components/QRScanner';
import DezuraTable from './components/DezuraTable';
import DashboardStats from './components/DashboardStats';
import SearchFilter from './components/SearchFilter';
import AnalysisView from './components/AnalysisView';
import CompanySummary from './components/CompanySummary';
import SiteSummary from './components/SiteSummary';
import ScanResultModal from './components/ScanResultModal';
import { useAppStore } from './store/useAppStore';

const App: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    scannedSite, 
    setScannedSite,
    selectedDate,
    loadMonthlyData
  } = useAppStore();

  // Initialize Data on Date Change
  useEffect(() => {
    loadMonthlyData(selectedDate);
  }, [selectedDate, loadMonthlyData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* SCAN MODE */}
        {viewMode === 'SCAN' && (
          scannedSite ? (
            <ScanResultModal />
          ) : (
            <QRScanner />
          )
        )}

        {/* DASHBOARD MODE */}
        {viewMode === 'DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardStats />
            <SearchFilter />
            <div className="h-[600px]">
               <DezuraTable />
            </div>
          </div>
        )}

        {/* COMPANY SUMMARY MODE */}
        {viewMode === 'COMPANY_SUMMARY' && (
           <div className="space-y-8">
              {/* Re-use SearchFilter to control the "Selected Date" and "Site" context for the summary */}
              <SearchFilter />
              <CompanySummary />
           </div>
        )}

        {/* SITE SUMMARY MODE */}
        {viewMode === 'SITE_SUMMARY' && (
           <div className="space-y-8">
              {/* Re-use SearchFilter to control the "Selected Date" and "Company" context for the summary */}
              <SearchFilter />
              <SiteSummary />
           </div>
        )}

        {/* ANALYSIS MODE */}
        {viewMode === 'ANALYSIS' && (
          <AnalysisView />
        )}
      </main>
    </div>
  );
};

export default App;
