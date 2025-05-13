import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Save, AlertCircle } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { useCollaboration } from '@/hooks/use-collaboration';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Interface for collaborator information
interface Collaborator {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  role: string;
  color?: string;
  cursorPosition?: number;
  online: boolean;
}

// Interface for cursor position
interface CursorPosition {
  userId: number;
  position: number;
  username: string;
  color: string;
}

// Interface for editor props
interface CollaborativeEditorProps {
  bookId: number;
  userId: number;
  chapterId: number;
  initialContent: string;
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

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  bookId,
  userId,
  chapterId,
  initialContent,
}) => {
  const [content, setContent] = useState(initialContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get collaborators for this book
  const { data: collaborators = [] } = useQuery<Collaborator[]>({
    queryKey: [`/api/books/${bookId}/collaborators`],
    enabled: bookId > 0,
  });

  // Setup collaboration hooks
  const {
    sendMessage,
    connectedUsers,
    lastMessage,
    cursorPositions,
    updateCursorPosition,
  } = useCollaboration({
    bookId,
    userId,
    chapterId,
  });

  // Mutation for saving chapter content
  const saveContentMutation = useMutation({
    mutationFn: async (newContent: string) => {
      return apiRequest({
        url: `/api/books/${bookId}/chapters/${chapterId}`,
        method: 'PATCH',
        data: { content: newContent },
      });
    },
    onSuccess: () => {
      setUnsavedChanges(false);
      setIsSaving(false);
      toast({
        title: 'Saved',
        description: 'Your changes have been saved',
      });
      
      // Invalidate and refetch chapter data
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/chapters/${chapterId}`] });
    },
    onError: (error: any) => {
      setIsSaving(false);
      toast({
        title: 'Error saving',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      });
    }
  });

  // Debounced save function to prevent too many saving operations
  const debouncedSave = useRef(
    debounce((newContent: string) => {
      saveContentMutation.mutate(newContent);
    }, 2000)
  ).current;

  // Auto-save when content changes
  useEffect(() => {
    if (content !== initialContent) {
      setUnsavedChanges(true);
      debouncedSave(content);
    }
  }, [content, initialContent, debouncedSave]);

  // Broadcast cursor position changes
  const handleCursorPositionChange = () => {
    if (editorRef.current) {
      const position = editorRef.current.selectionStart;
      cursorPositionRef.current = position;
      updateCursorPosition(position);
    }
  };

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Broadcast change to other users
    sendMessage({
      type: 'contentChange',
      content: newContent,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Also update cursor position
    handleCursorPositionChange();
  };

  // Process incoming messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'contentChange' && lastMessage.userId !== userId) {
      // Update content with remote changes
      if (typeof lastMessage.content === 'string') {
        setContent(lastMessage.content);
      }
    }
  }, [lastMessage, userId]);

  // Manual save handler
  const handleSave = () => {
    setIsSaving(true);
    saveContentMutation.mutate(content);
  };

  // Generate cursor markers for collaborators
  const renderCursorMarkers = () => {
    return cursorPositions
      .filter(pos => pos.userId !== userId) // Don't show own cursor
      .map((position) => {
        const userColor = position.color || USER_COLORS[position.userId % USER_COLORS.length];
        
        return (
          <TooltipProvider key={position.userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute w-0.5 h-5 cursor-pointer"
                  style={{
                    backgroundColor: userColor,
                    left: `${getCursorLeftPosition(position.position)}px`,
                    top: `${getCursorTopPosition(position.position)}px`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{position.username || `User ${position.userId}`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      });
  };
  
  // Calculate cursor position (simplified version)
  const getCursorLeftPosition = (position: number) => {
    // This is a simplified calculation - in a real implementation
    // you would need to calculate based on character width and wrapping
    return 20; // Fixed position for demo
  };
  
  const getCursorTopPosition = (position: number) => {
    // This is a simplified calculation - in a real implementation
    // you would need to calculate based on line height and content wrapping
    return 20; // Fixed position for demo
  };

  // Convert connected users into avatars
  const renderConnectedUsers = () => {
    if (connectedUsers.length === 0) return null;
    
    return (
      <div className="flex -space-x-2">
        {connectedUsers.slice(0, 5).map((user) => {
          const collaborator = collaborators.find(c => c.userId === user);
          const initials = collaborator 
            ? collaborator.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
            : `U${user}`;
          
          const color = USER_COLORS[user % USER_COLORS.length];
          
          return (
            <TooltipProvider key={user}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="border-2 border-background w-8 h-8">
                    <AvatarFallback 
                      style={{ backgroundColor: color }}
                      className="text-white text-xs"
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{collaborator ? collaborator.fullName : `User ${user}`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        
        {connectedUsers.length > 5 && (
          <Avatar className="border-2 border-background w-8 h-8">
            <AvatarFallback className="bg-muted text-foreground text-xs">
              +{connectedUsers.length - 5}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <Card className="w-full">
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">Collaborative Editor</CardTitle>
          </div>
          {renderConnectedUsers()}
        </CardHeader>
        
        <CardContent className="relative">
          <div className="relative">
            <Textarea
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              onClick={handleCursorPositionChange}
              onKeyUp={handleCursorPositionChange}
              onSelect={handleCursorPositionChange}
              className="min-h-[400px] font-mono resize-y"
              placeholder="Start writing here..."
            />
            {renderCursorMarkers()}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {unsavedChanges ? (
              <span className="flex items-center text-yellow-500">
                <AlertCircle className="h-4 w-4 mr-1" /> Unsaved changes
              </span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !unsavedChanges}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CollaborativeEditor;