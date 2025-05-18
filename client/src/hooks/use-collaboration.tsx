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

interface Message {
  type: string;
  userId: number;
  timestamp: string;
  content?: string;
  cursorPosition?: number;
  message?: string;
  username?: string;
}

interface CursorPosition {
  userId: number;
  position: number;
  username: string;
  color: string;
}

interface CollaborationResult {
  sendMessage: (message: Message) => void;
  connectedUsers: number[];
  lastMessage: Message | null;
  documentChanges: DocumentChange[];
  cursorPositions: CursorPosition[];
  updateCursorPosition: (position: number) => void;
}

// Color array for distinguishing users
const USER_COLORS = [
  '#4285F4', // Google Blue
  '#34A853', // Google Green
  '#FBBC05', // Google Yellow
  '#EA4335', // Google Red
  '#8E44AD', // Purple
  '#3498DB', // Blue
  '#1ABC9C', // Teal
  '#F39C12', // Orange
];

export const useCollaboration = ({
  bookId,
  userId,
  chapterId
}: CollaborationOptions): CollaborationResult => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<number[]>([]);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [documentChanges, setDocumentChanges] = useState<DocumentChange[]>([]);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!bookId || !userId) return;
    
    const connectWebSocket = () => {
      // Always use secure WebSocket connections (wss://) except in localhost development
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      // Only use ws:// if we're on localhost AND using http://
      const protocol = (!isLocalhost || isHttps) ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        setConnected(true);
        
        // Send join message
        const joinMessage = {
          type: 'join',
          userId,
          bookId,
          chapterId,
          timestamp: new Date().toISOString()
        };
        
        newSocket.send(JSON.stringify(joinMessage));
      };
      
      newSocket.onclose = () => {
        console.log('WebSocket connection closed');
        setConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'users':
              // Update list of connected users
              setConnectedUsers(message.users);
              break;
              
            case 'cursorPosition':
              // Update cursor positions
              setCursorPositions(prevPositions => {
                // Remove any existing position for this user
                const filteredPositions = prevPositions.filter(p => p.userId !== message.userId);
                
                // Add the new position
                return [...filteredPositions, {
                  userId: message.userId,
                  position: message.cursorPosition,
                  username: message.username || `User ${message.userId}`,
                  color: USER_COLORS[message.userId % USER_COLORS.length]
                }];
              });
              break;
              
            case 'contentChange':
              // Content changes are handled by the component
              break;
              
            case 'documentChange':
              // Add new document change to the list
              if (message.change) {
                setDocumentChanges(prev => [message.change, ...prev]);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      setSocket(newSocket);
      socketRef.current = newSocket;
      
      return newSocket;
    };
    
    const newSocket = connectWebSocket();
    
    // Cleanup
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        // Send leave message
        const leaveMessage = {
          type: 'leave',
          userId,
          bookId,
          chapterId,
          timestamp: new Date().toISOString()
        };
        
        socketRef.current.send(JSON.stringify(leaveMessage));
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [bookId, userId, chapterId]);
  
  // Send WebSocket message
  const sendMessage = useCallback((message: Message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Add common fields
      const fullMessage = {
        ...message,
        bookId,
        chapterId,
      };
      
      socketRef.current.send(JSON.stringify(fullMessage));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, [bookId, chapterId]);
  
  // Update cursor position
  const updateCursorPosition = useCallback((position: number) => {
    sendMessage({
      type: 'cursorPosition',
      userId,
      cursorPosition: position,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage, userId]);
  
  return {
    sendMessage,
    connectedUsers,
    lastMessage,
    documentChanges,
    cursorPositions,
    updateCursorPosition
  };
};