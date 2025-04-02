import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Book, ReadingProgress } from "@shared/schema";
import Reader from "@/components/ui/reader";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ReadBook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bookId = parseInt(id);
  
  // In a real app, the current user would come from auth context
  const userId = 1; // Mock user ID
  
  // Fetch book details
  const { data: book, isLoading: bookLoading, error: bookError } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !isNaN(bookId)
  });
  
  // Fetch reading progress
  const { data: progress, isLoading: progressLoading } = useQuery<ReadingProgress>({
    queryKey: [`/api/users/${userId}/books/${bookId}/progress`],
    enabled: !isNaN(bookId) && userId !== undefined,
    retry: false, // Don't retry if it fails (user might not have started reading yet)
  });
  
  // If we can't get the progress, we'll start from page 1
  const initialPage = progress ? progress.currentPage : 1;
  const totalPages = progress ? progress.totalPages : 1;
  
  if (bookLoading || progressLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Skeleton className="h-10 w-3/4 mx-auto mb-6" />
        <Skeleton className="h-[800px] w-full rounded-xl" />
      </div>
    );
  }
  
  if (bookError || !book) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Reader 
        book={book} 
        userId={userId}
        initialPage={initialPage}
        totalPages={totalPages}
      />
    </div>
  );
};

export default ReadBook;
