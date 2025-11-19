import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import jsQR from 'jsqr';

const QRScanner: React.FC = () => {
  const { setScannedSite, setViewMode, sites } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [statusMessage, setStatusMessage] = useState("カメラ起動中...");
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startScan = async () => {
      try {
        setError(null);
        setStatusMessage("カメラ起動中...");
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // iOS sometimes needs this to play
          videoRef.current.setAttribute("playsinline", "true"); 
          await videoRef.current.play();
          setStatusMessage("枠内にQRコードを合わせてください");
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setError("カメラへのアクセスが拒否されました。設定を確認してください。");
      }
    };

    const tick = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
              // --- DEMO MODE LOGIC ---
              // Try to find a real match first
              let targetSite = sites.find(s => s.qrCodeValue === code.data);
              
              // If no match (e.g., scanned a random soda bottle), default to the first site for the demo
              if (!targetSite && sites.length > 0) {
                console.log("Demo Mode: Unknown QR scanned, defaulting to first site.");
                targetSite = sites[0];
              }

              if (targetSite) {
                setStatusMessage(`読取成功！(${targetSite.name})`);
                // Small delay to show success message before switching
                setTimeout(() => {
                  setScannedSite(targetSite);
                }, 500);
                return; // Stop loop
              }
            }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startScan();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [facingMode, sites, setScannedSite]);

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <button 
        onClick={() => setViewMode('DASHBOARD')}
        className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition z-50"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-sm relative flex flex-col items-center">
        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-bold mb-2">QRコード読取</h2>
          {error ? (
             <div className="flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-2 rounded-lg text-sm">
               <AlertCircle size={16} />
               {error}
             </div>
          ) : (
             <p className="text-slate-400 text-sm">{statusMessage}</p>
          )}
        </div>

        {/* Scanner Frame */}
        <div className="relative aspect-square w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          
          {/* Video Feed */}
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover" 
            muted 
            playsInline 
          />
          
          {/* Hidden Canvas for detection */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(gray 1px, transparent 1px), linear-gradient(90deg, gray 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          {/* Scanning Line Animation */}
          {!error && (
             <div 
               className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10 animate-scan"
               style={{ top: '50%' }}
             />
          )}

          {/* Style for scan animation since tailwind config might not have custom keyframes */}
          <style>{`
            @keyframes scan {
              0% { top: 10%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 90%; opacity: 0; }
            }
            .animate-scan {
              animation: scan 2s infinite ease-in-out;
            }
          `}</style>
          
          {/* Corner Markers */}
          <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-blue-500/80 rounded-tl-xl z-20"></div>
          <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-blue-500/80 rounded-tr-xl z-20"></div>
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-blue-500/80 rounded-bl-xl z-20"></div>
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-blue-500/80 rounded-br-xl z-20"></div>
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleSwitchCamera}
            className="flex items-center gap-2 text-white/80 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full text-sm font-medium transition backdrop-blur-md"
          >
             <Camera size={18} />
             カメラ切替
          </button>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-slate-500 max-w-xs text-center">
        ※デモモード: 任意のQRコードを読み込むと自動的に最初の現場として認識されます。
      </div>
    </div>
  );
};

export default QRScanner;