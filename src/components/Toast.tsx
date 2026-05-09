import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

import { ToastType } from '../../types';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'ERROR': return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'INFO': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={20} className="text-emerald-500" />;
      case 'ERROR': return <AlertCircle size={20} className="text-rose-500" />;
      case 'INFO': return <Info size={20} className="text-blue-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in fade-in slide-in-from-top-4 ${getStyles()}`}>
      {getIcon()}
      <span className="text-sm font-semibold whitespace-nowrap">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition">
        <X size={16} className="opacity-60" />
      </button>
    </div>
  );
};
