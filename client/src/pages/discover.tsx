import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/ui/book-card";
import { Book, User, BOOK_CATEGORIES } from "@shared/schema";

const Discover: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(window.location.search));
  
  // Extract query parameters
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const view = searchParams.get("view") || "books";
  
  // State for search input
  const [searchQuery, setSearchQuery] = useState(query);
  
  // Get all books
  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ['/api/books'],
  });
  
  // Mock author data
  const { data: authors, isLoading: authorsLoading } = useQuery<User[]>({
    queryKey: ['/api/users?isAuthor=true'],
    queryFn: async () => {
      // Mock data for now
      return [
        { id: 1, username: "sjohnson", fullName: "Sarah Johnson", email: "sjohnson@example.com", password: "", bio: "Fiction author", isAuthor: true, createdAt: new Date() },
        { id: 2, username: "mchen", fullName: "Michael Chen", email: "mchen@example.com", password: "", bio: "Tech writer", isAuthor: true, createdAt: new Date() },
        { id: 3, username: "jthornton", fullName: "James Thornton", email: "jthornton@example.com", password: "", bio: "Mystery author", isAuthor: true, createdAt: new Date() },
        { id: 4, username: "epetrova", fullName: "Elena Petrova", email: "epetrova@example.com", password: "", bio: "Historical fiction", isAuthor: true, createdAt: new Date() }
      ];
    }
  });
  
  // Filter books based on search query and category
  const filteredBooks = books?.filter(book => {
    const matchesQuery = query ? 
      book.title.toLowerCase().includes(query.toLowerCase()) || 
      book.description.toLowerCase().includes(query.toLowerCase()) : 
      true;
    
    const matchesCategory = category && category !== "all" ? 
      book.category === category : 
      true;
    
    return matchesQuery && matchesCategory;
  });
  
  // Get author for a book
  const getAuthorForBook = (authorId: number): User | undefined => {
    return authors?.find(author => author.id === authorId);
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set("q", searchQuery);
    } else {
      newParams.delete("q");
    }
    
    setSearchParams(newParams);
    setLocation(`/discover?${newParams.toString()}`);
  };
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set("category", value);
    } else {
      newParams.delete("category");
    }
    
    setSearchParams(newParams);
    setLocation(`/discover?${newParams.toString()}`);
  };
  
  // Handle view change (books/authors)
  const handleViewChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "books") {
      newParams.set("view", value);
    } else {
      newParams.delete("view");
    }
    
    setSearchParams(newParams);
    setLocation(`/discover?${newParams.toString()}`);
  };
  
  // Book card skeleton
  const BookCardSkeleton = () => (
    <div className="flex flex-col space-y-2">
      <Skeleton className="h-64 w-full rounded-md" />
      <Skeleton className="h-6 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-1/2 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary serif">Discover Books</h1>
        <p className="text-neutral-600 mt-2">
          Find your next favorite read from our community of authors
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search books by title, description, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-neutral-400"></i>
              </div>
              <Button 
                type="submit" 
                className="absolute inset-y-0 right-0 bg-secondary hover:bg-secondary-dark"
              >
                Search
              </Button>
            </div>
          </form>
          
          <div className="w-full md:w-48">
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {BOOK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-40">
            <Select value={view} onValueChange={handleViewChange}>
              <SelectTrigger>
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="authors">Authors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Results area */}
      {view === "authors" ? (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary serif mb-6">Featured Authors</h2>
          
          {authorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : authors && authors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authors.map(author => (
                <div 
                  key={author.id} 
                  className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4"
                >
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-secondary text-white flex items-center justify-center text-2xl font-bold">
                      {author.fullName.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-primary serif truncate">{author.fullName}</h3>
                    <p className="text-sm text-neutral-600 truncate">@{author.username}</p>
                    <p className="mt-1 text-sm text-neutral-700 line-clamp-2">{author.bio || "No bio provided"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-600">No authors found matching your criteria.</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Books view */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary serif">
              {query ? `Search Results: "${query}"` : 
               category !== "all" ? `${BOOK_CATEGORIES.find(c => c.value === category)?.label} Books` : 
               "All Books"}
            </h2>
            <div className="text-sm text-neutral-600">
              {filteredBooks ? `${filteredBooks.length} ${filteredBooks.length === 1 ? 'book' : 'books'} found` : ""}
            </div>
          </div>
          
          {booksLoading || authorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredBooks && filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  author={getAuthorForBook(book.authorId)} 
                  averageRating={4.5} // Mock rating
                  reviewCount={Math.floor(Math.random() * 100) + 1} // Mock count
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-neutral-50">
              <h3 className="text-lg font-medium text-primary mb-2">No books found</h3>
              <p className="text-neutral-600 mb-6">
                {query ? `No books matching "${query}"` : 
                 category !== "all" ? `No books in the ${BOOK_CATEGORIES.find(c => c.value === category)?.label} category` : 
                 "No books available"}
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams(new URLSearchParams());
                  setLocation("/discover");
                }}
                className="bg-secondary hover:bg-secondary-dark"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Discover;
