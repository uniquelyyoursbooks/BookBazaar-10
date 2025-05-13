import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';

interface ChatMessage {
  userId: number;
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  bookId: number;
  userId: number;
  messages: ChatMessage[];
  onSendMessage: (message: string) => boolean;
  getUserColor?: (userId: number) => string;
}

export default function ChatPanel({
  bookId,
  userId,
  messages,
  onSendMessage,
  getUserColor = () => '#000'
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch collaborator details for showing names in the chat
  const { data: collaborators } = useQuery({
    queryKey: [`/api/books/${bookId}/collaborators`],
    staleTime: 30000, // 30 seconds
  });
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Get user info from collaborators data
  const getUserInfo = (userId: number) => {
    if (!collaborators) return { username: 'Unknown', fullName: 'Unknown User' };
    
    const collaborator = collaborators.find((c: any) => c.userId === userId);
    return collaborator || { username: 'Unknown', fullName: 'Unknown User' };
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const success = onSendMessage(inputValue);
      if (success) {
        setInputValue('');
      }
    }
  };
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm">Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-2 overflow-hidden">
        <ScrollArea className="h-[300px] pr-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isCurrentUser = msg.userId === userId;
                const userInfo = getUserInfo(msg.userId);
                const messageDate = new Date(msg.timestamp);
                
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://avatar.vercel.sh/${userInfo.username}`} />
                            <AvatarFallback style={{ backgroundColor: getUserColor(msg.userId) }}>
                              {userInfo.fullName?.charAt(0) || userInfo.username?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{userInfo.fullName || userInfo.username}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] text-sm
                        ${isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                        }`}
                    >
                      <div>{msg.message}</div>
                      <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {format(messageDate, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="sm" className="px-2">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}