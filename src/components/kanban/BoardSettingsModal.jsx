import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Trash2, Save } from 'lucide-react';
import { updateBoard, deleteBoard } from '../../api/boardApi';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';

const BoardSettingsModal = ({ isOpen, board, onClose, onBoardUpdated, onBoardDeleted }) => {
  const [name,          setName]          = useState('');
  const [saving,        setSaving]        = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const inputRef = useRef(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (isOpen && board) {
      setName(board.name || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, board]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen || !board) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === board.name) return;
    setSaving(true);
    try {
      await updateBoard(board.id, { name: name.trim() });
      onBoardUpdated?.({ ...board, name: name.trim() });
      success(`Board renamed to "${name.trim()}"`);
      onClose();
    } catch {
      toastError('Failed to update board.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBoard(board.id);
      success('Board deleted');
      onBoardDeleted?.();
    } catch {
      toastError('Failed to delete board.');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgb(0,0,0,0.3)]
          w-full max-w-md border border-gray-100 animate-modal-in">

          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center">
                <Settings size={14} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Board Settings</h3>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Rename */}
            <form onSubmit={handleSave} className="space-y-3">
              <h4 className="text-sm font-bold text-gray-700">Rename Board</h4>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                    text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-700
                    focus:border-transparent transition-all"
                  maxLength={80}
                  required
                />
                <button
                  type="submit"
                  disabled={saving || !name.trim() || name.trim() === board.name}
                  className="px-4 py-2.5 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900
                    rounded-xl disabled:opacity-50 transition-all duration-200
                    flex items-center gap-1.5 shrink-0"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save size={14} />Save</>
                  )}
                </button>
              </div>
            </form>

            {/* Danger zone */}
            <div className="border border-red-200 rounded-xl p-4 bg-red-50/50">
              <h4 className="text-sm font-bold text-red-700 mb-1">Danger Zone</h4>
              <p className="text-xs text-red-600/80 mb-3 leading-relaxed">
                Deleting this board will permanently remove all columns and tasks. This cannot be undone.
              </p>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                  text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Delete this board
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Board"
        message={`Are you sure you want to permanently delete "${board.name}"? This cannot be undone.`}
        confirmLabel="Delete Board"
        danger
      />
    </>
  );
};

export default BoardSettingsModal;
