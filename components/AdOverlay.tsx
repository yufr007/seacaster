import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface AdOverlayProps {
  onComplete: () => void;
  onCancel: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Fake Ad Content */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black animate-pulse opacity-50"></div>
      
      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-sm px-8">
        <div className="text-6xl animate-bounce">⚔️</div>
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
            RAID LEGENDS
          </h2>
          <p className="text-purple-200 text-sm">Download now to get 100 FREE SPINS!</p>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
           <motion.div 
             initial={{ width: "0%" }}
             animate={{ width: "100%" }}
             transition={{ duration: 5, ease: "linear" }}
             className="h-full bg-yellow-400"
           />
        </div>

        <button className="bg-green-500 hover:bg-green-400 text-white font-black py-4 px-8 rounded-full text-xl shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse">
           INSTALL NOW
        </button>
      </div>

      {/* Close / Timer UI */}
      <div className="absolute top-4 right-4 z-20">
        {!canClose ? (
          <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-white font-mono font-bold text-xs bg-black/40 backdrop-blur">
            {timeLeft}
          </div>
        ) : (
          <button 
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white backdrop-blur transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 text-[10px] text-white/30 font-mono">
        Ad Choice ⓘ
      </div>
    </div>
  );
};

export default AdOverlay;