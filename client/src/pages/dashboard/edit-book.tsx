import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { BOOK_CATEGORIES, Book } from "@shared/schema";
import { getBookCoverUrl } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Users, FileEdit } from "lucide-react";
import { CollaborationPanel } from "@/components/collaboration";

// Edit book schema
const editBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
  published: z.boolean().default(true),
  coverImage: z.any().optional(),
});

type EditBookFormValues = z.infer<typeof editBookSchema>;

const EditBook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bookId = parseInt(id);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Collaboration panel state
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  
  // Cover image preview
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !isNaN(bookId)
  });
  
  // Form setup
  const form = useForm<EditBookFormValues>({
    resolver: zodResolver(editBookSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "fiction",
      price: "0.00",
      published: true,
    },
  });
  
  // Update form values when book data is loaded
  useEffect(() => {
    if (book) {
      form.reset({
        title: book.title,
        description: book.description,
        category: book.category,
        price: book.price,
        published: book.published,
      });
      
      if (book.coverImage) {
        setCoverPreview(getBookCoverUrl(book));
      }
    }
  }, [book, form.reset]);
  
  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };
  
  // Update book mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Book>) => {
      return await apiRequest({
        method: "PUT", 
        url: `/api/books/${bookId}`, 
        data
      });
    },
    onSuccess: () => {
      // Invalidate the book query to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}`] });
      
      toast({
        title: "Book updated",
        description: "Your book has been updated successfully.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your book. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  // Upload cover image mutation
  const uploadCoverMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/books/${bookId}/cover`, {
        method: "POST",
        body: data,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload cover image");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the book query to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}`] });
      
      toast({
        title: "Cover updated",
        description: "Your book cover has been updated successfully.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cover upload failed",
        description: error.message || "There was an error uploading the cover image. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  // Delete book mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest({
        method: "DELETE", 
        url: `/api/books/${bookId}`
      });
    },
    onSuccess: () => {
      // Invalidate the author's books query
      queryClient.invalidateQueries({ queryKey: ['/api/books/author'] });
      
      toast({
        title: "Book deleted",
        description: "Your book has been deleted permanently.",
        duration: 3000,
      });
      
      // Navigate back to dashboard
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting your book. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const onSubmit = async (values: EditBookFormValues) => {
    // First update the book details
    await updateMutation.mutateAsync({
      title: values.title,
      description: values.description,
      category: values.category as "fiction" | "non_fiction" | "mystery" | "thriller" | "fantasy" | "science_fiction" | "romance" | "poetry" | "biography" | "historical" | "self_help" | "technical" | "other",
      price: values.price,
      published: values.published,
    });
    
    // Then upload the cover image if a new one was selected
    if (values.coverImage?.[0]) {
      const formData = new FormData();
      formData.append("coverImage", values.coverImage[0]);
      await uploadCoverMutation.mutateAsync(formData);
    }
  };

  // Loading state
  if (bookLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Book not found</h1>
          <p className="mt-4 text-neutral-600">The book you're trying to edit doesn't exist or has been removed.</p>
          <Button 
            className="mt-6 bg-secondary hover:bg-secondary-dark"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary serif">Edit Book</h1>
        <p className="text-neutral-600 mt-2">
          Update your book's details and settings
        </p>
      </div>

      {/* Book Chapters Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Book Chapters</CardTitle>
            <CardDescription>
              Manage and edit your book's chapters
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCollaborationOpen(true)}
            className="gap-1"
          >
            <Users className="h-4 w-4" />
            Collaborators
          </Button>
        </CardHeader>
        <CardContent>
          {bookLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : book?.outline && book.outline.chapters && book.outline.chapters.length > 0 ? (
            <div className="space-y-2">
              {book.outline.chapters.map((chapter, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent">
                  <div className="font-medium">{chapter.title || `Chapter ${index + 1}`}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/edit/${bookId}/chapter/${index + 1}`)}
                    className="gap-1"
                  >
                    <FileEdit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No chapters found. Add chapters to your book to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Book Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
          <CardDescription>
            Make changes to your book's information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Book Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your book title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Book Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a compelling description of your book"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BOOK_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                            $
                          </span>
                          <Input placeholder="0.00" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Cover Image</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              onChange(e.target.files);
                              handleCoverChange(e);
                            }}
                            {...fieldProps}
                          />
                          {coverPreview && (
                            <div className="mt-2 relative w-32 h-48 overflow-hidden rounded-md border border-neutral-200">
                              <img
                                src={coverPreview}
                                alt="Cover preview"
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload a new cover image, or leave empty to keep the current one
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published</FormLabel>
                        <FormDescription>
                          Toggle to make your book visible or invisible to readers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      Delete Book
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        book and remove all associated data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-secondary hover:bg-secondary-dark"
                    disabled={updateMutation.isPending || uploadCoverMutation.isPending}
                  >
                    {(updateMutation.isPending || uploadCoverMutation.isPending) ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Collaboration panel (slide-in) */}
      {collaborationOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-background border-l shadow-lg transform transition-transform">
          <CollaborationPanel
            isOpen={collaborationOpen} 
            onClose={() => setCollaborationOpen(false)}
            bookId={bookId}
            userId={(book?.authorId) || 0}
            isOwner={true}
          />
        </div>
      )}
    </div>
  );
};

export default EditBook;
