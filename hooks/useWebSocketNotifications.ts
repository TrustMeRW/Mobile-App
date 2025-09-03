import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { webSocketService, type WebSocketEventData, type UnreadCountUpdate } from '@/services/websocket';
import { apiClient } from '@/services/api';
import { useCurrentUser } from './useCurrentUser';

export const useWebSocketNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useCurrentUser();

  // Fetch initial unread count
  const { data: initialUnreadCount, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['unread-notification-count'],
    queryFn: () => apiClient.getUnreadNotificationCount(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update unread count when initial data is fetched
  useEffect(() => {
    if (initialUnreadCount?.unreadCount !== undefined) {
      setUnreadCount(initialUnreadCount.unreadCount);
    }
  }, [initialUnreadCount]);

  // WebSocket event handlers
  const handleNewNotification = useCallback((data: WebSocketEventData) => {
    console.log('New notification received:', data);
    setUnreadCount(data.unreadCount);
  }, []);

  const handleUnreadCountUpdate = useCallback((data: UnreadCountUpdate) => {
    console.log('Unread count updated:', data);
    setUnreadCount(data.unreadCount);
  }, []);

  const handleConnection = useCallback((data: any) => {
    console.log('WebSocket connected:', data);
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected');
    setIsConnected(false);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
  }, []);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Connecting to WebSocket...');
      webSocketService.connect();
    } else {
      console.log('Disconnecting from WebSocket...');
      webSocketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  // Set up event listeners
  useEffect(() => {
    webSocketService.onNewNotification(handleNewNotification);
    webSocketService.onUnreadCountUpdate(handleUnreadCountUpdate);
    webSocketService.onConnection(handleConnection);
    webSocketService.onDisconnect(handleDisconnect);
    webSocketService.onError(handleError);

    // Cleanup
    return () => {
      webSocketService.onNewNotification(() => {});
      webSocketService.onUnreadCountUpdate(() => {});
      webSocketService.onConnection(() => {});
      webSocketService.onDisconnect(() => {});
      webSocketService.onError(() => {});
    };
  }, [handleNewNotification, handleUnreadCountUpdate, handleConnection, handleDisconnect, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return {
    unreadCount,
    isConnected,
    refetchUnreadCount,
  };
};
