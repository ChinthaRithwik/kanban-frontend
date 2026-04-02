import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import { updateTask } from '../../api/taskApi';
import { useToast } from '../../context/ToastContext';

const EditTaskModal = ({ isOpen, task, onClose, onTaskUpdated, sendTypingEvent }) => {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const titleRef = useRef(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const hasChanges =
    title.trim() !== (task.title || '') ||
    description  !== (task.description || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !hasChanges) return;
    setLoading(true);
    try {
      const res = await updateTask(task.id, { title: title.trim(), description });
      const updated = res?.data || res;
      onTaskUpdated?.({ ...task, title: title.trim(), description, ...updated });
      success('Task updated');
      onClose();
    } catch {
      toastError('Failed to update task. Please try again.');
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
        w-full max-w-md overflow-hidden animate-modal-in border border-gray-100">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Save size={14} className="text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Edit Task</h3>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); sendTypingEvent?.(); }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500
                focus:border-transparent transition-all placeholder-gray-400"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); sendTypingEvent?.(); }}
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500
                focus:border-transparent transition-all resize-none placeholder-gray-400"
              placeholder="Add details…"
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !hasChanges}
              className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700
                rounded-xl disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm shadow-violet-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <><Save size={15} />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
