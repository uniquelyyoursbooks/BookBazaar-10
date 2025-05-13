import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, CircleUserRound, PenSquare, Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type CollaboratorRole = 'owner' | 'co-author' | 'editor' | 'viewer';

interface Collaborator {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  role: CollaboratorRole;
  inviteStatus: string;
  invitedAt: string;
  lastActive: string | null;
}

interface CollaboratorListProps {
  bookId: number;
  ownerId: number;
  activeUsers?: number[];
  onRemoveCollaborator?: (collaboratorId: number) => void;
  onChangeRole?: (collaboratorId: number, newRole: CollaboratorRole) => void;
}

export default function CollaboratorList({
  bookId,
  ownerId,
  activeUsers = [],
  onRemoveCollaborator,
  onChangeRole
}: CollaboratorListProps) {
  const { data: collaborators, isLoading, error } = useQuery<Collaborator[]>({
    queryKey: [`/api/books/${bookId}/collaborators`],
    refetchInterval: 10000 // Refetch every 10 seconds to keep the list updated
  });
  
  const getRoleIcon = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return <User className="h-4 w-4 text-primary" />;
      case 'co-author':
        return <PenSquare className="h-4 w-4 text-blue-500" />;
      case 'editor':
        return <PenSquare className="h-4 w-4 text-orange-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getRoleBadgeStyle = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return 'bg-primary text-primary-foreground';
      case 'co-author':
        return 'bg-blue-500 text-white';
      case 'editor':
        return 'bg-orange-500 text-white';
      case 'viewer':
        return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading collaborators...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            Error loading collaborators. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {collaborators && collaborators.map((collaborator) => {
            const isActive = activeUsers.includes(collaborator.userId);
            const currentUser = ownerId === collaborator.userId;
            
            return (
              <li key={collaborator.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className={`h-8 w-8 ${isActive ? 'ring-2 ring-green-500' : ''}`}>
                          <AvatarImage src={`https://avatar.vercel.sh/${collaborator.username}`} />
                          <AvatarFallback>
                            {collaborator.fullName?.charAt(0) || collaborator.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {collaborator.fullName || collaborator.username}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {isActive ? 'Currently online' : 'Offline'}
                          </span>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{collaborator.fullName || collaborator.username}</span>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(collaborator.role)}
                      <span className="text-xs text-muted-foreground capitalize">{collaborator.role}</span>
                      {isActive && (
                        <Badge variant="outline" className="ml-1 h-1.5 w-1.5 rounded-full bg-green-500 p-0" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Only show actions if not the current user, and current user is owner */}
                {!currentUser && ownerId === ownerId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onChangeRole && collaborator.role !== 'owner' && (
                        <>
                          <DropdownMenuItem onClick={() => onChangeRole(collaborator.id, 'co-author')}>
                            Make Co-Author
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onChangeRole(collaborator.id, 'editor')}>
                            Make Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onChangeRole(collaborator.id, 'viewer')}>
                            Make Viewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onRemoveCollaborator && (
                        <DropdownMenuItem 
                          onClick={() => onRemoveCollaborator(collaborator.id)}
                          className="text-red-500 focus:text-red-500"
                        >
                          Remove
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            );
          })}
          
          {(!collaborators || collaborators.length === 0) && (
            <p className="text-sm text-muted-foreground">No collaborators yet.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}