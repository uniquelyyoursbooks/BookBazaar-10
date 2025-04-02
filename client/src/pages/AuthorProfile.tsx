import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { UserType } from "@/App";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookCard from "@/components/BookCard";

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

export default function AuthorProfile() {
  const { id } = useParams<{ id: string }>();
  const authorId = parseInt(id);

  // Fetch author details
  const { data: author, isLoading: isLoadingAuthor } = useQuery<UserType>({
    queryKey: [`/api/users/${authorId}`],
    enabled: !isNaN(authorId),
  });

  // Fetch author's books
  const { data: books = [] } = useQuery<BookType[]>({
    queryKey: [`/api/books?author=${authorId}`],
    enabled: !isNaN(authorId),
  });

  if (isLoadingAuthor) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Author Not Found</h2>
          <p className="mb-6 text-[#777777]">The author you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Group books by category
  const booksByCategory: Record<string, BookType[]> = {};
  books.forEach(book => {
    if (!booksByCategory[book.category]) {
      booksByCategory[book.category] = [];
    }
    booksByCategory[book.category].push(book);
  });

  return (
    <div className="bg-[#F9F6F2] min-h-screen">
      {/* Author Banner */}
      <div className="w-full h-48 md:h-64 bg-primary bg-opacity-10 relative overflow-hidden">
        {author.bannerImage ? (
          <img 
            src={author.bannerImage} 
            alt={`${author.displayName}'s banner`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/30 to-primary/10"></div>
        )}
      </div>
      
      <div className="container mx-auto px-4 relative">
        {/* Author Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 -mt-16 mb-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex flex-col items-center md:items-start md:flex-row mb-6 md:mb-0">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white overflow-hidden mb-4 md:mb-0 md:mr-6">
                {author.profileImage ? (
                  <img 
                    src={author.profileImage} 
                    alt={author.displayName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                    {author.displayName.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold font-['Merriweather'] mb-1">{author.displayName}</h1>
                <p className="text-[#777777] mb-2">@{author.username}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <span className="bg-[#F9F6F2] text-xs px-2 py-1 rounded-full">{books.length} Books</span>
                  <span className="bg-[#F9F6F2] text-xs px-2 py-1 rounded-full">
                    {books.length > 0 
                      ? (books.reduce((sum, book) => sum + (Math.floor(Math.random() * 5) + 1), 0) / books.length).toFixed(1) 
                      : '0'} Avg Rating
                  </span>
                </div>
              </div>
            </div>
            
            <div className="md:ml-auto flex flex-col sm:flex-row gap-3 justify-center md:justify-end">
              <Button variant="outline" className="flex-1 sm:flex-none">
                <span className="mr-2">👋</span> Follow
              </Button>
              <Button variant="default" className="flex-1 sm:flex-none bg-[#E67E22] hover:bg-[#E67E22]/90">
                Message
              </Button>
            </div>
          </div>
          
          {author.bio && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-lg font-bold mb-2">About</h2>
              <p className="text-[#333333]">{author.bio}</p>
            </div>
          )}
        </div>
        
        {/* Author's Books */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold font-['Merriweather'] mb-6">Books by {author.displayName}</h2>
          
          {books.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#777777] mb-4">This author hasn't published any books yet.</p>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Books</TabsTrigger>
                {Object.keys(booksByCategory).map(category => (
                  <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="all">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {books.map(book => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </TabsContent>
              
              {Object.entries(booksByCategory).map(([category, categoryBooks]) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {categoryBooks.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
