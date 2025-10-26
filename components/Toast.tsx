import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Toast, ToastType } from '../types';
import { CheckCircleIcon, ExclamationCircleIcon, CloseIcon } from './Icons';

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  // Expose only the showToast function to components
  return { showToast: context.showToast };
};

const ToastContainer: React.FC = () => {
    const context = useContext(ToastContext);
  
    if (!context) {
      return null;
    }
    
    const { toasts, removeToast } = context;

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] space-y-3 w-full max-w-xs sm:max-w-sm">
        {toasts.map(toast => (
            <ToastMessage key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
        </div>
    );
};


export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    const timer = setTimeout(() => {
      removeToast(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [removeToast]);

  const value = { toasts, showToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};


const ToastMessage: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const isSuccess = toast.type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const Icon = isSuccess ? CheckCircleIcon : ExclamationCircleIcon;

  return (
    <div 
        className={`flex items-center justify-between w-full p-4 text-white ${bgColor} rounded-lg shadow-lg animate-toast-in`}
        role="alert"
        aria-live="assertive"
    >
      <div className="flex items-center">
        <Icon className="w-6 h-6 me-3" />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20" aria-label="بستن">
        <CloseIcon className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes toast-in {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .animate-toast-in {
            animation: toast-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
