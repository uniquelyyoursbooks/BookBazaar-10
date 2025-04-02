import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { UserType } from "@/App";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type BookType = {
  id: number;
  title: string;
  authorId: number;
  description: string;
  coverImage?: string;
  contentPath: string;
  category: string;
  tags?: string[];
  createdAt: string;
  publishedAt: string;
  isPublished: boolean;
};

type BookProgressType = {
  id: number;
  bookId: number;
  userId: number;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
};

type ReaderProps = {
  user: UserType | null;
  bookId: number;
};

export default function Reader({ user, bookId }: ReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(18);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Fetch book details
  const { data: book, isLoading: isLoadingBook } = useQuery<BookType>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !isNaN(bookId),
  });

  // Fetch author details
  const { data: author } = useQuery<UserType>({
    queryKey: [`/api/users/${book?.authorId}`],
    enabled: !!book?.authorId,
  });

  // Fetch user's reading progress if logged in
  const { data: progress } = useQuery<BookProgressType>({
    queryKey: [`/api/books/${bookId}/progress/${user?.id}`],
    enabled: !!user && !isNaN(bookId),
    onSuccess: (data) => {
      if (data) {
        setPageNumber(data.currentPage);
      }
    },
  });

  // Mutation to save reading progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: { currentPage: number; totalPages: number }) => {
      if (!user) return null;
      
      return apiRequest('POST', `/api/books/${bookId}/progress`, {
        userId: user.id,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
      });
    },
  });

  // Function to handle document loading
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    
    // Save total pages to progress if user is logged in
    if (user && numPages) {
      saveProgressMutation.mutate({
        currentPage: pageNumber,
        totalPages: numPages,
      });
    }
  }

  // Function to change page
  function changePage(offset: number) {
    if (!numPages) return;
    
    const newPage = Math.max(1, Math.min(pageNumber + offset, numPages));
    setPageNumber(newPage);
    
    // Save progress if user is logged in
    if (user && numPages) {
      saveProgressMutation.mutate({
        currentPage: newPage,
        totalPages: numPages,
      });
    }
  }

  // Save progress when component unmounts
  useEffect(() => {
    return () => {
      if (user && numPages) {
        saveProgressMutation.mutate({
          currentPage: pageNumber,
          totalPages: numPages,
        });
      }
    };
  }, [user, pageNumber, numPages, saveProgressMutation]);

  if (isLoadingBook) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book Not Found</h2>
          <p className="mb-6 text-[#777777]">The book you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F9F6F2] text-[#333333]'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Reader Header */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center mb-8 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`w-24 h-36 sm:w-28 sm:h-40 rounded overflow-hidden shadow-md mr-4 mb-4 sm:mb-0 ${darkMode ? 'shadow-gray-800' : ''}`}>
            {book.coverImage ? (
              <img 
                src={book.coverImage} 
                alt={book.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Cover</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-['Merriweather']">{book.title}</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-[#777777]'} mb-2`}>
              By {author?.displayName || 'Unknown Author'}
            </p>
            <div className="flex items-center space-x-2">
              <Link href={`/books/${book.id}`}>
                <Button variant="outline" size="sm" className={darkMode ? 'border-gray-700 hover:bg-gray-800' : ''}>
                  Book Details
                </Button>
              </Link>
              {user?.id === book.authorId && (
                <Link href={`/dashboard?edit=${book.id}`}>
                  <Button variant="outline" size="sm" className={darkMode ? 'border-gray-700 hover:bg-gray-800' : ''}>
                    Edit Book
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Reader Controls */}
        <div className={`flex justify-between items-center mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow`}>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} hover:opacity-80`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <div className="hidden md:flex items-center space-x-2">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-[#777777]'}`}>Text Size:</span>
              <div className="w-32">
                <Slider
                  value={[fontSize]}
                  min={12}
                  max={24}
                  step={1}
                  onValueChange={(value) => setFontSize(value[0])}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-[#777777]'}`}>
              Page {pageNumber} of {numPages || '?'}
            </span>
            <div className="flex">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                className={darkMode ? 'hover:bg-gray-700' : ''}
              >
                ←
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => changePage(1)}
                disabled={!numPages || pageNumber >= numPages}
                className={darkMode ? 'hover:bg-gray-700' : ''}
              >
                →
              </Button>
            </div>
          </div>
        </div>
        
        {/* PDF Reader */}
        <div 
          className={`reader-container mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 shadow-gray-900' : ''}`}
          style={{ maxWidth: '850px' }}
        >
          <div className="flex justify-center p-4">
            <Document
              file={book.contentPath}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex justify-center p-12">
                  <div className={`w-12 h-12 rounded-full border-4 ${darkMode ? 'border-gray-600 border-t-gray-800' : 'border-primary border-t-transparent'} animate-spin`}></div>
                </div>
              }
              error={
                <div className="text-center p-12">
                  <p className="text-lg font-bold mb-2">Error loading PDF</p>
                  <p className="mb-4">This book may be in another format or the file might be corrupted.</p>
                  <Link href={`/books/${book.id}`}>
                    <Button>Back to Book Details</Button>
                  </Link>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className={`${darkMode ? 'custom-dark-page' : ''}`}
                customTextRenderer={({ str }) => (
                  <span style={{ fontSize: `${fontSize}px` }}>{str}</span>
                )}
              />
            </Document>
          </div>
          
          {/* Page Navigation */}
          <div className={`flex justify-between p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Button 
              variant="outline"
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className={darkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
            >
              Previous Page
            </Button>
            
            <Button 
              className={darkMode ? 'bg-primary hover:bg-primary/90' : 'bg-[#E67E22] hover:bg-[#E67E22]/90'}
              onClick={() => changePage(1)}
              disabled={!numPages || pageNumber >= numPages}
            >
              Next Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
