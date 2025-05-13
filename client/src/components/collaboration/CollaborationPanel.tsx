import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Users, MessageSquare, UserPlus } from 'lucide-react';
import ChatPanel from './ChatPanel';
import CollaboratorList from './CollaboratorList';
import InviteCollaboratorDialog from './InviteCollaboratorDialog';
import { useQuery } from '@tanstack/react-query';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
  userId: number;
  isOwner: boolean;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  isAuthor: boolean;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isOpen,
  onClose,
  bookId,
  userId,
  isOwner
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  // Get current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/me'],
  });
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-lg">Collaboration</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="chat" className="flex-1 flex flex-col" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b px-4">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Collaborators</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="chat" className="h-full m-0 p-0">
            <ChatPanel 
              bookId={bookId} 
              userId={userId} 
              username={user?.fullName || user?.username}
            />
          </TabsContent>
          
          <TabsContent value="collaborators" className="h-full m-0 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                {isOwner && (
                  <Button 
                    className="w-full"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Collaborator
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                <CollaboratorList 
                  bookId={bookId} 
                  userId={userId} 
                  isOwner={isOwner} 
                />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {isOwner && (
        <InviteCollaboratorDialog
          bookId={bookId}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}
    </div>
  );
};

export default CollaborationPanel;