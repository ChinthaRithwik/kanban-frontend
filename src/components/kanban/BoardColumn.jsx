import React, { memo, useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X, ClipboardList } from 'lucide-react';
import TaskCard from './TaskCard';

const ACCENTS = [
  { bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700'    },
  { bar: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700' },
  { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700'},
  { bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700'   },
  { bar: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700'     },
  { bar: 'bg-cyan-500',    badge: 'bg-cyan-100 text-cyan-700'     },
];

const BoardColumn = memo(({
  column,
  tasks,
  columnIndex = 0,
  activeId,
  onAddTaskClick,
  onEditTask,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
}) => {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [renameValue, setRenameValue] = useState(column.name || '');
  const menuRef  = useRef(null);
  const inputRef = useRef(null);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', columnId: column.id, column },
  });

  const taskIds = tasks.map(t => t.id);
  const accent  = ACCENTS[columnIndex % ACCENTS.length];

  // Highlight when user drags a card over this column
  const isHighlighted = isOver && !!activeId;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const formatTitle = (text) => {
    if (!text) return '';
    return text.split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== column.name) onRenameColumn?.(column.id, trimmed);
    setRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(column.name || '');
    setRenaming(false);
  };

  return (
    <div
      className={`
        flex flex-col min-w-[300px] w-[300px] flex-shrink-0
        rounded-2xl border
        transition-all duration-200
        max-h-full
        ${isHighlighted
          ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-200 ring-offset-1 shadow-lg'
          : 'bg-gray-50/80 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'}
      `}
    >
      {/* Accent bar */}
      <div className={`h-1 w-full rounded-t-2xl ${accent.bar} shrink-0`} />

      {/* Column header */}
      <div className="px-4 py-3 flex items-center gap-2 shrink-0">
        {renaming ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              ref={inputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  commitRename();
                if (e.key === 'Escape') cancelRename();
              }}
              className="flex-1 text-sm font-bold bg-white border border-blue-400
                rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={commitRename} className="text-emerald-600 hover:text-emerald-700 p-0.5 transition-colors">
              <Check size={15} />
            </button>
            <button onClick={cancelRename} className="text-gray-400 hover:text-gray-600 p-0.5 transition-colors">
              <X size={15} />
            </button>
          </div>
        ) : (
          <h2 className="font-bold text-gray-700 text-sm flex-1 truncate">
            {formatTitle(column.name)}
          </h2>
        )}

        <span className={`
          text-xs font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors tabular-nums
          ${isHighlighted ? 'bg-blue-100 text-blue-700' : accent.badge}
        `}>
          {tasks.length}
        </span>

        {(onRenameColumn || onDeleteColumn) && !renaming && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700
                hover:bg-white hover:shadow-sm transition-all duration-150"
            >
              <MoreHorizontal size={15} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-md py-1 min-w-[160px]">
                {onRenameColumn && (
                  <button
                    onClick={() => { setMenuOpen(false); setRenaming(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={14} />
                    Rename column
                  </button>
                )}
                {onDeleteColumn && (
                  <button
                    onClick={() => { setMenuOpen(false); onDeleteColumn(column); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Delete column
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-4 border-t border-gray-200/70 shrink-0" />

      {/* ── Scrollable task area ────────────────────────────────────
           The droppable ref MUST be on the scrollable container so
           dnd-kit correctly accounts for scroll offset.              */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-0 px-3 py-3 overflow-y-auto"
        style={{ minHeight: 80 }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {/* 
            dnd-kit's SortableContext handles placeholder gaps natively via
            CSS transforms on sibling items. We do NOT render manual placeholder
            divs — that causes double-gap / jitter issues.
            
            The dragged item is left in-place as a ghost (low opacity) and the
            DragOverlay shows the floating clone.
          */}
          <div className="space-y-2.5">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                isBeingDragged={String(task.id) === String(activeId)}
              />
            ))}
          </div>
        </SortableContext>

        {/* ── Empty-column drop zone ──────────────────────────────────
             Three states, single element, stable height (no layout shift):
             1. idle (no drag) – subtle "No tasks yet" hint
             2. drag-active, not over – inviting glow that says "you can drop here"
             3. drag-active + isOver – full drop-zone highlight with pulsing border  */}
        {tasks.length === 0 && (
          <div
            className={`
              flex flex-col items-center justify-center gap-2 rounded-xl
              border-2 border-dashed
              transition-all duration-200 ease-in-out
              select-none
              ${!activeId
                /* ── idle state ── */
                ? 'h-28 border-gray-200 text-gray-300'
                : isHighlighted
                  /* ── pointer is over THIS column ── */
                  ? 'h-28 border-blue-400 bg-blue-50 text-blue-400 shadow-[inset_0_0_0_4px_rgba(59,130,246,0.08)]'
                  /* ── some drag is active, not yet over this column ── */
                  : 'h-28 border-blue-200 bg-blue-50/30 text-blue-300'
              }
            `}
          >
            {!activeId ? (
              /* Idle: ClipboardList + label */
              <>
                <ClipboardList size={22} className="opacity-40" />
                <span className="text-xs font-medium opacity-60">No tasks yet</span>
              </>
            ) : isHighlighted ? (
              /* Over: animated arrow + label */
              <>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                  animate-bounce">
                  <Plus size={16} className="text-blue-500 rotate-45" />
                </div>
                <span className="text-xs font-semibold text-blue-500 tracking-wide">
                  Release to drop
                </span>
              </>
            ) : (
              /* Drag-active but not over: subtle invite */
              <>
                <div className="w-7 h-7 rounded-full bg-blue-100/60 flex items-center justify-center">
                  <Plus size={14} className="text-blue-400 opacity-70" />
                </div>
                <span className="text-xs font-medium text-blue-300">
                  Drop here
                </span>
              </>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-3 pb-3 pt-1 shrink-0">
        <button
          onClick={() => onAddTaskClick?.(column.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold
            text-gray-400 hover:text-gray-700 hover:bg-white hover:shadow-sm
            rounded-xl border border-transparent hover:border-gray-200
            transition-all duration-200"
        >
          <Plus size={15} />
          Add task
        </button>
      </div>
    </div>
  );
});

BoardColumn.displayName = 'BoardColumn';
export default BoardColumn;