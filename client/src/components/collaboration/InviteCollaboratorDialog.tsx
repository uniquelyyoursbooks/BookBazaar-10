import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const inviteCollaboratorSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  role: z.enum(['co-author', 'editor', 'viewer'])
}).refine(data => data.email || data.username, {
  message: "Either email or username is required",
  path: ["email"]
});

type InviteCollaboratorFormValues = z.infer<typeof inviteCollaboratorSchema>;

interface InviteCollaboratorDialogProps {
  bookId: number;
  trigger: React.ReactNode;
}

export default function InviteCollaboratorDialog({ bookId, trigger }: InviteCollaboratorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InviteCollaboratorFormValues>({
    resolver: zodResolver(inviteCollaboratorSchema),
    defaultValues: {
      email: '',
      username: '',
      role: 'co-author'
    }
  });
  
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteCollaboratorFormValues) => {
      return await apiRequest(`/api/books/${bookId}/collaborators`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Invitation sent',
        description: 'The user has been invited to collaborate on this book.',
      });
      
      // Invalidate the collaborators query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
      
      // Reset the form and close the dialog
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  const onSubmit = (data: InviteCollaboratorFormValues) => {
    inviteMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Collaborator</DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on this book. They will receive an invitation
            to join as a collaborator.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="collaborator@example.com" 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <span className="relative bg-background px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="username" 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="co-author">Co-Author (can edit content)</SelectItem>
                      <SelectItem value="editor">Editor (can suggest edits)</SelectItem>
                      <SelectItem value="viewer">Viewer (read-only access)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={inviteMutation.isPending}
                className="ml-2"
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}