import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { UserType } from "@/App";

type ReviewType = {
  id: number;
  bookId: number;
  userId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    displayName: string;
    profileImage?: string;
  };
};

type CommentSectionProps = {
  bookId: number;
  reviews: ReviewType[];
  currentUser: UserType | null;
  onReviewAdded: () => void;
};

export default function CommentSection({ bookId, reviews, currentUser, onReviewAdded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);
  
  // Add a new review
  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        throw new Error("You must be logged in to leave a review");
      }
      
      if (!newComment.trim()) {
        throw new Error("Please enter a comment");
      }
      
      return apiRequest('POST', `/api/books/${bookId}/reviews`, {
        userId: currentUser.id,
        rating,
        comment: newComment
      });
    },
    onSuccess: () => {
      setNewComment("");
      setRating(5);
      setError(null);
      onReviewAdded();
    },
    onError: (error) => {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred while posting your review");
      }
    },
  });
  
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReviewMutation.mutate();
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div>
      {/* Add review form */}
      {currentUser ? (
        <form onSubmit={handleReviewSubmit} className="mb-8">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.profileImage} alt={currentUser.displayName} />
              <AvatarFallback className="bg-primary text-white">
                {currentUser.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl text-[#E67E22] focus:outline-none"
                    >
                      {star <= rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>
              
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this book..."
                className="mb-2 min-h-[100px]"
              />
              
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-[#E67E22] hover:bg-[#E67E22]/90"
                  disabled={addReviewMutation.isPending}
                >
                  {addReviewMutation.isPending ? "Posting..." : "Post Review"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-center mb-4">Sign in to leave a review</p>
            <div className="flex justify-center">
              <Link href={`/login?redirect=/books/${bookId}`}>
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[#777777]">Be the first to review this book!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user?.profileImage} alt={review.user?.displayName} />
                  <AvatarFallback className="bg-primary text-white">
                    {review.user?.displayName.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <div>
                      <Link href={`/author/${review.userId}`} className="font-semibold hover:underline">
                        {review.user?.displayName || "Anonymous"}
                      </Link>
                      <div className="flex text-[#E67E22] text-sm">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {star <= review.rating ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-[#777777] sm:ml-auto">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-[#333333]">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
