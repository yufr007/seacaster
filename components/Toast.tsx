import React from 'react';
import { useUIStore } from '../store/uiStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-20 left-0 w-full flex flex-col items-center gap-2 pointer-events-none z-[100]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto min-w-[300px] max-w-[90%] bg-ocean-800/90 backdrop-blur-md border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            {toast.type === 'success' && <CheckCircle className="text-green-400" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-red-400" size={20} />}
            {toast.type === 'info' && <Info className="text-sky-400" size={20} />}
            
            <span className="flex-1 text-sm font-bold">{toast.message}</span>
            
            <button onClick={() => removeToast(toast.id)} className="text-white/50 hover:text-white">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;