import { useState } from 'react';
import { Link } from 'wouter';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserType } from '@/App';

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

type BookReaderProps = {
  book: BookType;
  author?: UserType;
  preview?: boolean;
};

export default function BookReader({ book, author, preview = false }: BookReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<string>('base'); // 'sm', 'base', 'lg', 'xl'

  // Function to handle document loading
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Function to change page
  function changePage(offset: number) {
    if (!numPages) return;
    const newPage = Math.max(1, Math.min(pageNumber + offset, numPages));
    setPageNumber(newPage);
  }

  // Handle font size changes
  const fontSizeClass = {
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl'
  }[fontSize];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Book Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 p-4 sm:p-6 border-b">
        <div className="book-cover w-24 h-36 sm:w-28 sm:h-40 rounded overflow-hidden shadow-md mr-4 mb-4 sm:mb-0">
          {book.coverImage ? (
            <img 
              src={book.coverImage} 
              alt={book.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Cover</span>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-2xl font-bold font-['Merriweather']">{book.title}</h3>
          <p className="text-[#777777] mb-2">
            By {author ? (
              <Link href={`/author/${author.id}`} className="hover:underline text-primary">
                {author.displayName}
              </Link>
            ) : 'Unknown Author'}
          </p>
          
          <div className="flex items-center mb-3">
            {/* In a real app, this would be based on real ratings */}
            <div className="flex text-[#E67E22] text-sm">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>☆</span>
            </div>
            <span className="text-xs text-[#777777] ml-1">(54 reviews)</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-[#F9F6F2] text-xs px-2 py-1 rounded-full">
              {book.category}
            </Badge>
            {book.tags?.map((tag, index) => (
              <Badge key={index} variant="outline" className="bg-[#F9F6F2] text-xs px-2 py-1 rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Reader Controls */}
      <div className="flex justify-between items-center px-4 sm:px-6 mb-6">
        <div className="flex items-center space-x-2">
          <button className="text-[#777777] p-2 hover:text-primary">
            <span className="text-lg">Aa</span>
          </button>
          
          <div className="hidden md:flex items-center space-x-1">
            <button 
              className={`text-xs ${fontSize === 'sm' ? 'bg-primary text-white' : 'bg-[#F9F6F2]'} px-2 py-1 rounded`}
              onClick={() => setFontSize('sm')}
            >
              Aa-
            </button>
            <button 
              className={`text-sm ${fontSize === 'base' ? 'bg-primary text-white' : 'bg-[#F9F6F2]'} px-2 py-1 rounded`}
              onClick={() => setFontSize('base')}
            >
              Aa
            </button>
            <button 
              className={`text-base ${fontSize === 'lg' ? 'bg-primary text-white' : 'bg-[#F9F6F2]'} px-2 py-1 rounded`}
              onClick={() => setFontSize('lg')}
            >
              Aa
            </button>
            <button 
              className={`text-lg ${fontSize === 'xl' ? 'bg-primary text-white' : 'bg-[#F9F6F2]'} px-2 py-1 rounded`}
              onClick={() => setFontSize('xl')}
            >
              Aa+
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#777777]">
            Page {pageNumber} of {numPages || (preview ? '8' : '?')}
          </span>
          <div className="flex">
            <button 
              className="text-[#777777] p-2 hover:text-primary"
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
            >
              <span>←</span>
            </button>
            <button 
              className="text-[#777777] p-2 hover:text-primary"
              onClick={() => changePage(1)}
              disabled={!numPages || pageNumber >= numPages}
            >
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Book Content Preview */}
      <div className="reader-container mx-auto px-4 sm:px-6 pb-6">
        {preview ? (
          // Sample preview content for home page
          <>
            <div className="font-['Merriweather'] text-lg font-bold mb-6 text-center">Chapter 1: The Call to Write</div>
            
            <div className={`font-['Source_Sans_Pro'] leading-relaxed mb-6 ${fontSizeClass}`}>
              <p className="mb-4">Every writer's journey begins with a single word, a moment when the world fades away and only the blank page remains. For me, that moment came on a rainy Tuesday in October, sitting at my grandmother's kitchen table with a cup of tea growing cold beside me.</p>
              
              <p className="mb-4">I had always been a reader, devouring books like they were essential nourishment. But becoming a writer? That felt like crossing an invisible boundary, stepping from the audience onto the stage. It was terrifying. Exhilarating. Necessary.</p>
              
              <p className="mb-4">The first rejection letter came three months later, a thin envelope that seemed to weigh a thousand pounds. I remember holding it, feeling the texture of the paper between my fingers, before slowly tearing it open. The words were kind but firm: "Not for us at this time."</p>
              
              <p className="mb-4">Most would-be writers quit after the first rejection, or perhaps the fifth. By my fifteenth, I had started a collection, pinning them to my office wall not as reminders of failure, but as evidence that I was truly in the arena, that I was fighting for my words to be read.</p>
              
              <p>"The world is made of stories," my grandmother once told me, "and someone needs to write them down."</p>
            </div>
            
            <div className="w-full flex justify-center mt-8">
              <Link href={`/read/${book.id}`}>
                <Button className="bg-[#E67E22] hover:bg-[#E67E22]/90 text-white font-bold px-6 py-3 rounded-lg text-center inline-flex items-center">
                  Continue Reading
                  <span className="ml-2">→</span>
                </Button>
              </Link>
            </div>
          </>
        ) : (
          // Actual PDF reader
          <div className="flex justify-center">
            <Document
              file={book.contentPath}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex justify-center p-12">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
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
                className={fontSizeClass}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
