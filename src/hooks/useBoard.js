import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getBoardFull } from '../api/boardApi';
import { getCurrentUser } from '../api/userApi';
import { connectWebSocket, disconnectWebSocket, stompClient } from '../websocket/websocket';
import { useActivity } from '../context/ActivityContext';

export const useBoard = (boardId) => {
  const { pushActivity } = useActivity();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [cursors, setCursors] = useState({});

  const currentUserNameRef = useRef(null);
  const typingSubRef = useRef(null);
  const cursorSubRef = useRef(null);

  // Memoize derived data so KanbanBoard.memo() actually works.
  // Previously `tasks` was a new object literal on every render, which meant
  // memo() never bailed out and handleDragEnd (which has tasksMap in deps)
  // was recreated on every parent re-render (e.g. every cursor tick).
  const columns = useMemo(() => board?.columns || [], [board]);
  const tasks   = useMemo(() => {
    const map = {};
    columns.forEach(col => { map[col.id] = col.tasks || []; });
    return map;
  }, [columns]);

  // ── Fetch current user's display name once ───────────────────────
  useEffect(() => {
    getCurrentUser()
      .then(res => {
        const user = res?.data ?? res;
        currentUserNameRef.current = user?.name || user?.email || null;
      })
      .catch(() => {});
  }, []);

  // ── Initial load ──────────────────────────────────────────────────
  const fetchBoardData = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      try {
        data = await getBoardFull(boardId);
      } catch {
        data = await getBoardFull(boardId); // single retry
      }
      const payload = data.data || data;

      // Use a functional update so that any WS events that arrived
      // *while the fetch was in-flight* are not silently overwritten.
      // We merge the server snapshot into the existing state: server data
      // is authoritative for all fields, but if a WS event has already
      // added a task that isn't in the snapshot yet (e.g. created in the
      // ~200ms between snapshot capture and delivery), we keep it.
      setBoard(prev => {
        if (!prev) return payload; // first load — no previous state to preserve

        // Merge: start from the authoritative snapshot, then re-attach any
        // tasks that the WS delivered but the snapshot doesn't include yet.
        const mergedColumns = (payload.columns || []).map(snapshotCol => {
          const prevCol = (prev.columns || []).find(
            c => String(c.id) === String(snapshotCol.id)
          );
          if (!prevCol) return snapshotCol;

          const mergedTasksMap = new Map();

          // Add snapshot tasks first (authoritative)
          (snapshotCol.tasks || []).forEach(t => {
            mergedTasksMap.set(String(t.id), t);
          });

          // Add extra WS tasks (only if missing)
          (prevCol.tasks || []).forEach(t => {
            if (!mergedTasksMap.has(String(t.id))) {
              mergedTasksMap.set(String(t.id), t);
            }
          });

          return {
            ...snapshotCol,
            tasks: Array.from(mergedTasksMap.values()),
          };
        });

        return { ...payload, columns: mergedColumns };
      });

      setError(null);
    } catch (err) {
      setError(err);
      // Do NOT clear existing board state on error
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  // ── WebSocket event handler ───────────────────────────────────────
  const handleWsEvent = useCallback((event) => {
    switch (event.type) {

      case 'TASK_CREATED': {
        console.log(`[WS Rcv] TASK_CREATED for ID: ${event.taskId}`);
        setBoard(prev => {
          console.log(`[Reducer] Start update for ID: ${event.taskId}`);
          
          if (!prev?.columns) return prev;
          
          const colId = event.destinationColumnId;
          const newColumns = prev.columns.map(col => {
            if (String(col.id) !== String(colId)) return col;

            console.log(`[Reducer] col.tasks BEFORE:`, col.tasks?.map(t => t.id) || []);

            const existingIdx = (col.tasks || []).findIndex(
              t => String(t.id) === String(event.taskId)
            );
            
            console.log(`[Reducer] Index found for ${event.taskId}: ${existingIdx}`);

            if (existingIdx !== -1) {
              const newTasks = [...col.tasks];
              newTasks[existingIdx] = {
                ...col.tasks[existingIdx],
                ...(event.taskTitle    != null ? { title:    event.taskTitle }    : {}),
                ...(event.description  != null ? { description: event.description } : {}),
                ...(event.newPosition  != null ? { position: event.newPosition }  : {}),
              };
              console.log(`[Reducer] Updated existing task. Final length: ${newTasks.length}`);
              return { ...col, tasks: newTasks };
            }

            const wsTask = {
              id:          event.taskId,
              title:       event.taskTitle   || '(new task)',
              description: event.description || '',
              position:    event.newPosition ??              (col.tasks || []).length,
              columnId:    colId,
            };
                const filteredTasks = (col.tasks || []).filter(
                  t => String(t.id) !== String(event.taskId)
                );

                const newTasks = [...filteredTasks, wsTask];

                console.log(`[Reducer] After FIX length: ${newTasks.length}`);

                return { ...col, tasks: newTasks };
          });
          
          return { ...prev, columns: newColumns };
        });
        break;
      }

      case 'TASK_UPDATED': {
        const { taskId, taskTitle, sourceColumnId } = event;
        if (!taskId || !sourceColumnId) break;
        setBoard(prev => {
          if (!prev?.columns) return prev;
          const newColumns = prev.columns.map(col => {
            if (String(col.id) !== String(sourceColumnId)) return col;
            return {
              ...col,
              tasks: (col.tasks || []).map(t => {
                if (String(t.id) !== String(taskId)) return t;
                return {
                  ...t,
                  ...(taskTitle           != null ? { title:       taskTitle }           : {}),
                  ...(event.description   != null ? { description: event.description }   : {}),
                };
              }),
            };
          });
          return { ...prev, columns: newColumns };
        });
        break;
      }

      case 'TASK_MOVED': {
        const { taskId, sourceColumnId, destinationColumnId, newPosition } = event;
        if (!taskId || !sourceColumnId || !destinationColumnId) break;

        setBoard(prev => {
          if (!prev?.columns) return prev;

          if (String(sourceColumnId) === String(destinationColumnId)) {
            const newColumns = prev.columns.map(col => {
              if (String(col.id) !== String(sourceColumnId)) return col;
              const tasks = [...(col.tasks || [])];
              const fromIndex = tasks.findIndex(t => String(t.id) === String(taskId));
              if (fromIndex === -1) return col;
              const [movedTask] = tasks.splice(fromIndex, 1);
              const toIndex = Math.min(newPosition ?? tasks.length, tasks.length);
              tasks.splice(toIndex, 0, movedTask);
              return { ...col, tasks };
            });
            return { ...prev, columns: newColumns };
          }

          let taskToMove = null;
          let newColumns = prev.columns.map(col => {
            if (String(col.id) !== String(sourceColumnId)) return col;
            const taskIdx = (col.tasks || []).findIndex(
              t => String(t.id) === String(taskId)
            );
            if (taskIdx === -1) return col;
            taskToMove = col.tasks[taskIdx];
            const newTasks = [...col.tasks];
            newTasks.splice(taskIdx, 1);
            return { ...col, tasks: newTasks };
          });

          if (!taskToMove) return prev;

          newColumns = newColumns.map(col => {
            if (String(col.id) !== String(destinationColumnId)) return col;
            const newTasks = [...(col.tasks || [])];
            const insertAt = Math.min(newPosition ?? newTasks.length, newTasks.length);
            newTasks.splice(insertAt, 0, taskToMove);
            return { ...col, tasks: newTasks };
          });

          return { ...prev, columns: newColumns };
        });
        break;
      }

      case 'TASK_DELETED': {
        const { taskId, sourceColumnId } = event;
        if (!taskId || !sourceColumnId) break;
        setBoard(prev => {
          if (!prev?.columns) return prev;
          const newColumns = prev.columns.map(col => {
            if (String(col.id) !== String(sourceColumnId)) return col;
            return {
              ...col,
              tasks: (col.tasks || []).filter(
                t => String(t.id) !== String(taskId)
              ),
            };
          });
          return { ...prev, columns: newColumns };
        });
        break;
      }

      case 'COLUMN_CREATED': {
        setBoard(prev => {
          if (!prev?.columns) return prev;
          const colId = String(event.columnId);
          // If already present, merge (in case we have a partial from addColumn)
          if (prev.columns.some(c => String(c.id) === colId)) {
            return {
              ...prev,
              columns: prev.columns.map(c =>
                String(c.id) === colId
                  ? { ...c, name: event.columnName || c.name }
                  : c
              ),
            };
          }
          return {
            ...prev,
            columns: [...prev.columns, {
              id:       event.columnId,
              name:     event.columnName || 'New Column',
              position: prev.columns.length,
              tasks:    [],
            }],
          };
        });
        break;
      }

      case 'COLUMN_UPDATED': {
        setBoard(prev => {
          if (!prev?.columns) return prev;
          const newColumns = prev.columns.map(c =>
            String(c.id) === String(event.columnId)
              ? { ...c, name: event.columnName ?? c.name }
              : c
          );
          return { ...prev, columns: newColumns };
        });
        break;
      }

      case 'COLUMN_DELETED': {
        setBoard(prev => {
          if (!prev?.columns) return prev;
          return {
            ...prev,
            columns: prev.columns.filter(
              c => String(c.id) !== String(event.columnId)
            ),
          };
        });
        break;
      }

      default:
        break;
    }
  }, []);

  // ── Connect / disconnect on mount ────────────────────────────────
  useEffect(() => {
    if (!boardId) return;
    fetchBoardData();
    setIsConnected(false);
    connectWebSocket(boardId, {
      onEvent:      handleWsEvent,
      onActivity:   pushActivity,
      onPresence:   setOnlineUsers,
      onDisconnect: () => setIsConnected(false),
      onConnect: () => {
        setIsConnected(true);

        if (stompClient) {
          if (typingSubRef.current) {
            try { typingSubRef.current.unsubscribe(); } catch { /* ignore */ }
          }
          typingSubRef.current = stompClient.subscribe(
            `/topic/board/${boardId}/typing`,
            (message) => {
              const data = JSON.parse(message.body);
              setTypingUsers(prev => {
                if (prev.includes(data.username)) return prev;
                return [...prev, data.username];
              });
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
              }, 2000);
            }
          );

          if (cursorSubRef.current) {
            try { cursorSubRef.current.unsubscribe(); } catch { /* ignore */ }
          }
          cursorSubRef.current = stompClient.subscribe(
            `/topic/board/${boardId}/cursor`,
            (message) => {
              const data = JSON.parse(message.body);
              if (!data.username || data.x == null || data.y == null) return;
              if (
                currentUserNameRef.current &&
                data.username === currentUserNameRef.current
              ) return;
              setCursors(prev => ({
                ...prev,
                [data.username]: { x: data.x, y: data.y },
              }));
            }
          );
        }
      },
    });
    return () => {
      setIsConnected(false);
      disconnectWebSocket();
    };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stompClient || !isConnected) return;
    if (stompClient.publish) {
      stompClient.publish({
        destination: `/app/board/${boardId}/join`,
        body: JSON.stringify({}),
      });
    } else {
      stompClient.send(`/app/board/${boardId}/join`, {}, JSON.stringify({}));
    }
  }, [isConnected, boardId]);

  const sendTypingEvent = useCallback(() => {
    if (!stompClient || !isConnected) return;
    if (stompClient.publish) {
      stompClient.publish({ destination: `/app/board/${boardId}/typing`, body: JSON.stringify({}) });
    } else {
      stompClient.send(`/app/board/${boardId}/typing`, {}, JSON.stringify({}));
    }
  }, [isConnected, boardId]);

  const sendCursor = useCallback((x, y) => {
    if (!stompClient || !isConnected) return;
    if (stompClient.publish) {
      stompClient.publish({ destination: `/app/board/${boardId}/cursor`, body: JSON.stringify({ x, y }) });
    } else {
      stompClient.send(`/app/board/${boardId}/cursor`, {}, JSON.stringify({ x, y }));
    }
  }, [isConnected, boardId]);

  // ── Optimistic helpers ────────────────────────────────────────────

  const overrideTasksState = useCallback((updater) => {
    setBoard(prev => {
      if (!prev?.columns) return prev;
      const prevTasksMap = {};
      prev.columns.forEach(col => { prevTasksMap[col.id] = col.tasks || []; });
      const nextTasksMap = typeof updater === 'function' ? updater(prevTasksMap) : updater;
      const newColumns = prev.columns.map(col => ({
        ...col,
        tasks: nextTasksMap[col.id] || [],
      }));
      return { ...prev, columns: newColumns };
    });
  }, []);

  const addTask = useCallback((task, columnId) => {
    if (!task?.id) {
      // Guard: never add a task without a real server-assigned ID.
      // If AddTaskModal calls onTaskCreated optimistically (before the HTTP
      // response) with a temp/undefined ID, we skip it here — the real call
      // with the server ID will follow and add the task correctly.
      console.warn('[useBoard] addTask called with missing task.id — skipped', task);
      return;
    }
    setBoard(prev => {
      if (!prev?.columns) return prev;
      const newColumns = prev.columns.map(col => {
        if (String(col.id) !== String(columnId)) return col;
        const existingIdx = (col.tasks || []).findIndex(
          t => String(t.id) === String(task.id)
        );
        if (existingIdx !== -1) {
          const newTasks = [...col.tasks];
          newTasks[existingIdx] = { ...col.tasks[existingIdx], ...task };
          return { ...col, tasks: newTasks };
        }
        return { ...col, tasks: [...(col.tasks || []), task] };
      });
      return { ...prev, columns: newColumns };
    });
  }, []);

  const patchTask = useCallback((taskId, patch) => {
    setBoard(prev => {
      if (!prev?.columns) return prev;
      let found = false;
      const newColumns = prev.columns.map(col => {
        if (found) return col;
        const taskIdx = (col.tasks || []).findIndex(
          t => String(t.id) === String(taskId)
        );
        if (taskIdx === -1) return col;
        found = true;
        const newTasks = [...col.tasks];
        newTasks[taskIdx] = { ...newTasks[taskIdx], ...patch };
        return { ...col, tasks: newTasks };
      });
      return { ...prev, columns: newColumns };
    });
  }, []);

  const removeTask = useCallback((taskId) => {
    setBoard(prev => {
      if (!prev?.columns) return prev;
      const newColumns = prev.columns.map(col => {
        const after = (col.tasks || []).filter(
          t => String(t.id) !== String(taskId)
        );
        if (after.length === (col.tasks || []).length) return col;
        return { ...col, tasks: after };
      });
      return { ...prev, columns: newColumns };
    });
  }, []);

  const addColumn = useCallback((column) => {
    setBoard(prev => {
      if (!prev) return prev;
      const colId = String(column.id);
      const existing = (prev.columns || []).some(c => String(c.id) === colId);
      if (existing) {
        // Idempotent: merge into existing entry instead of duplicating
        return {
          ...prev,
          columns: prev.columns.map(c =>
            String(c.id) === colId ? { ...c, ...column, tasks: c.tasks || [] } : c
          ),
        };
      }
      return { ...prev, columns: [...(prev.columns || []), { ...column, tasks: [] }] };
    });
  }, []);

  const renameColumn = useCallback((columnId, name) => {
    setBoard(prev => {
      if (!prev?.columns) return prev;
      return {
        ...prev,
        columns: prev.columns.map(c =>
          String(c.id) === String(columnId) ? { ...c, name } : c
        ),
      };
    });
  }, []);

  const deleteColumnLocally = useCallback((columnId) => {
    setBoard(prev => {
      if (!prev?.columns) return prev;
      return {
        ...prev,
        columns: prev.columns.filter(c => String(c.id) !== String(columnId)),
      };
    });
  }, []);

      const patchBoard = useCallback((patch) => {
      setBoard(prev => {
        if (!prev) return prev;

        let newBoard = { ...prev, ...patch };

        // 🔥 FIX: Deduplicate members
        if (patch.members) {
          const map = new Map();

          patch.members.forEach(m => {
            map.set(String(m.user_id || m.userId), m);
          });

          newBoard.members = Array.from(map.values());
        }

        return newBoard;
      });
    }, []);
  return {
    board,
    columns,
    tasks,
    onlineUsers,
    typingUsers,
    cursors,
    loading,
    error,
    isConnected,
    fetchBoardData,
    overrideTasksState,
    addTask,
    patchTask,
    removeTask,
    addColumn,
    renameColumn,
    deleteColumnLocally,
    patchBoard,
    sendTypingEvent,
    sendCursor,
  };
};