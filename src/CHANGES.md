# Kanban Frontend — Complete Bug Fix Delivery
## All 8 bugs fixed across 3 files

Replace your entire `src/` folder with this one.

---

## Bug Index

| # | Severity | File | Description |
|---|----------|------|-------------|
| 1 | 🔴 Critical | `useBoard.js` | `addTask` appended duplicate tasks — WS stub + HTTP full; now upserts by ID |
| 2 | 🔴 Critical | `KanbanBoard.jsx` | Stale closure: `activeTaskColumnId` in `handleDragEnd` deps caused silent move failures on fast drags; fixed by reading from `active.data.current.columnId` directly |
| 3 | 🔴 Critical | `useBoard.js` | All WS/local handlers used `===` to compare IDs — Java `Long` comes over WS as a JS number but could mismatch string IDs; all comparisons now use `String(a) === String(b)` |
| 4 | 🟠 High | `useBoard.js` | `TASK_UPDATED` WS handler only updated `title`, silently dropped `description` for other connected users |
| 5 | 🟠 High | `KanbanBoard.jsx` | `over.data.current` accessed without null guard — undefined for bare droppables; caused blank screen crash |
| 6 | 🟠 High | `KanbanBoard.jsx` | `handleDragOver` could call `onTasksOptimisticUpdate` with `dstColId = undefined`, writing `state[undefined]` |
| 7 | 🟡 Medium | `AddTaskModal.jsx` | Created task object missing `columnId` field — dnd-kit metadata lookups would silently fail on the new card |
| 8 | 🟡 Medium | `useBoard.js` | `renameColumn` and `deleteColumnLocally` used raw `===` for column ID comparison (same Long/string mismatch risk) |

---

## Files Changed (3 of 34)

- `src/hooks/useBoard.js`
- `src/components/kanban/KanbanBoard.jsx`
- `src/components/kanban/AddTaskModal.jsx`

All other files are included unchanged so you can do a full `src/` drop-in.
