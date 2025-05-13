import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface InviteCollaboratorDialogProps {
  bookId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define form schema
const inviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['co-author', 'editor', 'viewer'], {
    required_error: 'Please select a role',
  }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const InviteCollaboratorDialog: React.FC<InviteCollaboratorDialogProps> = ({
  bookId,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'editor',
    },
  });
  
  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      return await apiRequest({
        url: `/api/books/${bookId}/collaborators`,
        method: 'POST',
        data: {
          email: data.email,
          role: data.role,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Invitation sent',
        description: 'The collaborator has been invited successfully.',
      });
      
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/collaborators`] });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to invite collaborator',
        description: error.message || 'An error occurred while sending the invitation.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: InviteFormValues) => {
    inviteMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Collaborator</DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on this book.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="collaborator@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the email address of the person you want to invite.
                  </FormDescription>
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
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="co-author">Co-Author (Can edit and invite others)</SelectItem>
                        <SelectItem value="editor">Editor (Can edit content)</SelectItem>
                        <SelectItem value="viewer">Viewer (Read-only access)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose the level of access for this collaborator.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Sending invitation...' : 'Send invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorDialog;