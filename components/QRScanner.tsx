import React, { useState, useEffect } from 'react';
import { Scan, X, Camera, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const QRScanner: React.FC = () => {
  const { setScannedSite, setViewMode, sites } = useAppStore();
  const [scanning, setScanning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("枠内にQRコードを合わせてください");

  // Simulate camera scanning process
  useEffect(() => {
    let interval: any;
    if (scanning) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Simulating a successful scan of the first site
            setScanning(false);
            setStatusMessage("読取完了");
            setTimeout(() => {
              if (sites.length > 0) {
                setScannedSite(sites[0]);
              }
            }, 800);
            return 100;
          }
          return prev + 2; // Increment progress
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [scanning, setScannedSite, sites]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <button 
        onClick={() => setViewMode('DASHBOARD')}
        className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-bold mb-2">QRコード読取</h2>
          <p className="text-slate-400 text-sm">{statusMessage}</p>
        </div>

        {/* Scanner Frame */}
        <div className="relative aspect-square w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          
          {/* Simulated Camera View */}
          <div className="absolute inset-0 bg-slate-800"></div>
          
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'linear-gradient(gray 1px, transparent 1px), linear-gradient(90deg, gray 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          {/* Scanning Line */}
          {scanning && (
             <div 
               className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"
               style={{ top: `${progress}%`, transition: 'top 0.1s linear' }}
             />
          )}

          {/* Success State */}
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-in zoom-in">
              <CheckCircle2 size={80} className="text-green-400 drop-shadow-lg" />
            </div>
          )}
          
          {/* Corner Markers */}
          <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-blue-500/80 rounded-tl-xl"></div>
          <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-blue-500/80 rounded-tr-xl"></div>
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-blue-500/80 rounded-bl-xl"></div>
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-blue-500/80 rounded-br-xl"></div>
        </div>

        <div className="mt-8 flex justify-center">
          <button className="flex items-center gap-2 text-white/80 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full text-sm font-medium transition backdrop-blur-md">
             <Camera size={18} />
             カメラ切替
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;