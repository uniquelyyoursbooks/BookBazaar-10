import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Users, UserPlus, XCircle } from 'lucide-react';
import { useCollaboration } from '@/hooks/use-collaboration';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import CollaboratorList from './CollaboratorList';
import ChatPanel from './ChatPanel';
import InviteCollaboratorDialog from './InviteCollaboratorDialog';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
  userId: number;
  isOwner: boolean;
}

export default function CollaborationPanel({
  isOpen,
  onClose,
  bookId,
  userId,
  isOwner
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState('collaborators');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set up collaboration hooks
  const {
    isConnected,
    activeUsers,
    chatMessages,
    sendChatMessage,
    getUserColor,
    error
  } = useCollaboration({
    bookId,
    userId
  });
  
  // Mutation for changing collaborator role
  const changeRoleMutation = useMutation({
    mutationFn: async ({ collaboratorId, role }: { collaboratorId: number, role: string }) => {
      return await apiRequest(`/api/collaborations/${collaboratorId}/role`, 'PATCH', { role });
    },
    onSuccess: () => {
      toast({
        title: 'Role updated',
        description: 'The collaborator\'s role has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update role',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for removing a collaborator
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorId: number) => {
      return await apiRequest(`/api/collaborations/${collaboratorId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Collaborator removed',
        description: 'The collaborator has been removed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove collaborator',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // Handlers
  const handleChangeRole = (collaboratorId: number, newRole: string) => {
    changeRoleMutation.mutate({ collaboratorId, role: newRole });
  };
  
  const handleRemoveCollaborator = (collaboratorId: number) => {
    removeCollaboratorMutation.mutate(collaboratorId);
  };
  
  // If the panel is closed, return null
  if (!isOpen) return null;
  
  return (
    <Card className="fixed top-16 right-4 z-50 w-80 h-[500px] shadow-lg flex flex-col">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="text-sm font-medium">Book Collaboration</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-2 text-xs">
          {error}
        </div>
      )}
      
      <Tabs defaultValue="collaborators" value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="collaborators">
            <Users className="h-4 w-4 mr-2" />
            Collaborators
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="collaborators" className="flex-grow p-2 overflow-auto">
          {isOwner && (
            <div className="flex justify-end mb-2">
              <InviteCollaboratorDialog
                bookId={bookId}
                trigger={
                  <Button variant="outline" size="sm" className="text-xs">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Invite
                  </Button>
                }
              />
            </div>
          )}
          
          <CollaboratorList 
            bookId={bookId}
            ownerId={userId}
            activeUsers={activeUsers}
            onChangeRole={isOwner ? handleChangeRole : undefined}
            onRemoveCollaborator={isOwner ? handleRemoveCollaborator : undefined}
          />
        </TabsContent>
        
        <TabsContent value="chat" className="flex-grow p-2 overflow-auto flex">
          <ChatPanel
            bookId={bookId}
            userId={userId}
            messages={chatMessages}
            onSendMessage={sendChatMessage}
            getUserColor={getUserColor}
          />
        </TabsContent>
      </Tabs>
      
      <div className="p-2 border-t">
        <div className="flex items-center text-xs">
          <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </Card>
  );
}