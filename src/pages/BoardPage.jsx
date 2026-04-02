import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Activity, Wifi, WifiOff } from 'lucide-react';
import { useActivity } from '../context/ActivityContext';
import { useBoard } from '../hooks/useBoard';
import api from '../api/axios';
import { getCurrentUser } from '../api/userApi';

import Navbar from '../components/layout/Navbar';
import KanbanBoard, { KanbanSkeleton } from '../components/kanban/KanbanBoard';
import BoardSettingsModal from '../components/kanban/BoardSettingsModal';
import BoardMembersBar from '../components/boards/BoardMembersBar';
import InviteUserModal from '../components/boards/InviteUserModal';
import PresenceBar from '../components/presence/PresenceBar';
import TypingIndicator from '../components/TypingIndicator';
import CursorLayer from '../components/CursorLayer';

const BoardPage = () => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [members, setMembers] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch(e) {
      return null;
    }
  });

  const { boardId } = useParams();
  const navigate = useNavigate();

  const { pushActivity, setInitialActivities } = useActivity();

  const {
    board,
    columns,
    tasks,
    onlineUsers,
    typingUsers,
    cursors,
    loading,
    error,
    isConnected,
    overrideTasksState,
    addTask,
    patchTask,
    removeTask,
    addColumn,
    renameColumn,
    deleteColumnLocally,
    patchBoard,
    fetchBoardData,
    sendTypingEvent,
    sendCursor,
  } = useBoard(boardId);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  // Mouse tracking
  useEffect(() => {
    let lastSent = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastSent < 50) return;
      lastSent = now;
      sendCursor(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sendCursor]);

  // Load initial activities from REST (paginated, newest 50)
  useEffect(() => {
    if (!boardId) return;
    api.get(`/boards/${boardId}/activities`, { params: { page: 0, size: 50 } })
      .then(res => {
        const payload = res.data?.data ?? {};
        setInitialActivities(payload.activities ?? [], payload.hasMore ?? false);
      })
      .catch(() => { /* silent – activity panel will show WS events only */ });
  }, [boardId, setInitialActivities]);

  const handleTasksOptimisticUpdate = useCallback((updater) => {
    overrideTasksState(updater);
  }, [overrideTasksState]);

  const handleTaskCreated = useCallback((createdTask, columnId) => {

  }, []);

  const handleTaskUpdated = useCallback((updatedTask) => {
    const t = updatedTask?.data ?? updatedTask;
    patchTask(t.id, t);
  }, [patchTask]);

  const handleTaskDeleted = useCallback((taskId) => {
    removeTask(taskId);
  }, [removeTask]);

  const handleColumnCreated = useCallback((col) => {
    const c = col?.data ?? col;
    addColumn(c);
  }, [addColumn]);

  const handleColumnRenamed = useCallback((columnId, name) => {
    renameColumn(columnId, name);
  }, [renameColumn]);

  const handleColumnDeleted = useCallback((columnId) => {
    deleteColumnLocally(columnId);
  }, [deleteColumnLocally]);

  const handleBoardUpdated = useCallback((updated) => {
    patchBoard(updated);
    setSettingsOpen(false);
  }, [patchBoard]);

  const handleBoardDeleted = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  /**
   * Deduplicate an array of member objects by `user_id` (or `userId` fallback).
   * Returns a new array with only the last occurrence of each unique user.
   */
  const deduplicateMembers = useCallback((arr) => {
    if (!Array.isArray(arr)) return [];
    const map = new Map();
    arr.forEach(m => {
      const key = String(m.user_id ?? m.userId ?? '');
      if (key) map.set(key, m);
    });
    return Array.from(map.values());
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get(`/boards/${boardId}/members`);
      const raw = res.data.data;
      setMembers(deduplicateMembers(raw));
    } catch (e) {
      console.error("MEMBERS ERROR:", e);
    }
  }, [boardId, deduplicateMembers]);

  const isAdmin =
    currentUser?.id && members.length > 0
      ? members.some(
          m =>
            String(m.user_id ?? m.userId) === String(currentUser.id) &&
            m.role === 'ADMIN'
        )
      : false;

  useEffect(() => {
    if (boardId) fetchMembers();
    // Re-verify the current user profile from the server as a background refresh
    // and fallback if the JWT decoding fails.
    getCurrentUser()
      .then(res => {
         const userPayload = res?.data ?? res;
         if (userPayload && !currentUser) {
            setCurrentUser(userPayload);
         }
      })
      .catch(() => { });
  }, [boardId]);

  const totalTasks = Object.values(tasks).flat().length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Board header */}
        <div className="px-6 sm:px-8 py-4 flex items-center justify-between shrink-0
          border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100
                border border-gray-200 transition-all"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            {loading && !board ? (
              <div className="h-7 w-52 bg-gray-200 rounded-lg animate-pulse" />
            ) : (
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {board?.name}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {columns.length} column{columns.length !== 1 ? 's' : ''} ·{' '}
                  {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* WS connection badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold
              transition-colors ${isConnected
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {isConnected
                ? <><Wifi size={12} /> Connected</>
                : <><WifiOff size={12} /> Reconnecting…</>}
            </div>

            <BoardMembersBar
              members={members}
              isAdmin={isAdmin}
              onInviteClick={() => setInviteOpen(true)}
            />

            <button
              onClick={() => setActivityOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                font-semibold border transition-all
                ${activityOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 border-gray-200'}`}
            >
              <Activity size={15} />
              <span className="hidden sm:inline">Activity</span>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all"
            >
              <Settings size={15} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3
            rounded-xl text-sm font-medium flex items-center justify-between shrink-0">
            <span>Failed to load board. Please try again.</span>
            <button
              onClick={fetchBoardData}
              className="text-red-700 underline hover:no-underline text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Board canvas */}
        <div className="flex-1 flex flex-col overflow-hidden px-6 sm:px-8 pt-4">
          <div className="flex items-center gap-4 shrink-0">
            <PresenceBar users={onlineUsers || []} />
            <TypingIndicator users={typingUsers || []} />
          </div>
          <CursorLayer cursors={cursors || {}} />

          <div className="flex-1 overflow-hidden mt-4">
            {loading && !columns.length ? (
              <KanbanSkeleton />
            ) : (
              <KanbanBoard
                board={board}
                columns={columns}
                tasksMap={tasks}
                sendTypingEvent={sendTypingEvent}
                onTasksOptimisticUpdate={handleTasksOptimisticUpdate}
                onTaskCreated={handleTaskCreated}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onColumnCreated={handleColumnCreated}
                onColumnRenamed={handleColumnRenamed}
                onColumnDeleted={handleColumnDeleted}
                activityOpen={activityOpen}
                onActivityClose={() => setActivityOpen(false)}
                onDragFailed={fetchBoardData}
              />
            )}
          </div>
        </div>
      </main>

      <BoardSettingsModal
        isOpen={settingsOpen}
        board={board}
        onClose={() => setSettingsOpen(false)}
        onBoardUpdated={handleBoardUpdated}
        onBoardDeleted={handleBoardDeleted}
      />

      <InviteUserModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        boardId={boardId}
        onSuccess={fetchMembers}
      />
    </div>
  );
};

export default BoardPage;
