import React, { useState, useEffect, useRef } from 'react';
import { X, LayoutDashboard } from 'lucide-react';
import { createBoard } from '../../api/boardApi';
import { useToast } from '../../context/ToastContext';

const CreateBoardModal = ({ isOpen, onClose, onBoardCreated }) => {
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await createBoard({ name: name.trim() });
      const newBoard = res.data || res;
      onBoardCreated?.(newBoard);
      success(`Board "${name.trim()}" created`);
      onClose();
    } catch {
      toastError('Failed to create board.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 animate-modal-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard size={14} className="text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Create New Board</h3>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Board Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:border-transparent transition-all placeholder-gray-400"
              placeholder="e.g. Product Roadmap Q4"
              maxLength={80}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700
                rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
              ) : 'Create Board'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in { animation: modalIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default CreateBoardModal;
