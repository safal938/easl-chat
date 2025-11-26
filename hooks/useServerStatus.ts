import { useState, useEffect, useCallback } from 'react';

interface ServerStatusResponse {
  status: string;
  timestamp: string;
  server_status: number;
}

interface UseServerStatusReturn {
  isServerHealthy: boolean;
  isChecking: boolean;
  checkServerStatus: () => Promise<void>;
}

export const useServerStatus = (): UseServerStatusReturn => {
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkServerStatus = useCallback(async () => {
    const statusUrl = process.env.NEXT_PUBLIC_STATUS_API_URL;
    
    if (!statusUrl) {
      console.warn('NEXT_PUBLIC_STATUS_API_URL is not defined');
      setIsServerHealthy(false);
      setIsChecking(false);
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();

    try {
      setIsChecking(true);
      
      // Set a shorter timeout for faster detection of server issues
      timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000); // Reduced to 5 seconds
      
      // Add a quick timeout to show modal faster if server is likely down
      const quickCheckTimeout = setTimeout(() => {
        // If we haven't gotten a response in 2 seconds, assume server might be down
        // and allow modal to show while we continue checking
        setIsChecking(false);
      }, 2000);
      
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      // Clear the quick check timeout since we got a response
      clearTimeout(quickCheckTimeout);

      if (response.ok) {
        const data: ServerStatusResponse = await response.json();
        const isHealthy = data.status === 'healthy' && data.server_status === 1;
        setIsServerHealthy(isHealthy);
      } else {
        setIsServerHealthy(false);
      }
    } catch (error) {
      // Handle AbortError specifically to avoid logging timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Server status check timed out');
      } else {
        console.error('Server status check failed:', error);
      }
      setIsServerHealthy(false);
    } finally {
      // Always clear the timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkServerStatus();

    // Set up periodic checking every 15 seconds when server is not healthy
    // and every 60 seconds when server is healthy (to detect if it goes down)
    const interval = setInterval(() => {
      if (!isServerHealthy) {
        checkServerStatus();
      } else {
        // Less frequent checks when server is healthy
        checkServerStatus();
      }
    }, isServerHealthy ? 60000 : 15000); // 60s when healthy, 15s when unhealthy

    return () => clearInterval(interval);
  }, [checkServerStatus, isServerHealthy]);

  return {
    isServerHealthy,
    isChecking,
    checkServerStatus,
  };
};