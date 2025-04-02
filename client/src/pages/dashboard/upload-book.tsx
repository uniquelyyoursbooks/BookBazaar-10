import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
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
import { BOOK_CATEGORIES, insertBookSchema } from "@shared/schema";

// Extend the schema to handle file uploads
const uploadBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
  published: z.boolean().default(true),
  bookFile: z.any()
    .refine(file => file?.length > 0, "Book file is required")
    .refine(
      file => {
        if (!file || file.length === 0) return true;
        const validTypes = ["application/pdf", "application/epub+zip"];
        return validTypes.includes(file[0]?.type);
      },
      "Only PDF or EPUB files are allowed"
    )
    .refine(
      file => {
        if (!file || file.length === 0) return true;
        return file[0]?.size <= 10 * 1024 * 1024; // 10MB
      },
      "File size should be less than 10MB"
    ),
  coverImage: z.any()
    .optional()
    .refine(
      file => {
        if (!file || file.length === 0) return true;
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
        return validTypes.includes(file[0]?.type);
      },
      "Only JPG, PNG, or GIF images are allowed"
    )
    .refine(
      file => {
        if (!file || file.length === 0) return true;
        return file[0]?.size <= 2 * 1024 * 1024; // 2MB
      },
      "Image size should be less than 2MB"
    ),
});

type UploadBookFormValues = z.infer<typeof uploadBookSchema>;

const UploadBook: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Mock user ID - in a real app, this would come from auth
  const authorId = 1;
  
  // Cover image preview
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Form setup
  const form = useForm<UploadBookFormValues>({
    resolver: zodResolver(uploadBookSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "fiction",
      price: "0.00",
      published: true,
    },
  });
  
  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  };
  
  // Upload book mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/books", {
        method: "POST",
        body: data,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload book");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Book uploaded successfully",
        description: "Your book has been uploaded and is now available.",
        duration: 5000,
      });
      
      // Navigate to the book details page
      navigate(`/books/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your book. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const onSubmit = (values: UploadBookFormValues) => {
    const formData = new FormData();
    
    // Add book details
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("category", values.category);
    formData.append("price", values.price);
    formData.append("published", values.published.toString());
    formData.append("authorId", authorId.toString());
    
    // Add book file
    if (values.bookFile?.[0]) {
      formData.append("bookFile", values.bookFile[0]);
    }
    
    // Add cover image if available
    if (values.coverImage?.[0]) {
      formData.append("coverImage", values.coverImage[0]);
    }
    
    // Submit the form
    uploadMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary serif">Upload a New Book</h1>
        <p className="text-neutral-600 mt-2">
          Share your story with the world. Upload your book in PDF or EPUB format.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
          <CardDescription>
            Provide information about your book to help readers discover it
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
                        <FormDescription>
                          A clear, descriptive title helps readers find your book
                        </FormDescription>
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
                        <FormDescription>
                          Write a compelling description that will make readers want to read your book
                        </FormDescription>
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
                      <FormDescription>
                        Choose the category that best fits your book
                      </FormDescription>
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
                      <FormDescription>
                        Set to 0.00 for free. Maximum price is $100.00
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bookFile"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Book File (PDF or EPUB)</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.epub"
                            onChange={(e) => {
                              onChange(e.target.files);
                            }}
                            {...fieldProps}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload your book file (max size: 10MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Cover Image (optional)</FormLabel>
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
                          Upload a cover image (max size: 2MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Now</FormLabel>
                        <FormDescription>
                          Make your book visible to all users immediately
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

              <div className="flex justify-end space-x-4">
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
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    "Upload Book"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadBook;
