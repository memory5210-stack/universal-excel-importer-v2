'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// 创建全局 Context
import { createContext, useContext } from 'react';
const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // 3 秒后自动消失
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      success: (msg) => showToast('success', msg),
      error: (msg) => showToast('error', msg),
      warning: (msg) => showToast('warning', msg),
      info: (msg) => showToast('info', msg),
    }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const config = {
    success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
    warning: { icon: AlertCircle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
    info: { icon: CheckCircle, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  };

  const { icon: Icon, bg, border, text } = config[toast.type];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${bg} ${border} border min-w-[300px] animate-slide-in`}>
      <Icon className={`w-5 h-5 ${text}`} />
      <span className={`flex-1 ${text} text-sm`}>{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className={`${text} hover:opacity-70`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// 提供 Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
