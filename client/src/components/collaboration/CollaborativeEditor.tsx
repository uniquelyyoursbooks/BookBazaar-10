import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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

interface CollaborativeEditorProps {
  bookId: number;
  userId: number;
  chapterId?: number;
  initialContent?: string;
  onSave?: (content: string) => void;
}

export default function CollaborativeEditor({
  bookId,
  userId,
  chapterId,
  initialContent = '',
  onSave
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isProcessingChanges, setIsProcessingChanges] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const { toast } = useToast();
  
  // Track cursor positions
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cursorMarkerRef = useRef<HTMLDivElement>(null);
  const selectionStart = useRef<number>(0);
  
  // Set up collaboration hooks
  const {
    isConnected,
    activeUsers,
    receivedChanges,
    cursorPositions,
    sendChange,
    sendCursorPosition,
    getUserColor,
    clearReceivedChanges,
    error
  } = useCollaboration({
    bookId,
    userId,
    chapterId
  });
  
  // Fetch collaborator information for displaying names
  const { data: collaborators } = useQuery({
    queryKey: [`/api/books/${bookId}/collaborators`],
    staleTime: 30000 // 30 seconds
  });
  
  // Get collaborator name by user ID
  const getCollaboratorName = (userId: number) => {
    if (!collaborators) return 'Unknown';
    
    const collaborator = collaborators.find((c: any) => c.userId === userId);
    return collaborator ? collaborator.fullName || collaborator.username : 'Unknown';
  };
  
  // Process changes from other users
  useEffect(() => {
    if (receivedChanges.length === 0 || isProcessingChanges) return;
    
    // Set processing flag to avoid processing the same changes multiple times
    setIsProcessingChanges(true);
    
    // Sort changes by timestamp
    const sortedChanges = [...receivedChanges].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Apply each change sequentially
    let updatedContent = content;
    sortedChanges.forEach(change => {
      switch (change.changeType) {
        case 'insert':
          if (change.position !== null && change.content) {
            updatedContent = 
              updatedContent.substring(0, change.position) + 
              change.content + 
              updatedContent.substring(change.position);
          }
          break;
          
        case 'delete':
          if (change.position !== null && change.content) {
            const deletePosition = change.position;
            const deleteLength = change.content.length;
            updatedContent = 
              updatedContent.substring(0, deletePosition) + 
              updatedContent.substring(deletePosition + deleteLength);
          }
          break;
          
        case 'replace':
          if (change.position !== null && change.content && change.previousContent) {
            const replacePosition = change.position;
            const replaceLength = change.previousContent.length;
            updatedContent = 
              updatedContent.substring(0, replacePosition) + 
              change.content + 
              updatedContent.substring(replacePosition + replaceLength);
          }
          break;
          
        default:
          console.warn(`Unknown change type: ${change.changeType}`);
      }
    });
    
    // Update the content with all changes applied
    setContent(updatedContent);
    
    // Clear the processed changes
    clearReceivedChanges();
    
    // Reset processing flag
    setIsProcessingChanges(false);
  }, [receivedChanges, isProcessingChanges, content, clearReceivedChanges]);
  
  // Create cursor markers for collaborators
  useEffect(() => {
    if (!cursorMarkerRef.current) return;
    
    // Clear existing markers
    const container = cursorMarkerRef.current;
    container.innerHTML = '';
    
    if (!editorRef.current) return;
    
    // Get editor position and dimensions
    const textArea = editorRef.current;
    const textAreaRect = textArea.getBoundingClientRect();
    
    // Position calculation helper
    const positionToCoordinates = (position: number) => {
      // Create a range to get the position
      const text = textArea.value;
      const lines = text.substring(0, position).split('\n');
      const lineNumber = lines.length - 1;
      const charPosition = lines[lineNumber].length;
      
      // Calculate the height of each line (approximately)
      const lineHeight = 20; // Approximate line height (px)
      
      // Calculate y position
      const y = lineNumber * lineHeight;
      
      // Calculate x position (approximate)
      const charWidth = 8; // Approximate character width (px)
      const x = charPosition * charWidth;
      
      return { x, y };
    };
    
    // Create cursor markers for each user
    Object.entries(cursorPositions).forEach(([userIdStr, position]) => {
      const otherUserId = parseInt(userIdStr);
      if (otherUserId === userId) return; // Skip own cursor
      
      const { x, y } = positionToCoordinates(position);
      const color = getUserColor(otherUserId);
      
      // Create cursor element
      const cursor = document.createElement('div');
      cursor.className = 'absolute pointer-events-none';
      cursor.style.backgroundColor = color;
      cursor.style.width = '2px';
      cursor.style.height = '20px';
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      
      // Create name tag
      const nameTag = document.createElement('div');
      nameTag.className = 'absolute text-xs text-white px-1 py-0.5 rounded whitespace-nowrap';
      nameTag.style.backgroundColor = color;
      nameTag.style.left = `${x}px`;
      nameTag.style.top = `${y - 20}px`;
      nameTag.innerText = getCollaboratorName(otherUserId);
      
      // Add to container
      container.appendChild(cursor);
      container.appendChild(nameTag);
    });
  }, [cursorPositions, getUserColor, userId, getCollaboratorName]);
  
  // Handle content changes and send to collaborators
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    const newContent = target.value;
    const cursorPos = target.selectionStart;
    selectionStart.current = cursorPos;
    
    // Get the difference between the old and new content
    const oldContent = content;
    
    // Simple change detection (this could be more sophisticated)
    if (newContent.length > oldContent.length) {
      // Insertion
      const insertedText = newContent.substring(cursorPos - (newContent.length - oldContent.length), cursorPos);
      const insertPosition = cursorPos - insertedText.length;
      
      // Send the change
      sendChange('insert', insertPosition, insertedText);
    } else if (newContent.length < oldContent.length) {
      // Deletion
      const diff = oldContent.length - newContent.length;
      const deletePosition = cursorPos;
      
      // Try to determine what was deleted (approximate)
      const deletedText = oldContent.substring(deletePosition, deletePosition + diff);
      
      // Send the change
      sendChange('delete', deletePosition, deletedText);
    }
    
    // Update the local content
    setContent(newContent);
    setHasUnsavedChanges(newContent !== lastSavedContent);
  };
  
  // Debounced cursor position update
  const debouncedCursorUpdate = useRef(
    debounce((position: number) => {
      sendCursorPosition(position);
    }, 100)
  ).current;
  
  // Handle cursor position changes
  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const cursorPos = target.selectionStart;
    selectionStart.current = cursorPos;
    
    // Send the cursor position using a debounced function
    debouncedCursorUpdate(cursorPos);
  };
  
  // Handle key events
  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleCursorMove(e);
  };
  
  // Handle saves
  const handleSave = async () => {
    try {
      if (onSave) {
        onSave(content);
      } else if (chapterId) {
        // If no save handler is provided, use the API
        await apiRequest(`/api/books/${bookId}/chapters/${chapterId}`, 'PATCH', {
          content
        });
      } else {
        // Save the entire book content
        await apiRequest(`/api/books/${bookId}/content`, 'PATCH', {
          content
        });
      }
      
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Saved',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message || 'Could not save your changes. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {chapterId ? 'Chapter Editor' : 'Book Content Editor'}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Connection status */}
            {isConnected ? (
              <span className="flex items-center text-sm text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center text-sm text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                Disconnected
              </span>
            )}
            
            {/* Active users toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative"
                    onClick={() => setShowActiveUsers(!showActiveUsers)}
                  >
                    <Users className="h-4 w-4" />
                    {activeUsers.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                        {activeUsers.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeUsers.length === 0 
                    ? 'No active collaborators' 
                    : `${activeUsers.length} active collaborator${activeUsers.length > 1 ? 's' : ''}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Show active users when toggled */}
        {showActiveUsers && activeUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeUsers.map(activeUserId => (
              <TooltipProvider key={activeUserId}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-8 w-8 border-2" style={{ borderColor: getUserColor(activeUserId) }}>
                      <AvatarFallback style={{ backgroundColor: getUserColor(activeUserId), color: 'white' }}>
                        {getCollaboratorName(activeUserId).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getCollaboratorName(activeUserId)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
        
        {/* Show error if there is one */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-start">
            <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative">
          {/* Reference to place cursor markers */}
          <div 
            ref={cursorMarkerRef} 
            className="absolute inset-0 pointer-events-none overflow-hidden"
          ></div>
          
          {/* The actual editor */}
          <Textarea
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            onKeyUp={handleKeyUp}
            onClick={handleCursorMove}
            className="min-h-[400px] font-mono resize-vertical"
            placeholder="Start typing your content here..."
          />
        </div>
      </CardContent>
      
      <CardFooter className="justify-between">
        <div className="text-sm text-muted-foreground">
          {activeUsers.length > 0 
            ? `${activeUsers.length} collaborator${activeUsers.length > 1 ? 's' : ''} online` 
            : 'No collaborators online'}
        </div>
        
        <Button
          variant="default"
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className="gap-1"
        >
          <Save className="h-4 w-4" />
          {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
        </Button>
      </CardFooter>
    </Card>
  );
}