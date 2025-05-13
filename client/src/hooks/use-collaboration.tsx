import { useState, useEffect, useCallback, useRef } from 'react';

interface CollaborationOptions {
  bookId: number;
  userId: number;
  chapterId?: number;
}

interface DocumentChange {
  id: number;
  bookId: number;
  chapterId: number | null;
  userId: number;
  changeType: string;
  position: number | null;
  content: string | null;
  previousContent: string | null;
  timestamp: Date;
}

interface CollaborationMessage {
  type: string;
  userId?: number;
  bookId?: number;
  chapterId?: number;
  data?: any;
  timestamp?: Date;
  users?: number[];
  changes?: DocumentChange[];
  message?: string;
  position?: number;
}

// Map to track active users with different colors
const USER_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39'
];

export function useCollaboration(options: CollaborationOptions) {
  const { bookId, userId, chapterId } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<number[]>([]);
  const [receivedChanges, setReceivedChanges] = useState<DocumentChange[]>([]);
  const [cursorPositions, setCursorPositions] = useState<{[userId: number]: number}>({});
  const [chatMessages, setChatMessages] = useState<{userId: number, message: string, timestamp: Date}[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);

  // Function to send a change through the WebSocket
  const sendChange = useCallback((changeType: string, position: number, content: string, previousContent?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Connection lost. Changes not synchronized.');
      return false;
    }
    
    const message: CollaborationMessage = {
      type: 'change',
      userId,
      bookId,
      chapterId,
      data: {
        changeType,
        position,
        content,
        previousContent: previousContent || ''
      }
    };
    
    socketRef.current.send(JSON.stringify(message));
    return true;
  }, [userId, bookId, chapterId]);

  // Function to send cursor position
  const sendCursorPosition = useCallback((position: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    const message: CollaborationMessage = {
      type: 'cursor-move',
      userId,
      bookId,
      data: { position }
    };
    
    socketRef.current.send(JSON.stringify(message));
  }, [userId, bookId]);

  // Function to send chat message
  const sendChatMessage = useCallback((text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Connection lost. Message not sent.');
      return false;
    }
    
    const message: CollaborationMessage = {
      type: 'chat-message',
      userId,
      bookId,
      data: { message: text }
    };
    
    socketRef.current.send(JSON.stringify(message));
    
    // Add the message locally as well
    setChatMessages(prev => [...prev, { 
      userId, 
      message: text, 
      timestamp: new Date() 
    }]);
    
    return true;
  }, [userId, bookId]);

  // Connect to the WebSocket and handle messages
  useEffect(() => {
    if (!userId || !bookId) return;
    
    // Create the WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      
      // Authenticate first
      socket.send(JSON.stringify({ 
        type: 'auth', 
        userId 
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const message: CollaborationMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'auth-success':
            setIsConnected(true);
            
            // Join the book's collaboration session
            socket.send(JSON.stringify({
              type: 'join',
              userId,
              bookId,
              chapterId
            }));
            break;
            
          case 'error':
            setError(message.message || 'Unknown error');
            break;
            
          case 'session-info':
            if (message.users) {
              setActiveUsers(message.users);
            }
            break;
            
          case 'user-joined':
            if (message.userId) {
              setActiveUsers(prev => {
                if (!prev.includes(message.userId!)) {
                  return [...prev, message.userId!];
                }
                return prev;
              });
            }
            break;
            
          case 'user-left':
            if (message.userId) {
              setActiveUsers(prev => prev.filter(id => id !== message.userId));
              setCursorPositions(prev => {
                const newPositions = {...prev};
                delete newPositions[message.userId!];
                return newPositions;
              });
            }
            break;
            
          case 'change':
            if (message.userId && message.userId !== userId && message.data) {
              const change: DocumentChange = {
                id: Date.now(), // Temporary ID
                bookId,
                chapterId: chapterId || null,
                userId: message.userId,
                changeType: message.data.changeType,
                position: message.data.position,
                content: message.data.content,
                previousContent: message.data.previousContent,
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
              };
              
              setReceivedChanges(prev => [...prev, change]);
            }
            break;
            
          case 'cursor-move':
            if (message.userId && message.userId !== userId && message.position !== undefined) {
              setCursorPositions(prev => ({
                ...prev,
                [message.userId!]: message.position!
              }));
            }
            break;
            
          case 'chat-message':
            if (message.userId && message.data?.message) {
              setChatMessages(prev => [...prev, {
                userId: message.userId!,
                message: message.data.message,
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
              }]);
            }
            break;
            
          case 'recent-changes':
            if (message.changes) {
              // Only apply changes we haven't processed yet
              setReceivedChanges(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const newChanges = message.changes!.filter(c => !existingIds.has(c.id));
                return [...prev, ...newChanges];
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      setError('Connection closed. Reconnecting...');
      
      // Reset active users since we're disconnected
      setActiveUsers([]);
    };
    
    // Clean up function
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        // Send a leave message before closing
        socket.send(JSON.stringify({
          type: 'leave',
          userId,
          bookId
        }));
        
        socket.close();
      }
    };
  }, [userId, bookId, chapterId]);
  
  // Get a user's color based on their ID
  const getUserColor = useCallback((collaboratorId: number) => {
    const colorIndex = collaboratorId % USER_COLORS.length;
    return USER_COLORS[colorIndex];
  }, []);

  return {
    isConnected,
    activeUsers,
    receivedChanges,
    cursorPositions,
    chatMessages,
    error,
    sendChange,
    sendCursorPosition,
    sendChatMessage,
    getUserColor,
    
    // Helper to clear received changes after processing
    clearReceivedChanges: () => setReceivedChanges([])
  };
}