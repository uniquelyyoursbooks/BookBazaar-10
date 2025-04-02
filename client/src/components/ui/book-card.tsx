import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, truncateText, getBookCoverUrl } from "@/lib/utils";
import { Book, User } from "@shared/schema";
import { Link } from "wouter";
import StarRating from "./star-rating";

interface BookCardProps {
  book: Book;
  author?: User;
  averageRating?: number;
  reviewCount?: number;
  className?: string;
  showPreview?: boolean;
  onPreviewClick?: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  author,
  averageRating = 0,
  reviewCount = 0,
  className,
  showPreview = true,
  onPreviewClick
}) => {
  return (
    <Card className={cn("group relative shadow-book rounded-lg overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg", className)}>
      <div className="aspect-w-3 aspect-h-4 bg-neutral-200 group-hover:opacity-75">
        <Link href={`/books/${book.id}`}>
          <img 
            src={getBookCoverUrl(book)} 
            alt={`Cover for ${book.title}`} 
            className="w-full h-64 object-cover cursor-pointer"
          />
        </Link>
      </div>
      <CardContent className="p-4 book-spine">
        <Link href={`/books/${book.id}`}>
          <h3 className="text-lg font-medium text-primary serif cursor-pointer hover:text-secondary">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-neutral-600">
          by {author ? author.fullName : "Unknown Author"}
        </p>
        
        <div className="mt-2 flex items-center">
          <StarRating rating={averageRating} showCount={true} count={reviewCount} />
        </div>
        
        <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
          {truncateText(book.description, 100)}
        </p>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-secondary font-medium">
            {book.price === "0.00" ? "Free" : `$${book.price}`}
          </span>
          
          {showPreview && (
            <button 
              className="px-3 py-1 rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors text-sm"
              onClick={() => onPreviewClick ? onPreviewClick(book) : window.location.href = `/read/${book.id}`}
            >
              Preview
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
