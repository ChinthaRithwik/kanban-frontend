import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import CreateBoardModal from '../components/boards/CreateBoardModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getBoards, deleteBoard } from '../api/boardApi';
import { useToast } from '../context/ToastContext';
import {
  Plus, LayoutDashboard, Calendar, Trash2, ArrowRight,
  FolderOpen, MoreHorizontal, Layers,
} from 'lucide-react';

/* Colour palette for board cards */
const COLORS = [
  { from: 'from-blue-500',    to: 'to-indigo-600',  light: 'bg-blue-50',    text: 'text-blue-700'   },
  { from: 'from-violet-500',  to: 'to-purple-600',  light: 'bg-violet-50',  text: 'text-violet-700' },
  { from: 'from-emerald-500', to: 'to-teal-600',    light: 'bg-emerald-50', text: 'text-emerald-700'},
  { from: 'from-rose-500',    to: 'to-pink-600',    light: 'bg-rose-50',    text: 'text-rose-700'   },
  { from: 'from-amber-500',   to: 'to-orange-600',  light: 'bg-amber-50',   text: 'text-amber-700'  },
  { from: 'from-cyan-500',    to: 'to-blue-600',    light: 'bg-cyan-50',    text: 'text-cyan-700'   },
];

/* ── Board card ── */
const BoardCard = ({ board, onDelete, index }) => {
  const navigate   = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef    = React.useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const formatted = board.createdAt
    ? new Date(board.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const palette  = COLORS[board.id % COLORS.length];
  const initials = (board.name || '?').slice(0, 2).toUpperCase();

  return (
    <div
      className="
        bg-white rounded-2xl border border-gray-200
        shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]
        hover:shadow-[0_8px_24px_-4px_rgb(0,0,0,0.12)]
        hover:-translate-y-0.5
        transition-all duration-200
        group overflow-hidden cursor-pointer relative
        animate-card-in
      "
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/boards/${board.id}`)}
    >
      {/* Gradient top strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${palette.from} ${palette.to}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Board avatar */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            text-white font-extrabold text-sm shrink-0
            bg-gradient-to-br ${palette.from} ${palette.to}
            shadow-sm
          `}>
            {initials}
          </div>

          {/* 3-dot menu */}
          <div
            ref={menuRef}
            className="relative opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="
                absolute right-0 top-8 z-50
                bg-white border border-gray-200 rounded-xl
                shadow-[0_8px_24px_-4px_rgb(0,0,0,0.14)]
                py-1 min-w-[148px]
                animate-fade-up
              ">
                <button
                  onClick={() => { setMenuOpen(false); navigate(`/boards/${board.id}`); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowRight size={14} className="text-blue-500" />
                  Open board
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(board); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete board
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="text-base font-bold text-gray-800 truncate group-hover:text-blue-600
            transition-colors duration-200">
            {board.name}
          </h3>
          {formatted && (
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-gray-400" />
              <span className="text-xs text-gray-400">{formatted}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className={`flex items-center gap-1.5 ${palette.light} px-2.5 py-1 rounded-lg`}>
            <Layers size={11} className={palette.text} />
            <span className={`text-xs font-semibold ${palette.text}`}>Kanban</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={13} className="text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Loading skeleton ── */
const BoardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="h-1.5 skeleton" />
    <div className="p-5 space-y-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100 flex justify-between">
        <div className="h-5 w-16 bg-gray-100 rounded-lg" />
        <div className="h-5 w-10 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

/* ── Page ── */
const DashboardPage = () => {
  const navigate                        = useNavigate();
  const [boards,       setBoards]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const { success, error: toastError }  = useToast();

  useEffect(() => { fetchBoards(); }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const res  = await getBoards();
      const data = Array.isArray(res) ? res : (res?.data || []);
      setBoards(data);
    } catch {
      setError('Failed to load boards.');
    } finally {
      setLoading(false);
    }
  };

  const handleBoardCreated = (newBoard) => {
    const b = newBoard?.data ?? newBoard;
    console.log("Created Board:", b);
    setBoards(prev => {
      const nextBoards = [b, ...prev];
      console.log("Boards after update:", nextBoards);
      return nextBoards;
    });
    navigate(`/boards/${b.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBoard(deleteTarget.id);
      setBoards(prev => prev.filter(b => b.id !== deleteTarget.id));
      success(`Board "${deleteTarget.name}" deleted`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete board.';
      toastError(msg);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div className="animate-fade-up">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Workspaces</h1>
            </div>
            <p className="text-sm text-gray-500 ml-10">
              {loading ? 'Loading boards…' : `${boards.length} board${boards.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-blue-600 text-white text-sm font-bold rounded-xl
              hover:bg-blue-700 transition-all duration-200
              shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200
              animate-fade-up
            "
          >
            <Plus size={16} />
            New Board
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6
            flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={fetchBoards}
              className="text-sm font-bold underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Board grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <BoardSkeleton key={i} />)}
          </div>
        ) : boards.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-28 text-gray-400 animate-fade-up">
            <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center mb-5
              shadow-inner">
              <FolderOpen size={40} strokeWidth={1.2} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-600 mb-2">No boards yet</h2>
            <p className="text-sm mb-7 text-center max-w-xs text-gray-400 leading-relaxed">
              Create your first board to start managing tasks with your team.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm
                font-bold rounded-xl hover:bg-blue-700 transition-all duration-200
                shadow-sm shadow-blue-200 hover:shadow-md"
            >
              <Plus size={16} />
              Create Your First Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {boards.map((board, i) => (
              <BoardCard key={board.id} board={board} onDelete={setDeleteTarget} index={i} />
            ))}
          </div>
        )}
      </main>

      <CreateBoardModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onBoardCreated={handleBoardCreated}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Board"
        message={`Permanently delete "${deleteTarget?.name}"? All columns and tasks will be lost.`}
        confirmLabel="Delete Board"
        danger
      />
    </div>
  );
};

export default DashboardPage;
