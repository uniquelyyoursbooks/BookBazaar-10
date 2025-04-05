import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, ReadingProgress, InsertReadingProgress } from "@shared/schema";
import { EnhancedPDFReader } from "@/components/reader";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, BookOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateReadingProgress } from "@/lib/utils";

const ReadBook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bookId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // In a real app, the current user would come from auth context
  const userId = localStorage.getItem('userId') || '1'; // Default to 1 for demo
  
  // Fetch book details
  const { data: book, isLoading: bookLoading, error: bookError } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !isNaN(bookId)
  });
  
  // Fetch reading progress
  const { data: progress, isLoading: progressLoading } = useQuery<ReadingProgress>({
    queryKey: [`/api/users/${userId}/books/${bookId}/progress`],
    enabled: !isNaN(bookId),
    retry: false, // Don't retry if it fails (user might not have started reading yet)
  });
  
  // Set up mutation for updating reading progress
  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: Partial<InsertReadingProgress>) => {
      const response = await apiRequest({
        method: 'POST',
        url: `/api/users/${userId}/books/${bookId}/progress`,
        data: progressData,
        headers: { 'user-id': userId }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/books/${bookId}/progress`] });
    },
    onError: (error) => {
      console.error('Error updating reading progress:', error);
      toast({
        title: "Error",
        description: "Failed to update reading progress",
        variant: "destructive"
      });
    }
  });
  
  // If we can't get the progress, we'll start from page 1
  const initialPage = progress?.currentPage || 1;
  const totalPages = progress?.totalPages || 0;
  
  // Function to handle page changes and update reading progress
  const handlePageChange = (newPageNumber: number, numPages: number) => {
    if (!book) return;
    
    const progressPercentage = calculateReadingProgress(newPageNumber, numPages);
    
    updateProgressMutation.mutate({
      userId: parseInt(userId),
      bookId,
      currentPage: newPageNumber,
      totalPages: numPages,
      completionPercentage: progressPercentage
    });
  };
  
  if (bookLoading || progressLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Skeleton className="h-10 w-3/4 mx-auto mb-6" />
        <Skeleton className="h-[800px] w-full rounded-xl" />
      </div>
    );
  }
  
  if (bookError || !book) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load the book. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-center">{book.title}</h1>
        <div className="w-[120px]"></div> {/* Spacer for alignment */}
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[800px]">
        <EnhancedPDFReader 
          pdfUrl={book.filePath || '/sample-book.pdf'} // Use filePath from schema
          bookId={bookId}
          initialPage={initialPage}
        />
      </div>
    </div>
  );
};

export default ReadBook;
