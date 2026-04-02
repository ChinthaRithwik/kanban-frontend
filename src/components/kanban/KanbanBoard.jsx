import React, { useState, useCallback, useRef, memo, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Plus, GripVertical } from 'lucide-react';

import BoardColumn    from './BoardColumn';
import AddTaskModal   from './AddTaskModal';
import EditTaskModal  from './EditTaskModal';
import AddColumnModal from './AddColumnModal';
import ActivityDrawer from './ActivityDrawer';
import ConfirmDialog  from '../common/ConfirmDialog';

import { moveTask, deleteTask }     from '../../api/taskApi';
import { updateColumn, deleteColumn } from '../../api/columnApi';
import { useToast }                  from '../../context/ToastContext';

// ── Loading skeleton ──────────────────────────────────────────────────────────
export const KanbanSkeleton = () => (
  <div className="flex gap-5 h-full p-2 items-start">
    {[280, 240, 300, 260].map((h, i) => (
      <div
        key={i}
        className="min-w-[300px] w-[300px] bg-gray-200/60 rounded-2xl animate-pulse"
        style={{ height: h }}
      />
    ))}
  </div>
);

// ── Empty columns state ───────────────────────────────────────────────────────
const EmptyColumns = ({ onAddColumn }) => (
  <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-gray-400">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
      <Plus size={28} strokeWidth={1.5} />
    </div>
    <div className="text-center">
      <p className="font-semibold text-gray-600">No columns yet</p>
      <p className="text-sm mt-1">Add a column to start organising your tasks</p>
    </div>
    <button
      onClick={onAddColumn}
      className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl
        hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
    >
      Add First Column
    </button>
  </div>
);

// ── Measuring configuration ──────────────────────────────────────────────────
// Tell dnd-kit to re-measure droppable containers during drag. This is crucial
// for scrollable column containers — without it, measurements are stale and
// drop positions are calculated wrong.
const MEASURING = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

// ── Custom collision detection ───────────────────────────────────────────────
// 1. Use pointerWithin to find which column the cursor is over
// 2. Within that column, use closestCenter for precise task ordering
// This is FAR more accurate than plain closestCenter for Kanban boards
//
// NOTE: droppableContainers is an ARRAY of DroppableContainer objects in
// dnd-kit — NOT a Map. All lookups use .find() and direct array iteration.
function kanbanCollisionDetection(args) {
  // First: check if pointer is within any droppable
  const pointerCollisions = pointerWithin(args);
  const withinCollisions = pointerCollisions.length > 0
    ? pointerCollisions
    : rectIntersection(args);

  // Find the first collision id
  const firstColId = getFirstCollision(withinCollisions, 'id');
  if (firstColId != null) {
    // Locate the container object — droppableContainers is an array, not a Map
    const colContainer = args.droppableContainers.find(c => c.id === firstColId);

    if (colContainer?.data?.current?.type === 'Column') {
      const columnId = colContainer.data.current.columnId;

      // Filter to only task containers that belong to this column
      const tasksInColumn = args.droppableContainers.filter(
        c =>
          c.data.current?.type === 'Task' &&
          String(c.data.current?.columnId) === String(columnId)
      );

      if (tasksInColumn.length > 0) {
        // Run closestCenter only on the tasks in this column
        const closestTask = closestCenter({
          ...args,
          droppableContainers: tasksInColumn,
        });
        if (closestTask.length > 0) return closestTask;
      }
    }

    // Return the column itself as the collision target
    return [{ id: firstColId }];
  }

  // Fallback: plain closestCenter across all containers
  return closestCenter(args);
}

// ── Main board ────────────────────────────────────────────────────────────────
const KanbanBoard = memo(({
  board,
  columns,
  tasksMap,
  sendTypingEvent,
  onTasksOptimisticUpdate,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onColumnCreated,
  onColumnRenamed,
  onColumnDeleted,
  activityOpen,
  onActivityClose,
  onDragFailed,
}) => {
  const { success, error: toastError } = useToast();

  const [activeTask,         setActiveTask]         = useState(null);
  const [activeId,           setActiveId]           = useState(null);

  // sourceColRef: the column the task originally came from (never changes during a drag)
  const sourceColRef = useRef(null);
  // currentDragColRef tracks which column the task is CURRENTLY in
  // after optimistic moves during handleDragOver.
  const currentDragColRef = useRef(null);

  // Throttle cross-column moves to prevent excessive state churn
  const lastOverRef = useRef(null);

  const [addTaskColId,   setAddTaskColId]   = useState(null);
  const [editingTask,    setEditingTask]    = useState(null);
  const [deleteTaskData, setDeleteTaskData] = useState(null);
  const [deletingTask,   setDeletingTask]   = useState(false);
  const [addColumnOpen,  setAddColumnOpen]  = useState(false);
  const [deleteColData,  setDeleteColData]  = useState(null);
  const [deletingCol,    setDeletingCol]    = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Drag start ──────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    if (active.data.current?.type !== 'Task') return;
    const colId = active.data.current.columnId;
    setActiveTask(active.data.current.task);
    sourceColRef.current      = colId;
    currentDragColRef.current = colId;
    lastOverRef.current       = null;
    setActiveId(active.id);
  }, []);

  // ── Drag over ───────────────────────────────────────────────────
  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== 'Task') return;

    const srcColId = currentDragColRef.current;
    const overData = over.data.current ?? {};

    let dstColId;
    if      (overData.type === 'Task')   dstColId = overData.columnId;
    else if (overData.type === 'Column') dstColId = overData.columnId;
    else return;

    if (!srcColId || !dstColId) return;

    // Same column: SortableContext handles reordering natively via transforms
    if (String(srcColId) === String(dstColId)) return;

    // Throttle: don't re-process the same over target
    const overKey = `${dstColId}:${over.id}`;
    if (lastOverRef.current === overKey) return;
    lastOverRef.current = overKey;

    onTasksOptimisticUpdate((prev) => {
      const src = [...(prev[srcColId] || [])];
      const dst = [...(prev[dstColId] || [])];

      const activeIdx = src.findIndex(t => String(t.id) === String(active.id));
      if (activeIdx === -1) return prev;

      let overIdx;
      if (overData.type === 'Task') {
        const i = dst.findIndex(t => String(t.id) === String(over.id));
        overIdx = i >= 0 ? i : dst.length;
      } else {
        overIdx = dst.length;
      }

      const [moved] = src.splice(activeIdx, 1);
      dst.splice(overIdx, 0, moved);

      currentDragColRef.current = dstColId;

      return { ...prev, [srcColId]: src, [dstColId]: dst };
    });
  }, [onTasksOptimisticUpdate]);

  // ── Drag end ────────────────────────────────────────────────────
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;

    setActiveTask(null);
    setActiveId(null);

    const sourceColumnId      = sourceColRef.current;
    const finalVisualColumnId = currentDragColRef.current;

    sourceColRef.current      = null;
    currentDragColRef.current = null;
    lastOverRef.current       = null;

    if (!over) return;
    if (active.data.current?.type !== 'Task') return;

    const overData = over.data.current ?? {};
    let destinationColumnId;
    if      (overData.type === 'Task')   destinationColumnId = overData.columnId;
    else if (overData.type === 'Column') destinationColumnId = overData.columnId;
    else return;
    if (!destinationColumnId || !sourceColumnId) return;

    let newPosition;

    if (String(sourceColumnId) === String(destinationColumnId) &&
        String(finalVisualColumnId) === String(destinationColumnId)) {
      // ── Same-column reorder ──────────────────────────────────────
      const tasks    = tasksMap[destinationColumnId] || [];
      const oldIndex = tasks.findIndex(t => String(t.id) === String(active.id));
      let   newIndex;
      if (overData.type === 'Task') {
        newIndex = tasks.findIndex(t => String(t.id) === String(over.id));
        if (newIndex === -1) newIndex = Math.max(0, tasks.length - 1);
      } else {
        newIndex = Math.max(0, tasks.length - 1);
      }
      if (oldIndex === -1 || oldIndex === newIndex) return;
      const reordered = arrayMove([...tasks], oldIndex, newIndex);
      onTasksOptimisticUpdate(prev => ({ ...prev, [destinationColumnId]: reordered }));
      newPosition = newIndex;

    } else {
      // ── Cross-column move ────────────────────────────────────────
      // handleDragOver has already moved the task optimistically.
      // Just read the current position for the API call.
      const dstTasks = tasksMap[destinationColumnId] || [];
      const taskIdx  = dstTasks.findIndex(t => String(t.id) === String(active.id));

      if (taskIdx !== -1) {
        newPosition = taskIdx;
      } else {
        // Edge case: very fast drop before handleDragOver could fire
        const cleanDst = dstTasks.filter(t => String(t.id) !== String(active.id));
        let insert;
        if (overData.type === 'Task') {
          const i = cleanDst.findIndex(t => String(t.id) === String(over.id));
          insert = i >= 0 ? i : cleanDst.length;
        } else {
          insert = cleanDst.length;
        }
        newPosition = insert;

        onTasksOptimisticUpdate(prev => {
          const currentSrc = [...(prev[sourceColumnId] || [])];
          const currentDst = [...(prev[destinationColumnId] || [])];
          const cDst = currentDst.filter(t => String(t.id) !== String(active.id));
          const sIdx = currentSrc.findIndex(t => String(t.id) === String(active.id));
          let task = active.data.current.task;
          if (sIdx > -1) task = currentSrc.splice(sIdx, 1)[0] || task;
          cDst.splice(insert, 0, task);
          return { ...prev, [sourceColumnId]: currentSrc, [destinationColumnId]: cDst };
        });
      }
    }

    try {
      await moveTask({ taskId: active.id, sourceColumnId, destinationColumnId, newPosition });
    } catch {
      toastError('Failed to move task. Reverting…');
      onDragFailed?.();
    }
  }, [tasksMap, toastError, onTasksOptimisticUpdate]);

  // ── Drag cancel ─────────────────────────────────────────────────
  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setActiveId(null);
    sourceColRef.current      = null;
    currentDragColRef.current = null;
    lastOverRef.current       = null;
  }, []);

  // ── Task CRUD ───────────────────────────────────────────────────
  const handleTaskCreated = useCallback((newTask, columnId) => {
    onTaskCreated?.(newTask, columnId);
    setAddTaskColId(null);
  }, [onTaskCreated]);

  const handleTaskUpdated = useCallback((updatedTask) => {
    onTaskUpdated?.(updatedTask);
    setEditingTask(null);
  }, [onTaskUpdated]);

  const handleDeleteTaskConfirm = useCallback(async () => {
    if (!deleteTaskData?.task) return;
    setDeletingTask(true);
    try {
      await deleteTask(deleteTaskData.task.id);
      onTaskDeleted?.(deleteTaskData.task.id);
      success('Task deleted');
    } catch {
      toastError('Failed to delete task.');
    } finally {
      setDeletingTask(false);
      setDeleteTaskData(null);
    }
  }, [deleteTaskData, onTaskDeleted, success, toastError]);

  // ── Column CRUD ─────────────────────────────────────────────────
  const handleRenameColumn = useCallback(async (columnId, newName) => {
    try {
      await updateColumn(columnId, { name: newName });
      onColumnRenamed?.(columnId, newName);
      success(`Column renamed to "${newName}"`);
    } catch {
      toastError('Failed to rename column.');
    }
  }, [onColumnRenamed, success, toastError]);

  const handleDeleteColumnConfirm = useCallback(async () => {
    if (!deleteColData?.column) return;
    setDeletingCol(true);
    try {
      await deleteColumn(deleteColData.column.id);
      onColumnDeleted?.(deleteColData.column.id);
      success('Column deleted');
    } catch {
      toastError('Failed to delete column.');
    } finally {
      setDeletingCol(false);
      setDeleteColData(null);
    }
  }, [deleteColData, onColumnDeleted, success, toastError]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
        measuring={MEASURING}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-5 overflow-x-auto pb-6 h-[calc(100vh-148px)] items-start p-2">
          {columns.length === 0 ? (
            <EmptyColumns onAddColumn={() => setAddColumnOpen(true)} />
          ) : (
            <>
              {columns.map((column, index) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  tasks={tasksMap[column.id] || []}
                  columnIndex={index}
                  activeId={activeId}
                  onAddTaskClick={setAddTaskColId}
                  onEditTask={setEditingTask}
                  onDeleteTask={(task) => setDeleteTaskData({ task })}
                  onRenameColumn={handleRenameColumn}
                  onDeleteColumn={(col) => setDeleteColData({ column: col })}
                />
              ))}

              <button
                onClick={() => setAddColumnOpen(true)}
                className="
                  min-w-[220px] w-[220px] shrink-0 h-16
                  flex items-center justify-center gap-2
                  bg-gray-100/80 hover:bg-gray-200/80
                  border-2 border-dashed border-gray-300 hover:border-gray-400
                  rounded-2xl text-gray-500 hover:text-gray-700
                  text-sm font-semibold transition-all duration-200
                  self-start
                "
              >
                <Plus size={16} />
                Add column
              </button>
            </>
          )}
        </div>

        {/* ── Drag overlay: floating visual clone ────────────────── */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {activeTask ? (
            <div
              className="
                bg-white rounded-xl border border-blue-200
                shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)]
                w-[268px] overflow-hidden
                cursor-grabbing
                rotate-[2deg] scale-[1.03]
              "
              style={{ transformOrigin: 'center center' }}
            >
              <div className="p-4">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">
                    <GripVertical size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm leading-snug break-words">
                      {activeTask.title}
                    </h4>
                    {activeTask.description && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {activeTask.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Modals ── */}
      <AddTaskModal
        isOpen={!!addTaskColId}
        onClose={() => setAddTaskColId(null)}
        columnId={addTaskColId}
        boardId={board?.id}
        onTaskCreated={handleTaskCreated}
        sendTypingEvent={sendTypingEvent}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={handleTaskUpdated}
        sendTypingEvent={sendTypingEvent}
      />

      <AddColumnModal
        isOpen={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
        boardId={board?.id}
        onColumnCreated={onColumnCreated}
      />

      <ConfirmDialog
        isOpen={!!deleteTaskData}
        onClose={() => setDeleteTaskData(null)}
        onConfirm={handleDeleteTaskConfirm}
        loading={deletingTask}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${deleteTaskData?.task?.title}"?`}
        confirmLabel="Delete Task"
        danger
      />

      <ConfirmDialog
        isOpen={!!deleteColData}
        onClose={() => setDeleteColData(null)}
        onConfirm={handleDeleteColumnConfirm}
        loading={deletingCol}
        title="Delete Column"
        message={`Delete "${deleteColData?.column?.name}"? All tasks inside will also be deleted.`}
        confirmLabel="Delete Column"
        danger
      />

      <ActivityDrawer
        isOpen={activityOpen}
        onClose={onActivityClose}
        boardId={board?.id}
      />
    </>
  );
});

KanbanBoard.displayName = 'KanbanBoard';
export default KanbanBoard;
