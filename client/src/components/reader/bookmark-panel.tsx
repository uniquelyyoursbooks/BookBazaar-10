import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Bookmark } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Pencil, 
  Trash, 
  Save, 
  X, 
  Plus, 
  BookmarkIcon,
  Search,
  ArrowUpRight
} from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface BookmarkPanelProps {
  bookId: number;
  currentPage: number;
  bookmarks: Bookmark[];
  onBookmarkCreate: (bookmark: Bookmark) => void;
  onBookmarkUpdate: (id: number, bookmark: Partial<Bookmark>) => void;
  onBookmarkDelete: (id: number) => void;
  onBookmarkNavigate: (pageNumber: number) => void;
}

export const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  bookId,
  currentPage,
  bookmarks,
  onBookmarkCreate,
  onBookmarkUpdate,
  onBookmarkDelete,
  onBookmarkNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newBookmark, setNewBookmark] = useState<Partial<Bookmark> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState({
    title: '',
    description: ''
  });
  const [selectedColor, setSelectedColor] = useState("#3498db"); // Default blue

  // Filter bookmarks based on search query
  const filteredBookmarks = searchQuery 
    ? bookmarks.filter(b => 
        (b.title && b.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : bookmarks;

  const handleCreateBookmark = async () => {
    try {
      const res = await apiRequest({
        method: 'POST',
        url: '/api/bookmarks',
        data: {
          ...newBookmark,
          bookId,
          pageNumber: currentPage,
          color: selectedColor,
        }
      });
      const bookmark = await res.json();

      onBookmarkCreate(bookmark);
      setNewBookmark(null);
    } catch (error) {
      console.error('Error creating bookmark:', error);
    }
  };

  const handleUpdateBookmark = async (id: number) => {
    try {
      const res = await apiRequest({
        method: 'PUT',
        url: `/api/bookmarks/${id}`,
        data: { 
          title: editContent.title,
          description: editContent.description
        }
      });
      const updatedBookmark = await res.json();

      onBookmarkUpdate(id, updatedBookmark);
      setEditingId(null);
      setEditContent({ title: '', description: '' });
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const handleDeleteBookmark = async (id: number) => {
    try {
      await apiRequest({
        method: 'DELETE',
        url: `/api/bookmarks/${id}`
      });

      onBookmarkDelete(id);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const startEditing = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditContent({ 
      title: bookmark.title || '', 
      description: bookmark.description || '' 
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent({ title: '', description: '' });
  };

  const colorOptions = [
    { value: "#3498db", name: "Blue" },
    { value: "#e74c3c", name: "Red" },
    { value: "#2ecc71", name: "Green" },
    { value: "#f39c12", name: "Orange" },
    { value: "#9b59b6", name: "Purple" }
  ];

  const getCurrentPageBookmark = () => {
    return bookmarks.find(bookmark => bookmark.pageNumber === currentPage);
  };

  const currentPageBookmark = getCurrentPageBookmark();

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <div className="flex items-center mb-2">
          <BookmarkIcon className="mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">Bookmarks</h3>
        </div>
        
        <div className="flex items-center mb-2 relative">
          <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {/* Create new bookmark button, only show if no bookmark exists for current page */}
        {!currentPageBookmark && !newBookmark ? (
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={() => setNewBookmark({ bookId, pageNumber: currentPage })}
          >
            <Plus className="mr-2 h-4 w-4" /> Bookmark Current Page
          </Button>
        ) : newBookmark ? (
          <Card className="p-3 mb-2">
            <Input
              value={newBookmark.title || ''}
              onChange={(e) => setNewBookmark({...newBookmark, title: e.target.value})}
              placeholder="Bookmark title (optional)"
              className="mb-2"
            />
            
            <Textarea
              value={newBookmark.description || ''}
              onChange={(e) => setNewBookmark({...newBookmark, description: e.target.value})}
              placeholder="Add notes for this bookmark (optional)"
              className="mb-2 min-h-[80px]"
            />
            
            <div className="flex items-center mb-2">
              <span className="mr-2 text-sm">Color:</span>
              <div className="flex space-x-1">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-5 h-5 rounded-full border",
                      selectedColor === color.value && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setNewBookmark(null)}
              >
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleCreateBookmark}
              >
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </div>
          </Card>
        ) : null}
        
        {/* If there's a bookmark for the current page, show it */}
        {currentPageBookmark && !newBookmark && (
          <Card className="p-3 mb-2 border-2" style={{ borderColor: currentPageBookmark.color }}>
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium">
                {currentPageBookmark.title || `Page ${currentPageBookmark.pageNumber}`}
              </h4>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => startEditing(currentPageBookmark)}
                  className="h-7 w-7"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteBookmark(currentPageBookmark.id)}
                  className="h-7 w-7 text-destructive"
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {currentPageBookmark.description && (
              <p className="text-sm text-muted-foreground">{currentPageBookmark.description}</p>
            )}
          </Card>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-2">
        {filteredBookmarks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? "No bookmarks match your search" : "No bookmarks yet"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map(bookmark => {
              // Skip the current page bookmark since we already show it above
              if (bookmark.pageNumber === currentPage) return null;
              
              return (
                <div 
                  key={bookmark.id} 
                  className="p-2 border rounded-md hover:bg-accent/50 transition-colors"
                  style={{ borderLeft: `4px solid ${bookmark.color}` }}
                >
                  {editingId === bookmark.id ? (
                    <>
                      <Input
                        value={editContent.title}
                        onChange={(e) => setEditContent({...editContent, title: e.target.value})}
                        placeholder="Bookmark title"
                        className="mb-2"
                      />
                      <Textarea
                        value={editContent.description}
                        onChange={(e) => setEditContent({...editContent, description: e.target.value})}
                        placeholder="Description (optional)"
                        className="mb-2"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={cancelEditing}>
                          <X className="mr-1 h-4 w-4" /> Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateBookmark(bookmark.id)}
                        >
                          <Save className="mr-1 h-4 w-4" /> Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <button
                          className="flex items-start text-left group"
                          onClick={() => onBookmarkNavigate(bookmark.pageNumber)}
                        >
                          <div>
                            <h4 className="font-medium group-hover:underline">
                              {bookmark.title || `Page ${bookmark.pageNumber}`}
                            </h4>
                            {bookmark.description && (
                              <p className="text-sm text-muted-foreground">{bookmark.description}</p>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              Page {bookmark.pageNumber}
                            </div>
                          </div>
                          <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        
                        <div className="flex space-x-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => startEditing(bookmark)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="h-7 w-7 text-destructive"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};