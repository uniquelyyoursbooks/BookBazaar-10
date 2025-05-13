import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollaboration } from '@/hooks/use-collaboration';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

interface ChatMessage {
  userId: number;
  username?: string;
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  bookId: number;
  userId: number;
  username?: string;
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

const ChatPanel: React.FC<ChatPanelProps> = ({ bookId, userId, username = 'You' }) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Setup collaboration hooks
  const { sendMessage, lastMessage } = useCollaboration({
    bookId,
    userId
  });
  
  // Handle incoming messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'chat') {
      setChatMessages(prev => [
        ...prev,
        {
          userId: lastMessage.userId,
          username: lastMessage.username,
          message: lastMessage.message || '',
          timestamp: new Date(lastMessage.timestamp)
        }
      ]);
    }
  }, [lastMessage]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Send message handler
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Create a new message
    const newMessage: ChatMessage = {
      userId,
      username,
      message: message.trim(),
      timestamp: new Date()
    };
    
    // Add to local messages
    setChatMessages(prev => [...prev, newMessage]);
    
    // Send via WebSocket
    sendMessage({
      type: 'chat',
      userId,
      message: message.trim(),
      username,
      timestamp: new Date().toISOString()
    });
    
    // Clear input
    setMessage('');
  };
  
  // Handle enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <h3 className="font-medium">Chat</h3>
        <p className="text-xs text-muted-foreground">Communicate with collaborators</p>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isCurrentUser = msg.userId === userId;
              const userColor = USER_COLORS[msg.userId % USER_COLORS.length];
              
              return (
                <div 
                  key={index} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] ${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                        : 'bg-muted rounded-tl-lg rounded-tr-lg rounded-br-lg'
                    } px-3 py-2`}
                  >
                    {!isCurrentUser && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback 
                            style={{ backgroundColor: userColor }}
                            className="text-white text-xs"
                          >
                            {msg.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {msg.username || `User ${msg.userId}`}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      <Separator />
      
      <div className="p-3">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type a message..."
            className="min-h-[80px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="mb-1"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;