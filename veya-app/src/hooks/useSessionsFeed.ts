import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiService, SessionSummary, SessionsPage } from '../services/api';

interface UseSessionsFeedOptions {
  pageSize?: number;
}

interface UseSessionsFeedResult {
  sessions: SessionSummary[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  loadInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSessionsFeed = (
  options: UseSessionsFeedOptions = {}
): UseSessionsFeedResult => {
  const pageSize = options.pageSize ?? 6;

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadingRef = useRef(false);

  const mergeSessions = useCallback((incoming: SessionSummary[]) => {
    setSessions((prev) => {
      const existing = new Map(prev.map((item) => [item.id, item]));
      incoming.forEach((item) => existing.set(item.id, item));
      return Array.from(existing.values());
    });
  }, []);

  const handleResponse = useCallback((pageData: SessionsPage, append: boolean) => {
    setNextPage(pageData.nextPage);
    if (append) {
      mergeSessions(pageData.sessions);
    } else {
      setSessions(pageData.sessions);
    }
  }, [mergeSessions]);

  const fetchPage = useCallback(
    async (page: number, { append }: { append: boolean }) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      append ? setIsLoading(true) : setIsRefreshing(true);
      try {
        const result = await apiService.getSessions(page, pageSize);
        handleResponse(result, append);
      } finally {
        append ? setIsLoading(false) : setIsRefreshing(false);
        loadingRef.current = false;
      }
    },
    [handleResponse, pageSize]
  );

  const loadInitial = useCallback(async () => {
    setNextPage(1);
    await fetchPage(1, { append: false });
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (nextPage === null || nextPage < 1) return;
    await fetchPage(nextPage, { append: true });
  }, [fetchPage, nextPage]);

  const refresh = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const hasMore = useMemo(() => nextPage !== null, [nextPage]);

  return {
    sessions,
    isLoading,
    isRefreshing,
    hasMore,
    loadInitial,
    loadMore,
    refresh,
  };
};
