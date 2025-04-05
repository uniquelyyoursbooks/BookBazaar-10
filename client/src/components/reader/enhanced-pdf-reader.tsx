import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Bookmark,
  MessageSquare,
  Highlighter,
  TextSelect,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Annotation, Bookmark as BookmarkType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AnnotationPanel } from "./annotation-panel";
import { BookmarkPanel } from "./bookmark-panel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface EnhancedPDFReaderProps {
  pdfUrl: string;
  bookId: number;
  hideNavigation?: boolean;
  initialPage?: number;
}

export const EnhancedPDFReader: React.FC<EnhancedPDFReaderProps> = ({ 
  pdfUrl, 
  bookId,
  hideNavigation = false,
  initialPage = 1
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("bookmarks");
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch bookmarks and annotations when component mounts or bookId changes
  useEffect(() => {
    const fetchBookmarksAndAnnotations = async () => {
      try {
        // Add user-id header for authentication
        const userId = localStorage.getItem('userId') || '1'; // Default to 1 for demo
        
        // Fetch bookmarks
        const bookmarksResponse = await apiRequest({
          method: 'GET',
          url: `/api/books/${bookId}/bookmarks`,
          headers: { 'user-id': userId }
        });
        const bookmarksData = await bookmarksResponse.json();
        
        setBookmarks(bookmarksData);
        
        // Fetch annotations
        const annotationsResponse = await apiRequest({
          method: 'GET',
          url: `/api/books/${bookId}/annotations`,
          headers: { 'user-id': userId }
        });
        const annotationsData = await annotationsResponse.json();
        
        setAnnotations(annotationsData);
      } catch (error) {
        console.error('Error fetching bookmarks and annotations:', error);
        toast({
          title: "Error",
          description: "Failed to load bookmarks and annotations",
          variant: "destructive"
        });
      }
    };
    
    fetchBookmarksAndAnnotations();
  }, [bookId, toast]);
  
  // Handle document load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    
    // If initialPage is greater than numPages, reset to page 1
    if (initialPage > numPages) {
      setPageNumber(1);
    }
  }
  
  // Navigation functions
  const goToPrevPage = () => {
    setPageNumber(prevPage => Math.max(prevPage - 1, 1));
  };
  
  const goToNextPage = () => {
    if (numPages) {
      setPageNumber(prevPage => Math.min(prevPage + 1, numPages));
    }
  };
  
  // Zoom functions
  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  
  // Rotation function
  const rotate = () => setRotation(prevRotation => (prevRotation + 90) % 360);
  
  // Annotation functions
  const handleCreateAnnotation = (annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
    toast({
      title: "Annotation created",
      description: "Your annotation has been saved",
    });
  };
  
  const handleUpdateAnnotation = (id: number, updatedAnnotation: Partial<Annotation>) => {
    setAnnotations(prev => 
      prev.map(annotation => 
        annotation.id === id 
          ? { ...annotation, ...updatedAnnotation } 
          : annotation
      )
    );
    toast({
      title: "Annotation updated",
      description: "Your changes have been saved",
    });
  };
  
  const handleDeleteAnnotation = (id: number) => {
    setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
    toast({
      title: "Annotation deleted",
      description: "Your annotation has been removed",
    });
  };
  
  // Bookmark functions
  const handleCreateBookmark = (bookmark: BookmarkType) => {
    setBookmarks(prev => [...prev, bookmark]);
    toast({
      title: "Bookmark created",
      description: "This page has been bookmarked",
    });
  };
  
  const handleUpdateBookmark = (id: number, updatedBookmark: Partial<BookmarkType>) => {
    setBookmarks(prev => 
      prev.map(bookmark => 
        bookmark.id === id 
          ? { ...bookmark, ...updatedBookmark } 
          : bookmark
      )
    );
    toast({
      title: "Bookmark updated",
      description: "Your changes have been saved",
    });
  };
  
  const handleDeleteBookmark = (id: number) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
    toast({
      title: "Bookmark deleted",
      description: "Your bookmark has been removed",
    });
  };
  
  const handleBookmarkNavigate = (pageNumber: number) => {
    setPageNumber(pageNumber);
    toast({
      title: "Navigation",
      description: `Jumped to page ${pageNumber}`,
    });
  };
  
  // Handle text selection for annotations
  const handleTextSelection = () => {
    if (!isSelecting) {
      setIsSelecting(true);
      toast({
        title: "Text selection mode",
        description: "Select text to create an annotation",
      });
      return;
    }
    
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      const selectedText = selection.toString();
      setSelectedText(selectedText);
      
      // Get offsets if possible
      const range = selection.getRangeAt(0);
      if (range) {
        setSelectionRange({
          start: range.startOffset,
          end: range.endOffset
        });
      }
      
      // Create annotation with the selected text
      const createAnnotationWithSelection = async () => {
        try {
          const userId = localStorage.getItem('userId') || '1'; // Default to 1 for demo
          
          const res = await apiRequest({
            method: 'POST',
            url: '/api/annotations',
            headers: { 'user-id': userId },
            data: {
              bookId,
              pageNumber,
              content: "Highlighted text",
              textSelection: selectedText,
              startOffset: selectionRange?.start,
              endOffset: selectionRange?.end,
              color: "#ffeb3b", // Default yellow for highlights
            }
          });
          const annotation = await res.json();
          
          setAnnotations(prev => [...prev, annotation]);
          toast({
            title: "Text highlighted",
            description: "Selected text has been annotated",
          });
        } catch (error) {
          console.error('Error creating annotation:', error);
          toast({
            title: "Error",
            description: "Failed to create annotation",
            variant: "destructive"
          });
        }
      };
      
      createAnnotationWithSelection();
      setIsSelecting(false);
      selection.removeAllRanges();
    } else {
      toast({
        title: "No text selected",
        description: "Please select some text to annotate",
        variant: "destructive"
      });
    }
  };
  
  // Get current page annotations
  const currentPageAnnotations = annotations.filter(
    annotation => annotation.pageNumber === pageNumber
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-2 border-b">
        <div className="flex items-center space-x-2">
          {!hideNavigation && (
            <>
              <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages || '?'}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={rotate} title="Rotate">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button 
            variant={isSelecting ? "secondary" : "outline"} 
            size="icon" 
            onClick={handleTextSelection} 
            title={isSelecting ? "Confirm selection" : "Highlight text"}
          >
            {isSelecting ? <Check className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
          </Button>
          <Button 
            variant={showSidebar ? "secondary" : "outline"} 
            size="icon" 
            onClick={() => setShowSidebar(!showSidebar)}
            title="Show bookmarks and annotations"
          >
            {selectedTab === "bookmarks" ? (
              <Bookmark className="h-4 w-4" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel 
            defaultSize={75} 
            minSize={30}
            className="h-full overflow-auto bg-accent/10"
          >
            <div 
              className="flex justify-center p-4 min-h-full"
              style={{ backgroundColor: "#f5f5f5" }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('Error loading PDF:', error);
                  toast({
                    title: "Error",
                    description: "Failed to load document",
                    variant: "destructive"
                  });
                }}
                className="pdf-document"
              >
                <div ref={textLayerRef} className="relative">
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="pdf-page"
                    customTextRenderer={({ str, itemIndex }) => {
                      // Here you could add custom styling for specific annotations
                      return str;
                    }}
                  />
                  
                  {/* Render highlights and annotations on top of the PDF */}
                  {currentPageAnnotations
                    .filter(annotation => annotation.textSelection)
                    .map((annotation, index) => (
                      <div
                        key={`highlight-${annotation.id}`}
                        className="absolute"
                        style={{
                          // This is a placeholder. In a real implementation, you would
                          // calculate the exact position based on text offsets
                          top: `${20 + (index * 30)}px`,
                          left: '10%',
                          right: '10%',
                          padding: '2px 4px',
                          backgroundColor: `${annotation.color}40`,
                          borderRadius: '2px',
                          zIndex: 10,
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                        title={annotation.content}
                      >
                        {annotation.textSelection}
                      </div>
                    ))}
                </div>
              </Document>
            </div>
          </ResizablePanel>
          
          {showSidebar && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel 
                defaultSize={25} 
                minSize={20}
                maxSize={40}
                className="h-full border-l"
              >
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
                  <TabsList className="grid grid-cols-2 mx-4 my-2">
                    <TabsTrigger value="bookmarks" className="flex items-center">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmarks
                    </TabsTrigger>
                    <TabsTrigger value="annotations" className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Annotations
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="bookmarks" className="flex-1 p-0 m-0">
                    <BookmarkPanel
                      bookId={bookId}
                      currentPage={pageNumber}
                      bookmarks={bookmarks}
                      onBookmarkCreate={handleCreateBookmark}
                      onBookmarkUpdate={handleUpdateBookmark}
                      onBookmarkDelete={handleDeleteBookmark}
                      onBookmarkNavigate={handleBookmarkNavigate}
                    />
                  </TabsContent>
                  <TabsContent value="annotations" className="flex-1 p-0 m-0">
                    <AnnotationPanel
                      bookId={bookId}
                      currentPage={pageNumber}
                      annotations={currentPageAnnotations}
                      onAnnotationCreate={handleCreateAnnotation}
                      onAnnotationUpdate={handleUpdateAnnotation}
                      onAnnotationDelete={handleDeleteAnnotation}
                    />
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};