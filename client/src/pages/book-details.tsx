import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Book, User, Review, InsertReview } from "@shared/schema";
import StarRating from "@/components/ui/star-rating";
import { formatDate, getCategoryLabel, calculateAverageRating, getBookCoverUrl } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bookId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // User state - in a real app, this would come from auth context
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Review form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  
  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !isNaN(bookId)
  });
  
  // Fetch book author
  const { data: author, isLoading: authorLoading } = useQuery<User>({
    queryKey: [`/api/users/${book?.authorId}`],
    enabled: !!book?.authorId,
    queryFn: async () => {
      // Mock author data for now
      return {
        id: book!.authorId,
        username: "author",
        password: "",
        email: "author@example.com",
        fullName: "Book Author",
        bio: "This is a sample author bio.",
        isAuthor: true,
        createdAt: new Date()
      };
    }
  });
  
  // Fetch book reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/books/${bookId}/reviews`],
    enabled: !isNaN(bookId)
  });
  
  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: InsertReview) => {
      return await apiRequest('POST', '/api/reviews', reviewData);
    },
    onSuccess: () => {
      // Invalidate the reviews query to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/reviews`] });
      
      // Reset the form
      setReviewComment("");
      setReviewRating(5);
      
      // Show success toast
      toast({
        title: "Review submitted",
        description: "Thank you for sharing your thoughts on this book!",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
        duration: 3000
      });
      console.error("Failed to submit review:", error);
    }
  });
  
  // Handle review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we would get user ID from auth
    const tempUserId = 1; // Mock user ID
    
    submitReviewMutation.mutate({
      bookId,
      userId: tempUserId,
      rating: reviewRating,
      comment: reviewComment
    });
  };
  
  // Calculate average rating
  const averageRating = reviews ? calculateAverageRating(reviews) : 0;
  
  // Loading states
  if (bookLoading || authorLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-md" />
            <Skeleton className="h-6 w-1/2 rounded-md" />
            <Skeleton className="h-6 w-1/4 rounded-md" />
            <div className="pt-4">
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
            <div className="flex space-x-4 pt-4">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500">Book not found</h1>
        <p className="mt-4 text-neutral-600">The book you're looking for doesn't exist or has been removed.</p>
        <Link href="/discover">
          <Button className="mt-6 bg-secondary hover:bg-secondary-dark text-white">
            Discover Books
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Book Cover and Info */}
        <div className="md:col-span-1">
          <div className="shadow-book rounded-lg overflow-hidden">
            <img 
              src={getBookCoverUrl(book)} 
              alt={`Cover for ${book.title}`} 
              className="w-full object-cover"
            />
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-700">Category</h3>
              <p className="mt-1">{getCategoryLabel(book.category)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-700">Published</h3>
              <p className="mt-1">{formatDate(book.createdAt)}</p>
            </div>
            
            {author && (
              <div>
                <h3 className="text-sm font-medium text-neutral-700">Author</h3>
                <p className="mt-1">{author.fullName}</p>
                {author.bio && (
                  <p className="mt-1 text-sm text-neutral-600">{author.bio}</p>
                )}
              </div>
            )}
            
            <div className="pt-4">
              <h3 className="text-sm font-medium text-neutral-700">Price</h3>
              <p className="mt-1 text-xl font-semibold text-secondary">
                {book.price === "0.00" ? "Free" : `$${book.price}`}
              </p>
            </div>
          </div>
        </div>
        
        {/* Book Details and Actions */}
        <div className="md:col-span-2">
          <div className="flex flex-col space-y-2 mb-6">
            <h1 className="text-3xl font-bold text-primary serif">{book.title}</h1>
            <div className="flex items-center">
              <StarRating rating={averageRating} showCount={true} count={reviews?.length || 0} />
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary serif mb-2">Description</h2>
            <p className="text-neutral-700 whitespace-pre-line">{book.description}</p>
          </div>
          
          <div className="flex space-x-4 mb-8">
            <Link href={`/read/${book.id}`}>
              <Button className="bg-secondary hover:bg-secondary-dark text-white">
                Read Now
              </Button>
            </Link>
            
            <Button variant="outline">
              <i className="far fa-bookmark mr-2"></i> Save for Later
            </Button>
          </div>
          
          {/* Tabs for Reviews and Similar Books */}
          <Tabs defaultValue="reviews" className="mt-8">
            <TabsList>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="similar">Similar Books</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-primary serif">Reader Reviews</h2>
                
                {/* Write a review form */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Share your thoughts</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Your Rating
                        </label>
                        <StarRating 
                          rating={reviewRating} 
                          size="lg"
                          interactive 
                          onChange={setReviewRating} 
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="review-text" className="block text-sm font-medium text-neutral-700 mb-2">
                          Your Review
                        </label>
                        <Textarea
                          id="review-text"
                          placeholder="What did you think about this book?"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          className="w-full"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="bg-secondary hover:bg-secondary-dark text-white"
                        disabled={submitReviewMutation.isPending}
                      >
                        {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* List of reviews */}
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-6 space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-1/5" />
                          </div>
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6 space-y-2">
                          <div className="flex justify-between">
                            <StarRating rating={review.rating} />
                            <span className="text-sm text-neutral-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <h4 className="font-medium text-neutral-800">
                            Reader {review.userId}
                          </h4>
                          <p className="text-neutral-600">
                            {review.comment || "No comment provided."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-neutral-600">
                        No reviews yet. Be the first to share your thoughts!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="similar" className="pt-6">
              <h2 className="text-xl font-semibold text-primary serif mb-4">Similar Books</h2>
              <p className="text-neutral-600">
                Discover more books in the {getCategoryLabel(book.category)} category.
              </p>
              <div className="mt-4 text-center">
                <Link href={`/discover?category=${book.category}`}>
                  <Button variant="secondary" className="text-white">
                    Browse {getCategoryLabel(book.category)} Books
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
