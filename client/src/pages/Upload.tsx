import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserType } from "@/App";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload as UploadIcon } from "lucide-react";
import FileUploader from "@/components/FileUploader";

type UploadProps = {
  user: UserType;
};

export default function Upload({ user }: UploadProps) {
  const [, navigate] = useLocation();
  
  const [bookForm, setBookForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    coverImage: null as File | null,
    content: null as File | null,
    isPublished: true
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Fetch categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });
  
  // Upload book mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Validate form
      const newErrors: {[key: string]: string} = {};
      
      if (!bookForm.title.trim()) newErrors.title = 'Title is required';
      if (!bookForm.description.trim()) newErrors.description = 'Description is required';
      if (!bookForm.category) newErrors.category = 'Category is required';
      if (!bookForm.content) newErrors.content = 'Book content file is required';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error('Please fix the errors in the form');
      }
      
      const formData = new FormData();
      formData.append('title', bookForm.title);
      formData.append('description', bookForm.description);
      formData.append('category', bookForm.category);
      formData.append('authorId', user.id.toString());
      formData.append('isPublished', bookForm.isPublished.toString());
      
      if (bookForm.tags) {
        const tagsArray = bookForm.tags.split(',').map(tag => tag.trim());
        formData.append('tags', JSON.stringify(tagsArray));
      }
      
      if (bookForm.coverImage) {
        formData.append('coverImage', bookForm.coverImage);
      }
      
      if (bookForm.content) {
        formData.append('content', bookForm.content);
      }
      
      const response = await fetch('/api/books', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload book');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadStatus({ type: 'success', message: 'Book uploaded successfully!' });
      // Navigate to the book details page after a short delay
      setTimeout(() => {
        navigate(`/books/${data.id}`);
      }, 1500);
    },
    onError: (error) => {
      if (error instanceof Error) {
        setUploadStatus({ type: 'error', message: error.message });
      } else {
        setUploadStatus({ type: 'error', message: 'An unknown error occurred' });
      }
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    uploadMutation.mutate();
  };
  
  return (
    <div className="bg-[#F9F6F2] min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold font-['Merriweather'] mb-6">Upload Your Book</h1>
          
          {uploadStatus && (
            <Alert className={`mb-6 ${uploadStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadStatus.message}</AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
              <CardDescription>Fill in the information about your book</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className={errors.title ? 'text-red-500' : ''}>Book Title</Label>
                  <Input
                    id="title"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                    placeholder="Enter the title of your book"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className={errors.description ? 'text-red-500' : ''}>Description</Label>
                  <Textarea
                    id="description"
                    value={bookForm.description}
                    onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                    placeholder="Write a compelling description of your book"
                    className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
                  />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={errors.category ? 'text-red-500' : ''}>Category</Label>
                    <Select 
                      value={bookForm.category} 
                      onValueChange={(value) => setBookForm({...bookForm, category: value})}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={bookForm.tags}
                      onChange={(e) => setBookForm({...bookForm, tags: e.target.value})}
                      placeholder="fiction, mystery, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className={errors.coverImage ? 'text-red-500' : ''}>Cover Image</Label>
                  <FileUploader
                    accept="image/*"
                    onFileSelect={(file) => setBookForm({...bookForm, coverImage: file})}
                    label="Upload book cover"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className={errors.content ? 'text-red-500' : ''}>Book Content</Label>
                  <FileUploader
                    accept=".pdf,.epub,.txt"
                    onFileSelect={(file) => setBookForm({...bookForm, content: file})}
                    label="Upload book file (PDF, EPUB, or TXT)"
                  />
                  {errors.content && <p className="text-red-500 text-sm">{errors.content}</p>}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={bookForm.isPublished}
                    onCheckedChange={(checked) => setBookForm({...bookForm, isPublished: checked as boolean})}
                  />
                  <Label htmlFor="published">Publish immediately</Label>
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#E67E22] hover:bg-[#E67E22]/90"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UploadIcon className="w-5 h-5 mr-2" /> 
                        Upload Book
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
