import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Annotation, Book } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Pencil, 
  Trash, 
  Save, 
  X, 
  Plus, 
  MessageSquare,
  Search
} from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AnnotationPanelProps {
  bookId: number;
  currentPage: number;
  annotations: Annotation[];
  onAnnotationCreate: (annotation: Annotation) => void;
  onAnnotationUpdate: (id: number, annotation: Partial<Annotation>) => void;
  onAnnotationDelete: (id: number) => void;
}

export const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  bookId,
  currentPage,
  annotations,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newAnnotation, setNewAnnotation] = useState<Partial<Annotation> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [highlightColor, setHighlightColor] = useState("#ffeb3b"); // Default yellow

  // Filter annotations based on search query
  const filteredAnnotations = searchQuery 
    ? annotations.filter(a => 
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (a.textSelection && a.textSelection.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : annotations;

  const handleCreateAnnotation = async () => {
    if (!newAnnotation?.content) return;

    try {
      const res = await apiRequest({
        method: 'POST',
        url: '/api/annotations',
        data: {
          ...newAnnotation,
          bookId,
          pageNumber: currentPage,
          color: highlightColor,
        }
      });
      const annotation = await res.json();

      onAnnotationCreate(annotation);
      setNewAnnotation(null);
    } catch (error) {
      console.error('Error creating annotation:', error);
    }
  };

  const handleUpdateAnnotation = async (id: number) => {
    if (!editContent) return;

    try {
      const res = await apiRequest({
        method: 'PUT',
        url: `/api/annotations/${id}`,
        data: { content: editContent }
      });
      const updatedAnnotation = await res.json();

      onAnnotationUpdate(id, updatedAnnotation);
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating annotation:', error);
    }
  };

  const handleDeleteAnnotation = async (id: number) => {
    try {
      await apiRequest({
        method: 'DELETE',
        url: `/api/annotations/${id}`
      });

      onAnnotationDelete(id);
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  };

  const startEditing = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditContent(annotation.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const colorOptions = [
    { value: "#ffeb3b", name: "Yellow" },
    { value: "#4caf50", name: "Green" },
    { value: "#2196f3", name: "Blue" },
    { value: "#f44336", name: "Red" },
    { value: "#9c27b0", name: "Purple" }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <div className="flex items-center mb-2">
          <MessageSquare className="mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">Annotations</h3>
        </div>
        
        <div className="flex items-center mb-2 relative">
          <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search annotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {/* Create new annotation button */}
        {!newAnnotation ? (
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={() => setNewAnnotation({ bookId, pageNumber: currentPage })}
          >
            <Plus className="mr-2 h-4 w-4" /> New Annotation
          </Button>
        ) : (
          <div className="p-2 border rounded-md mb-2">
            <Textarea
              value={newAnnotation.content || ''}
              onChange={(e) => setNewAnnotation({...newAnnotation, content: e.target.value})}
              placeholder="Enter your thoughts here..."
              className="mb-2"
            />
            
            <div className="flex items-center mb-2">
              <span className="mr-2 text-sm">Highlight color:</span>
              <div className="flex space-x-1">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-5 h-5 rounded-full border",
                      highlightColor === color.value && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setHighlightColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setNewAnnotation(null)}
              >
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleCreateAnnotation}
                disabled={!newAnnotation.content}
              >
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-2">
        {filteredAnnotations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? "No annotations match your search" : "No annotations for this page"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnotations.map(annotation => (
              <div 
                key={annotation.id} 
                className="p-2 border rounded-md"
              >
                {editingId === annotation.id ? (
                  <>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="mr-1 h-4 w-4" /> Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateAnnotation(annotation.id)}
                        disabled={!editContent}
                      >
                        <Save className="mr-1 h-4 w-4" /> Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {annotation.textSelection && (
                      <div className="mb-2 p-2 rounded-sm text-sm italic" style={{ backgroundColor: annotation.color + '40' }}>
                        "{annotation.textSelection}"
                      </div>
                    )}
                    <p className="text-sm mb-2">{annotation.content}</p>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" style={{ backgroundColor: annotation.color + '20', borderColor: annotation.color }}>
                        Page {annotation.pageNumber}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => startEditing(annotation)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteAnnotation(annotation.id)}
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};