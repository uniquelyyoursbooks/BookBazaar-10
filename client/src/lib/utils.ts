import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Book, Review, User } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
}

export function getCategoryLabel(category: string): string {
  const categories: Record<string, string> = {
    fiction: "Fiction",
    non_fiction: "Non-Fiction",
    mystery: "Mystery",
    thriller: "Thriller",
    fantasy: "Fantasy",
    science_fiction: "Science Fiction",
    romance: "Romance",
    poetry: "Poetry",
    biography: "Biography",
    historical: "Historical",
    self_help: "Self Help",
    technical: "Technical",
    other: "Other"
  };
  
  return categories[category] || "Other";
}

export function getAuthorDisplayName(author: User | undefined): string {
  if (!author) return "Unknown Author";
  return author.fullName || author.username;
}

export function calculateReadingProgress(currentPage: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  const percentage = (currentPage / totalPages) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}

export function getBookCoverUrl(book: Book): string {
  if (!book.coverImage) {
    // Return a placeholder book cover if no cover image exists
    return `https://placehold.co/320x480/e2e8f0/1a202c?text=${encodeURIComponent(book.title)}`;
  }
  
  // Extract the userId and filename from the filePath
  const pathParts = book.coverImage.split('/');
  const userId = pathParts[pathParts.length - 2];
  const filename = pathParts[pathParts.length - 1];
  
  return `/uploads/${userId}/${filename}`;
}
