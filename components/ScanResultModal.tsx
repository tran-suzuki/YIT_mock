import React from 'react';
import { MapPin, Play, LogOut, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const ScanResultModal: React.FC = () => {
  const { scannedSite, lastActionMessage, checkIn, checkOut, setScannedSite } = useAppStore();

  if (!scannedSite) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-200 scale-95">
        <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <MapPin size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">現在地</span>
              </div>
              <h3 className="text-xl font-bold pr-8">{scannedSite.name}</h3>
            </div>
            <button 
              onClick={() => setScannedSite(null)}
              className="text-white/50 hover:text-white transition"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-2 relative z-10">{scannedSite.address}</p>
        </div>

        <div className="p-8">
          {lastActionMessage ? (
            <div className="text-center py-8">
              <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
              <p className="text-xl font-bold text-slate-800">{lastActionMessage}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={checkIn}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-blue-50 text-blue-700 border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-100 transition group"
              >
                <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition">
                  <Play size={28} className="ml-1" fill="currentColor" />
                </div>
                <span className="font-bold text-lg">入場する</span>
                <span className="text-xs opacity-60">Check In</span>
              </button>

              <button 
                onClick={checkOut}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-orange-50 text-orange-700 border-2 border-orange-100 hover:border-orange-500 hover:bg-orange-100 transition group"
              >
                <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition">
                  <LogOut size={28} className="ml-1" />
                </div>
                <span className="font-bold text-lg">退場する</span>
                <span className="text-xs opacity-60">Check Out</span>
              </button>
            </div>
          )}
          
          <div className="mt-8 text-center text-xs text-slate-400 font-mono">
            現在時刻: {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit'})}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultModal;