import React, { useEffect, useRef, useCallback } from 'react';
import { X, Activity, Clock, RotateCcw, ChevronDown, Loader2 } from 'lucide-react';
import { useActivity } from '../../context/ActivityContext';
import { timeAgo } from '../../utils/time';
import Avatar from '../common/Avatar';

// Extract name from full activity message like "Rithwik moved task…"
// The backend always puts the actor's name as the first word(s) before a verb.
// We show an avatar for the first token (first word).
const getActorFromMessage = (message = '') => message.split(' ')[0] || '';

const ActivityItem = ({ activity }) => {
  const actor = getActorFromMessage(activity.message);
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
      <Avatar name={actor} size="sm" className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug break-words">
          {activity.message}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Clock size={10} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400">
            {timeAgo(activity.createdAt || activity.time)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ActivityDrawer = ({ isOpen, onClose, boardId }) => {
  const { activities, clearActivities, loadMore, hasMore, loadingMore } = useActivity();
  const scrollRef = useRef(null);

  const handleLoadMore = useCallback(() => {
    if (boardId) loadMore(boardId);
  }, [boardId, loadMore]);

  // Keep scroll at top when new live events arrive
  useEffect(() => {
    if (isOpen && scrollRef.current && activities.length > 0) {
      // Only auto-scroll to top when a new item is prepended (live WS event)
    }
  }, [activities.length, isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed right-0 top-0 h-full z-50 w-80 bg-white shadow-2xl
          border-l border-gray-200 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-blue-600" />
            <h3 className="font-bold text-gray-800 text-base">Activity</h3>
            {activities.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {activities.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activities.length > 0 && (
              <button
                onClick={clearActivities}
                title="Clear all"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600
                  px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RotateCcw size={11} />
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close activity panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Activity list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto h-[70vh]">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <Activity size={32} strokeWidth={1.2} className="text-gray-300" />
              <p className="text-sm font-medium">No activity yet</p>
              <p className="text-xs text-center px-6 leading-relaxed">
                Activity will appear here as team members make changes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="px-4 py-4 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold
                      text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200
                      rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                    {loadingMore ? 'Loading…' : 'Load older activity'}
                  </button>
                </div>
              )}

              {!hasMore && activities.length > 0 && (
                <div className="py-4 text-center text-xs text-gray-300 font-medium">
                  — end of activity —
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityDrawer;
