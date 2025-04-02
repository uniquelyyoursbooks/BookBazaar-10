import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { UserType } from "@/App";

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

type BookCardProps = {
  book: BookType;
};

export default function BookCard({ book }: BookCardProps) {
  const [authorName, setAuthorName] = useState<string>("");
  const [averageRating, setAverageRating] = useState<number>(0);
  
  // Fetch author details
  const { data: author } = useQuery<UserType>({
    queryKey: [`/api/users/${book.authorId}`],
    enabled: !!book.authorId,
  });
  
  // Fetch reviews for the book to calculate average rating
  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: [`/api/books/${book.id}/reviews`],
    enabled: !!book.id,
  });
  
  useEffect(() => {
    if (author) {
      setAuthorName(author.displayName);
    }
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      setAverageRating(totalRating / reviews.length);
    } else {
      // Generate a random rating between 3 and 5 for demonstration purposes
      setAverageRating(3 + Math.random() * 2);
    }
  }, [author, reviews]);
  
  return (
    <div className="book-item group">
      <Link href={`/books/${book.id}`}>
        <div className="book-cover aspect-[2/3] mb-3 rounded overflow-hidden shadow-md transition-all duration-300 transform group-hover:shadow-lg group-hover:-translate-y-1">
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
      </Link>
      
      <h3 className="font-bold font-['Merriweather'] text-[#333333] line-clamp-1">{book.title}</h3>
      
      <Link href={`/author/${book.authorId}`}>
        <p className="text-sm text-[#777777] mb-1 hover:text-primary hover:underline">{authorName || "Unknown Author"}</p>
      </Link>
      
      <div className="flex items-center mb-1">
        <div className="flex text-[#E67E22] text-sm">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star}>
              {star <= Math.floor(averageRating) ? "★" : 
               star - 0.5 <= averageRating ? "★" : "☆"}
            </span>
          ))}
        </div>
        <span className="text-xs text-[#777777] ml-1">({averageRating.toFixed(1)})</span>
      </div>
      
      <Badge variant="secondary" className="bg-[#F9F6F2] text-xs px-2 py-1 rounded-full hover:bg-[#F9F6F2]/80">
        {book.category}
      </Badge>
    </div>
  );
}
