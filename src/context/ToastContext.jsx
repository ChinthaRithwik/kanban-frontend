import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

const ICONS = {
  success: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
  info:    <Info       size={18} className="text-blue-500 shrink-0" />,
};

const BG = {
  success: 'bg-white border-l-4 border-emerald-500',
  error:   'bg-white border-l-4 border-red-500',
  warning: 'bg-white border-l-4 border-amber-500',
  info:    'bg-white border-l-4 border-blue-500',
};

const Toast = ({ toast, onDismiss }) => (
  <div
    className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-sm
      ${BG[toast.type]} animate-slide-in`}
    style={{ animation: 'slideIn 0.25s ease-out' }}
  >
    {ICONS[toast.type]}
    <p className="text-sm text-gray-800 font-medium flex-1 leading-snug">{toast.message}</p>
    <button
      onClick={() => onDismiss(toast.id)}
      className="text-gray-300 hover:text-gray-500 ml-1 shrink-0 mt-0.5 transition-colors"
    >
      <X size={14} />
    </button>
  </div>
);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(({ message, type = 'info', duration = 3500 }) => {
    const id = ++idCounter;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((msg, opts) => toast({ message: msg, type: 'success', ...opts }), [toast]);
  const error   = useCallback((msg, opts) => toast({ message: msg, type: 'error',   ...opts }), [toast]);
  const warning = useCallback((msg, opts) => toast({ message: msg, type: 'warning', ...opts }), [toast]);
  const info    = useCallback((msg, opts) => toast({ message: msg, type: 'info',    ...opts }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
