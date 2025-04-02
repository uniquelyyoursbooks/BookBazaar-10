import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { UserType } from "@/App";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import CommentSection from "@/components/CommentSection";
import BookCard from "@/components/BookCard";
import { apiRequest } from "@/lib/queryClient";

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

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const bookId = parseInt(id);

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

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

  // Fetch reviews
  const { data: reviews = [] } = useQuery<ReviewType[]>({
    queryKey: [`/api/books/${bookId}/reviews`],
    enabled: !isNaN(bookId),
  });

  // Fetch related books by the same author
  const { data: relatedBooks = [] } = useQuery<BookType[]>({
    queryKey: [`/api/books?author=${book?.authorId}`],
    enabled: !!book?.authorId,
  });

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

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
    <div className="bg-[#F9F6F2] min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-4">
        {/* Book header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/4 flex justify-center mb-6 md:mb-0">
              <div className="w-48 h-72 rounded shadow-lg overflow-hidden">
                {book.coverImage ? (
                  <img 
                    src={book.coverImage} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Cover</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-3/4 md:pl-8">
              <h1 className="text-3xl font-bold font-['Merriweather'] mb-2">{book.title}</h1>
              
              <div className="mb-4">
                {author ? (
                  <Link href={`/author/${author.id}`} className="text-primary hover:underline">
                    by {author.displayName}
                  </Link>
                ) : (
                  <span className="text-[#777777]">by Unknown Author</span>
                )}
              </div>
              
              <div className="flex items-center mb-4">
                <div className="flex text-[#E67E22]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-lg">
                      {star <= Math.round(averageRating) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-[#777777]">({reviews.length} reviews)</span>
              </div>
              
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-[#F9F6F2] text-[#333333]">{book.category}</Badge>
                {book.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-[#F9F6F2] text-[#777777]">{tag}</Badge>
                ))}
              </div>
              
              <p className="mb-6 text-[#333333] leading-relaxed">{book.description}</p>
              
              <div className="flex flex-wrap gap-3">
                <Link href={`/read/${book.id}`}>
                  <Button className="bg-[#E67E22] hover:bg-[#E67E22]/90">
                    Read Now
                  </Button>
                </Link>
                
                {currentUser && currentUser.id === book.authorId && (
                  <Link href={`/dashboard?edit=${book.id}`}>
                    <Button variant="outline">
                      Edit Book
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Reviews and Comments */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold font-['Merriweather'] mb-6">Reader Reviews</h2>
          
          <CommentSection 
            bookId={book.id} 
            reviews={reviews} 
            currentUser={currentUser}
            onReviewAdded={() => {
              // Invalidate the reviews query to refresh the data
              queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/reviews`] });
            }}
          />
        </div>
        
        {/* More by this author */}
        {relatedBooks.length > 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold font-['Merriweather'] mb-6">More by {author?.displayName || 'this author'}</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {relatedBooks
                .filter(relatedBook => relatedBook.id !== book.id)
                .slice(0, 5)
                .map(relatedBook => (
                  <BookCard key={relatedBook.id} book={relatedBook} />
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
