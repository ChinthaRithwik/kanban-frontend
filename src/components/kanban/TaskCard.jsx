import React, { memo, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { AvatarWithTooltip } from '../common/Avatar';

/* ─── Portal-based dropdown ─────────────────────────────────────── */
const MENU_HEIGHT_ESTIMATE = 88;
const MENU_WIDTH = 144;

const DropdownPortal = ({ anchorRef, onClose, children }) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipUp = spaceBelow < MENU_HEIGHT_ESTIMATE + 8;
    setPos({
      top: flipUp ? rect.top - MENU_HEIGHT_ESTIMATE : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  }, [anchorRef]);

  // Position on mount
  React.useEffect(() => { updatePosition(); }, [updatePosition]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  // Close on scroll/resize
  React.useEffect(() => {
    const dismiss = () => onClose();
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [onClose]);

  if (!pos) return null;

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl
        shadow-[0_8px_24px_-4px_rgb(0,0,0,0.14)]
        py-1 min-w-[144px] animate-fade-up"
    >
      {children}
    </div>,
    document.body
  );
};

/* ─── TaskCard ──────────────────────────────────────────────────── */
const TaskCard = memo(({ task, columnId, onEdit, onDelete, isBeingDragged }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,     // from useSortable — true when THIS element is the active drag
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task, columnId },
  });

  /* 
   * Critical for smooth DnD:
   * - Only translate (no scaleX/scaleY) to avoid disturbing layout measurements
   * - transition must be applied for the animated "move out of the way" effect
   */
  const style = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, scaleX: 1, scaleY: 1 } : null
    ),
    transition: transition || undefined,
    // The original item stays in-flow as a ghost placeholder
    opacity: isDragging ? 0.25 : 1,
    // Prevent interaction with the ghost
    pointerEvents: isDragging ? 'none' : undefined,
  };

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-xl border
        transition-shadow duration-150
        group relative
        ${isDragging
          ? 'border-blue-300 bg-blue-50/30 shadow-none'
          : 'border-gray-200 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] hover:shadow-[0_4px_12px_-2px_rgb(0,0,0,0.10)] hover:border-gray-300'}
      `}
    >
      <div
        {...attributes}
        {...listeners}
        className="p-4 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start gap-2">
          <span className="text-gray-300 group-hover:text-gray-400 mt-0.5 transition-colors shrink-0 select-none">
            <GripVertical size={14} />
          </span>

          <div className="flex-1 min-w-0 space-y-1.5">
            <h4 className="font-semibold text-gray-800 text-sm leading-snug break-words">
              {task.title}
            </h4>

            {task.description && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {task.assignedTo && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <AvatarWithTooltip
                  name={task.assignedTo}
                  size="xs"
                  tooltipContent={`Assigned to ${task.assignedTo}`}
                />
                <span className="text-xs text-gray-400 truncate">
                  {task.assignedTo}
                </span>
              </div>
            )}
          </div>

          {(onEdit || onDelete) && !isDragging && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="shrink-0"
            >
              <button
                ref={btnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="p-1 rounded-lg transition-all duration-150
                  text-gray-300 hover:text-gray-600 hover:bg-gray-100
                  opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal size={15} />
              </button>

              {menuOpen && (
                <DropdownPortal anchorRef={btnRef} onClose={closeMenu}>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        onEdit(task);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                        text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={14} className="text-blue-500" />
                      Edit task
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        onDelete(task);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                        text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete task
                    </button>
                  )}
                </DropdownPortal>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
export default TaskCard;