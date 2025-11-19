
import React from 'react';
import { HardHat, QrCode, UserCircle, Building } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const Navbar: React.FC = () => {
  const { viewMode, setViewMode, currentUser } = useAppStore();
  const activeUser = currentUser?.name || 'ゲスト';

  return (
    <nav className="bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewMode('DASHBOARD')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-md group-hover:scale-105 transition-transform">
              <HardHat size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">現場<span className="text-indigo-600">管理システム</span></span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              <button
                onClick={() => setViewMode('DASHBOARD')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'DASHBOARD' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                ダッシュボード
              </button>
              <button
                onClick={() => setViewMode('COMPANY_SUMMARY')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'COMPANY_SUMMARY' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                会社別集計
              </button>
              <button
                onClick={() => setViewMode('SITE_SUMMARY')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'SITE_SUMMARY' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                現場別集計
              </button>
              <button
                onClick={() => setViewMode('ANALYSIS')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'ANALYSIS' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                AI分析レポート
              </button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode('SCAN')}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              <QrCode size={18} />
              <span className="hidden sm:inline">QRスキャン</span>
              <span className="sm:hidden">読取</span>
            </button>
            
            <div className="flex items-center gap-2 text-slate-500 border-l border-slate-200 pl-4">
              <UserCircle size={24} className="text-slate-400" />
              <span className="text-sm font-medium hidden sm:block">{activeUser}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
