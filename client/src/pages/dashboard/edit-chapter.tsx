import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, FileEdit } from 'lucide-react';
import { CollaborationPanel, CollaborativeEditor } from '@/components/collaboration';
import { Book } from '@shared/schema';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  isAuthor: boolean;
}

interface Chapter {
  id: number;
  bookId: number;
  title: string;
  content: string;
  orderIndex: number;
}

interface ChapterEditorProps {}

const EditChapter: React.FC<ChapterEditorProps> = () => {
  const { bookId, chapterId } = useParams<{ bookId: string, chapterId: string }>();
  const bookIdNum = parseInt(bookId);
  const chapterIdNum = parseInt(chapterId);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Collaboration panel state
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  
  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookIdNum}`],
    enabled: !isNaN(bookIdNum)
  });
  
  // Fetch chapter content
  const { data: chapter, isLoading: chapterLoading } = useQuery<Chapter>({
    queryKey: [`/api/books/${bookIdNum}/chapters/${chapterIdNum}`],
    enabled: !isNaN(bookIdNum) && !isNaN(chapterIdNum)
  });
  
  // Check if current user is the author or a collaborator
  const { data: user } = useQuery<User>({
    queryKey: ['/api/me']
  });
  
  const isOwner = user && book && user.id === book.authorId;
  
  // Handle navigation back to book
  const handleBackToBook = () => {
    navigate(`/dashboard/edit/${bookIdNum}`);
  };
  
  // If loading, show skeleton
  if (bookLoading || chapterLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If book or chapter not found
  if (!book || !chapter) {
    return (
      <div className="container max-w-5xl mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested book or chapter could not be found.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Determine chapter title
  const chapterTitle = chapter?.title || `Chapter ${chapterIdNum}`;
  
  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-6">
      {/* Header with navigation and collaboration button */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBackToBook}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Book
        </Button>
        
        {/* Collaboration button for authors and collaborators */}
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setCollaborationOpen(true)}
          >
            <Users className="h-4 w-4" />
            Collaborators
          </Button>
        )}
      </div>
      
      {/* Chapter title */}
      <div className="flex items-center space-x-2">
        <FileEdit className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{chapterTitle}</h1>
      </div>
      
      <Separator />
      
      {/* Collaborative editor */}
      <CollaborativeEditor
        bookId={bookIdNum}
        userId={user?.id || 0}
        chapterId={chapterIdNum}
        initialContent={chapter?.content || ''}
      />
      
      {/* Collaboration panel (slide-in) */}
      {collaborationOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-background border-l shadow-lg transform transition-transform">
          <CollaborationPanel
            isOpen={collaborationOpen} 
            onClose={() => setCollaborationOpen(false)}
            bookId={bookIdNum}
            userId={user?.id || 0}
            isOwner={!!isOwner}
          />
        </div>
      )}
    </div>
  );
};

export default EditChapter;