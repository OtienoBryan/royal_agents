import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOptimizedFetchOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retryCount?: number;
}

interface UseOptimizedFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// Simple in-memory cache for frontend
const cache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

export function useOptimizedFetch<T>(
  url: string,
  options: UseOptimizedFetchOptions = {}
): UseOptimizedFetchReturn<T> {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    retryCount = 3
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result
      cache.set(url, {
        data: result,
        timestamp: Date.now(),
        staleTime
      });

      setData(result);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData();
        }, Math.pow(2, retryCountRef.current) * 1000); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled, staleTime, retryCount]);

  const invalidate = useCallback(() => {
    cache.delete(url);
    fetchData();
  }, [url, fetchData]);

  const refetch = useCallback(async () => {
    cache.delete(url);
    await fetchData();
  }, [url, fetchData]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    // Set up polling if refetchInterval is provided
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, enabled, refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

// Hook for chat messages with optimized polling
export function useOptimizedChatMessages(
  roomId: number | null,
  lastMessageId: number | null
) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async (limit = 50) => {
    if (!roomId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/chat/rooms/${roomId}/messages?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const messagesData = await response.json();
        const sortedMessages = messagesData.reverse();
        setMessages(sortedMessages);
        setError(null);
      } else {
        setError('Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const fetchNewMessages = useCallback(async () => {
    if (!roomId || !lastMessageId) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/chat/rooms/${roomId}/messages/new?lastMessageId=${lastMessageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const newMessages = await response.json();
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages]);
        }
      }
    } catch (err) {
      console.error('Error fetching new messages:', err);
    }
  }, [roomId, lastMessageId]);

  // Start polling when room is selected
  useEffect(() => {
    if (roomId) {
      fetchMessages();
      
      // Adaptive polling interval
      const pollInterval = lastMessageId ? 3000 : 1000;
      pollingIntervalRef.current = setInterval(fetchNewMessages, pollInterval);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [roomId, lastMessageId, fetchMessages, fetchNewMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages
  };
}
