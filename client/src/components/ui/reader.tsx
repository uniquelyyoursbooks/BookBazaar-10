import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Book, InsertReadingProgress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateReadingProgress } from "@/lib/utils";

// Set up the PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ReaderProps {
  book: Book;
  userId?: number;
  initialPage?: number;
  totalPages?: number;
}

const Reader: React.FC<ReaderProps> = ({ 
  book, 
  userId, 
  initialPage = 1,
  totalPages = 1
}) => {
  const [numPages, setNumPages] = useState<number>(totalPages);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [fontSize, setFontSize] = useState<string>("medium");
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const { toast } = useToast();

  // Extract the userId and filename from the filePath
  const pathParts = book.filePath.split('/');
  const bookFileUserId = pathParts[pathParts.length - 2];
  const filename = pathParts[pathParts.length - 1];
  const bookFilePath = `/uploads/${bookFileUserId}/${filename}`;

  // Function to handle document load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    if (initialPage > numPages) {
      setPageNumber(1);
    }
  }

  // Functions to navigate between pages
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  // Save reading progress
  useEffect(() => {
    if (!userId) return;

    const saveProgress = async () => {
      try {
        const progressData: InsertReadingProgress = {
          userId,
          bookId: book.id,
          currentPage: pageNumber,
          totalPages: numPages
        };

        await apiRequest('POST', '/api/reading-progress', progressData);
      } catch (error) {
        console.error('Error saving reading progress:', error);
      }
    };

    // Debounce to avoid too many updates
    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [pageNumber, numPages, userId, book.id]);

  // Toggle bookmark
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark removed" : "Bookmark added",
      description: isBookmarked 
        ? "This page has been removed from your bookmarks" 
        : "This page has been added to your bookmarks",
      duration: 2000
    });
  };

  // Change font size
  const toggleFontSize = () => {
    const sizes = ["small", "medium", "large"];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setFontSize(sizes[nextIndex]);
    
    toast({
      title: "Font size changed",
      description: `Font size set to ${sizes[nextIndex]}`,
      duration: 2000
    });
  };

  // Font size classes
  const fontSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg"
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg reader-container">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-medium text-primary serif">{book.title}</h3>
          <p className="text-sm text-neutral-600">Page {pageNumber} of {numPages}</p>
        </div>
        <Progress 
          value={calculateReadingProgress(pageNumber, numPages)} 
          className="w-32" 
        />
      </div>
      
      <div className="border-t border-neutral-200 pt-4">
        <Document
          file={bookFilePath}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<Skeleton className="h-[800px] w-full" />}
          error={<div className="text-center text-red-500 py-10">Error loading document. Please try again.</div>}
          className={fontSizeClasses[fontSize as keyof typeof fontSizeClasses]}
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            width={undefined}
            className="page-transition mx-auto"
          />
        </Document>
      </div>
      
      <div className="mt-6 flex justify-between items-center pt-4 border-t border-neutral-200">
        <Button
          variant="outline"
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
        >
          <i className="fas fa-arrow-left mr-2"></i> Previous
        </Button>
        
        <div className="flex items-center">
          <button 
            className={`mr-4 transition-colors ${isBookmarked ? 'text-secondary' : 'text-neutral-400 hover:text-secondary'}`}
            onClick={toggleBookmark}
            aria-label="Toggle bookmark"
          >
            <i className={isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
          </button>
          
          <button 
            className="text-neutral-400 hover:text-secondary transition-colors"
            onClick={toggleFontSize}
            aria-label="Change font size"
          >
            <i className="fas fa-font"></i>
          </button>
        </div>
        
        <Button
          variant="outline"
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
        >
          Next <i className="fas fa-arrow-right ml-2"></i>
        </Button>
      </div>
    </div>
  );
};

export default Reader;
