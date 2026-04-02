import React, { useState, useEffect, useRef } from 'react';
import { X, Columns } from 'lucide-react';
import { createColumn } from '../../api/columnApi';
import { useToast } from '../../context/ToastContext';

const AddColumnModal = ({ isOpen, onClose, boardId, onColumnCreated }) => {
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
      const res = await createColumn({ name: name.trim(), boardId });
      const col = res?.data || res;
      onColumnCreated?.(col);
      success(`Column "${name.trim()}" created`);
      onClose();
    } catch {
      toastError('Failed to create column. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgb(0,0,0,0.3)]
        w-full max-w-sm border border-gray-100 animate-modal-in">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Columns size={14} className="text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Add New Column</h3>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Column Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500
                focus:border-transparent transition-all placeholder-gray-400"
              placeholder="e.g. In Review"
              maxLength={50}
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
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700
                rounded-xl disabled:opacity-50 transition-all duration-200
                shadow-sm shadow-indigo-200 flex items-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Adding…</>
              ) : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddColumnModal;
