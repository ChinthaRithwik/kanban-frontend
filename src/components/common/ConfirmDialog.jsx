import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Confirm Action',
  message      = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  danger       = true,
  loading      = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgb(0,0,0,0.3)]
        w-full max-w-sm border border-gray-100 animate-modal-in">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {danger && (
              <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={15} className="text-red-600" />
              </div>
            )}
            <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600
              hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
              px-5 py-2.5 text-sm font-bold text-white rounded-xl
              disabled:opacity-50 flex items-center gap-2
              transition-all duration-200
              ${danger
                ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 hover:shadow-md hover:shadow-red-200'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200'}
            `}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
