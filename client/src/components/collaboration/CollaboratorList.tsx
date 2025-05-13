import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Check, 
  X, 
  MoreHorizontal, 
  Crown, 
  Edit, 
  Eye, 
  AlertTriangle,
  UserMinus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCollaboration } from '@/hooks/use-collaboration';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';

interface CollaboratorListProps {
  bookId: number;
  userId: number;
  isOwner: boolean;
}

interface Collaborator {
  id: number;
  bookId: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  acceptedAt: string | null;
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

// Role icons
const roleIcons: Record<string, React.ReactNode> = {
  'owner': <Crown className="h-4 w-4 text-yellow-500" />,
  'editor': <Edit className="h-4 w-4 text-blue-500" />,
  'co-author': <Edit className="h-4 w-4 text-green-500" />,
  'viewer': <Eye className="h-4 w-4 text-gray-500" />
};

// Role display names
const roleNames: Record<string, string> = {
  'owner': 'Owner',
  'editor': 'Editor',
  'co-author': 'Co-Author',
  'viewer': 'Viewer',
};

const CollaboratorList: React.FC<CollaboratorListProps> = ({
  bookId,
  userId,
  isOwner
}) => {
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<Collaborator | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get active collaborators from WebSocket
  const { connectedUsers } = useCollaboration({
    bookId,
    userId
  });
  
  // Fetch collaborators for this book
  const { data: collaborators = [], isLoading } = useQuery<Collaborator[]>({
    queryKey: [`/api/books/${bookId}/collaborators`],
    enabled: bookId > 0,
  });
  
  // Get book owner
  interface Book {
    id: number;
    authorId: number;
    authorName?: string;
    title: string;
    description: string;
    category: string;
    coverImage?: string;
    price: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
  }

  const { data: book } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: bookId > 0
  });
  
  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (collaboratorId: number) => {
      return await apiRequest({
        url: `/api/collaborators/${collaboratorId}/accept`,
        method: 'PATCH',
        data: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation accepted",
        description: "You are now a collaborator on this book.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message || "An error occurred while accepting the invitation.",
        variant: "destructive",
      });
    }
  });
  
  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: async (collaboratorId: number) => {
      return await apiRequest({
        url: `/api/collaborators/${collaboratorId}/decline`,
        method: 'PATCH',
        data: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation declined",
        description: "You have declined to collaborate on this book.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to decline invitation",
        description: error.message || "An error occurred while declining the invitation.",
        variant: "destructive",
      });
    }
  });
  
  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ collaboratorId, role }: { collaboratorId: number, role: string }) => {
      return await apiRequest({
        url: `/api/collaborators/${collaboratorId}/role`,
        method: 'PATCH',
        data: { role }
      });
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "The collaborator's role has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.message || "An error occurred while updating the role.",
        variant: "destructive",
      });
    }
  });
  
  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorId: number) => {
      return await apiRequest({
        url: `/api/collaborators/${collaboratorId}`,
        method: 'DELETE',
        data: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from this book.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
      setCollaboratorToRemove(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove collaborator",
        description: error.message || "An error occurred while removing the collaborator.",
        variant: "destructive",
      });
    }
  });
  
  // Handle role change
  const handleRoleChange = (collaboratorId: number, newRole: string) => {
    updateRoleMutation.mutate({ collaboratorId, role: newRole });
  };
  
  // Handle removing a collaborator
  const handleRemoveCollaborator = () => {
    if (collaboratorToRemove) {
      removeCollaboratorMutation.mutate(collaboratorToRemove.id);
    }
  };
  
  // Get a list of all users (owner + collaborators)
  const allUsers = React.useMemo(() => {
    const result = [...collaborators];
    if (book?.authorId) {
      // Add the owner if not in the collaborators list
      const ownerExists = collaborators.some(c => c.userId === book.authorId);
      if (!ownerExists) {
        result.push({
          id: -1, // Placeholder ID
          bookId,
          userId: book.authorId,
          username: book.authorName || 'Owner',
          fullName: book.authorName || 'Owner',
          email: '',
          role: 'owner',
          status: 'accepted',
          invitedAt: '',
          acceptedAt: ''
        });
      }
    }
    return result;
  }, [book, collaborators, bookId]);
  
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  // Find any pending invitations for the current user
  const pendingInvitation = collaborators.find(c => 
    c.userId === userId && c.status === 'pending'
  );
  
  return (
    <div className="space-y-4 p-4">
      {/* Pending invitation card */}
      {pendingInvitation && (
        <div className="bg-muted p-4 rounded-lg space-y-3 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="font-medium">Collaboration Invitation</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            You've been invited to collaborate on this book as a {roleNames[pendingInvitation.role]}.
          </p>
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              onClick={() => acceptInvitationMutation.mutate(pendingInvitation.id)}
              disabled={acceptInvitationMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => declineInvitationMutation.mutate(pendingInvitation.id)}
              disabled={declineInvitationMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      )}
      
      {/* Collaborators list */}
      <div className="space-y-3">
        {allUsers.map((collaborator) => {
          const isCurrentUser = collaborator.userId === userId;
          const isOnline = connectedUsers.includes(collaborator.userId);
          const userColor = USER_COLORS[collaborator.userId % USER_COLORS.length];
          const canManage = isOwner && !isCurrentUser && collaborator.role !== 'owner';
          
          return (
            <div key={collaborator.id !== -1 ? collaborator.id : `owner-${collaborator.userId}`}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/20"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback 
                      style={{ backgroundColor: userColor }}
                      className="text-white"
                    >
                      {collaborator.fullName.charAt(0) || collaborator.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                  )}
                </div>
                
                <div>
                  <div className="font-medium flex items-center">
                    {collaborator.fullName || collaborator.username}
                    {isCurrentUser && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    {roleIcons[collaborator.role] && (
                      <span className="mr-1">{roleIcons[collaborator.role]}</span>
                    )}
                    {roleNames[collaborator.role] || collaborator.role}
                    
                    {collaborator.status === 'pending' && (
                      <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      disabled={collaborator.role === 'co-author'}
                      onClick={() => handleRoleChange(collaborator.id, 'co-author')}
                    >
                      <Edit className="h-4 w-4 mr-2 text-green-500" />
                      Make Co-Author
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      disabled={collaborator.role === 'editor'}
                      onClick={() => handleRoleChange(collaborator.id, 'editor')}
                    >
                      <Edit className="h-4 w-4 mr-2 text-blue-500" />
                      Make Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      disabled={collaborator.role === 'viewer'}
                      onClick={() => handleRoleChange(collaborator.id, 'viewer')}
                    >
                      <Eye className="h-4 w-4 mr-2 text-gray-500" />
                      Make Viewer
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setCollaboratorToRemove(collaborator)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove Collaborator
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
        
        {allUsers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>No collaborators found.</p>
            {isOwner && (
              <p className="text-sm mt-1">
                Invite others to collaborate on this book.
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Remove collaborator confirmation dialog */}
      <AlertDialog open={!!collaboratorToRemove} onOpenChange={(open) => !open && setCollaboratorToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {collaboratorToRemove?.fullName || collaboratorToRemove?.username} as a collaborator?
              They will no longer have access to this book.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCollaborator}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollaboratorList;