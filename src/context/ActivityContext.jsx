import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const ActivityContext = createContext(null);

let actId = 0;

const normalise = (event) => ({
  id:        event.id || ++actId,
  message:   event.message || '',
  createdAt: event.createdAt || event.timestamp || new Date().toISOString(),
  time:      event.createdAt || event.timestamp || new Date().toISOString(),
});

const sortActivities = (list) => {
  return list.sort((a, b) => {
    const timeDiff = new Date(b.createdAt) - new Date(a.createdAt);
    if (timeDiff !== 0) return timeDiff;
    return b.id - a.id;
  });
};

export const ActivityProvider = ({ children }) => {
  const [activities,   setActivities]   = useState([]);
  const [hasMore,      setHasMore]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [nextPage,     setNextPage]     = useState(1);

  const pushActivity = useCallback((event) => {
    if (!event?.message) return;
    const entry = normalise(event);
    setActivities(prev => {
      if (event.id && prev.some(a => String(a.id) === String(event.id))) return prev;
      const newList = [entry, ...prev];
      return sortActivities(newList).slice(0, 200);
    });
  }, []);

  const setInitialActivities = useCallback((list, moreAvailable) => {
    const normalised = list.map(normalise);
    setActivities(sortActivities(normalised));
    setHasMore(!!moreAvailable);
    setNextPage(1);
  }, []);

  const loadMore = useCallback(async (boardId) => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/boards/${boardId}/activities`, {
        params: { page: nextPage, size: 50 },
      });
      const payload = res.data?.data ?? {};
      const older   = payload.activities ?? [];
      const more    = payload.hasMore    ?? false;
      if (older.length > 0) {
        setActivities(prev => {
          const ids   = new Set(prev.map(a => String(a.id)));
          const fresh = older.map(normalise).filter(a => !ids.has(String(a.id)));
          const newList = [...prev, ...fresh];
          return sortActivities(newList);
        });
      }
      setHasMore(more);
      setNextPage(p => p + 1);
    } catch { /* silent */ }
    finally  { setLoadingMore(false); }
  }, [loadingMore, hasMore, nextPage]);

  const clearActivities = useCallback(() => {
    setActivities([]);
    setHasMore(false);
    setNextPage(1);
  }, []);

  return (
    <ActivityContext.Provider
      value={{ activities, pushActivity, setInitialActivities, clearActivities, loadMore, hasMore, loadingMore }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be inside ActivityProvider');
  return ctx;
};
