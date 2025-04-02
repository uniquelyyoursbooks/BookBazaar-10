import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Search as SearchIcon, User } from "lucide-react";
import BookCard from "@/components/BookCard";
import AuthorCard from "@/components/AuthorCard";
import CategoryCard from "@/components/CategoryCard";
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

type AuthorType = {
  id: number;
  displayName: string;
  profileImage?: string;
  bannerImage?: string;
  bio?: string;
  category: string;
  bookCount: number;
  averageRating: number;
};

export default function Search() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("books");

  // Extract query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const query = params.get("q");
    const category = params.get("category");
    const tab = params.get("tab");
    
    if (query) setSearchQuery(query);
    if (category) setSelectedCategory(category);
    if (tab) setActiveTab(tab);
  }, [location]);

  // Fetch all books
  const { data: allBooks = [], isLoading: isLoadingBooks } = useQuery<BookType[]>({
    queryKey: ['/api/books'],
  });

  // Fetch search results if there's a query
  const { data: searchResults = [] } = useQuery<BookType[]>({
    queryKey: [`/api/books?search=${searchQuery}`],
    enabled: searchQuery.length > 0,
  });

  // Fetch books by category if a category is selected
  const { data: categoryBooks = [] } = useQuery<BookType[]>({
    queryKey: [`/api/books?category=${selectedCategory}`],
    enabled: !!selectedCategory,
  });

  // Fetch all categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch all users
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      // In a real app, there would be an API endpoint for this
      // We'll just simulate it by getting the unique author IDs from books
      const authorIds = [...new Set(allBooks.map(book => book.authorId))];
      const authorPromises = authorIds.map(id => 
        fetch(`/api/users/${id}`).then(res => res.json())
      );
      return Promise.all(authorPromises);
    },
    enabled: allBooks.length > 0,
  });

  // Transform categories into CategoryType format with counts
  const categoryData = categories.map(category => {
    const count = allBooks.filter(book => book.category === category).length;
    
    // Map categories to icons
    let icon = "book";
    if (category === "Business") icon = "briefcase";
    if (category === "Science") icon = "flask";
    if (category === "Romance") icon = "heart";
    if (category === "Mystery") icon = "ghost";
    if (category === "Biography") icon = "user";
    if (category === "Children") icon = "child";
    
    return {
      name: category,
      icon,
      count
    };
  });

  // Transform users into AuthorType with book stats
  const authors: AuthorType[] = users.map(user => {
    const authorBooks = allBooks.filter(book => book.authorId === user.id);
    const bookCount = authorBooks.length;
    
    // Calculate average rating (in a real app, this would come from reviews)
    const totalRating = authorBooks.reduce((sum, book) => {
      // Simulate ratings for demonstration
      const rating = Math.floor(Math.random() * 5) + 1;
      return sum + rating;
    }, 0);
    const averageRating = bookCount > 0 ? parseFloat((totalRating / bookCount).toFixed(1)) : 0;
    
    return {
      id: user.id,
      displayName: user.displayName,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      bio: user.bio,
      category: authorBooks.length > 0 ? authorBooks[0].category : "",
      bookCount,
      averageRating
    };
  });

  // Filter authors based on search query
  const filteredAuthors = searchQuery 
    ? authors.filter(author => 
        author.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : authors;

  // Determine which books to display
  const booksToDisplay = searchQuery 
    ? searchResults 
    : selectedCategory 
      ? categoryBooks 
      : allBooks;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search query
    window.history.pushState(
      {}, 
      "", 
      `${window.location.pathname}?q=${encodeURIComponent(searchQuery)}&tab=${activeTab}`
    );
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    // Update URL with category
    window.history.pushState(
      {}, 
      "", 
      `${window.location.pathname}?category=${encodeURIComponent(category)}&tab=${activeTab}`
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL with tab
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-[#F9F6F2] min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold font-['Merriweather'] mb-8">Search & Discover</h1>
        
        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#777777]" size={18} />
                <Input
                  type="text"
                  placeholder="Search books, authors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="bg-[#E67E22] hover:bg-[#E67E22]/90">
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Main content */}
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="books" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" /> Books
            </TabsTrigger>
            <TabsTrigger value="authors" className="flex items-center">
              <User className="mr-2 h-4 w-4" /> Authors
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center">
              <span className="mr-2">📚</span> Categories
            </TabsTrigger>
          </TabsList>
          
          {/* Books Tab */}
          <TabsContent value="books">
            {isLoadingBooks ? (
              <div className="flex justify-center p-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : booksToDisplay.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-[#777777]" />
                <h2 className="text-2xl font-bold mb-2">No Books Found</h2>
                <p className="text-[#777777] mb-4">
                  {searchQuery 
                    ? `We couldn't find any books matching "${searchQuery}".` 
                    : selectedCategory 
                      ? `No books found in the "${selectedCategory}" category.` 
                      : "There are no books available at the moment."}
                </p>
                {(searchQuery || selectedCategory) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                      window.history.pushState({}, "", window.location.pathname);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4">
                    {searchQuery 
                      ? `Search Results for "${searchQuery}"` 
                      : selectedCategory 
                        ? `Books in ${selectedCategory}` 
                        : "All Books"}
                  </h2>
                  <p className="text-[#777777]">{booksToDisplay.length} books found</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {booksToDisplay.map(book => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Authors Tab */}
          <TabsContent value="authors">
            {filteredAuthors.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-16 w-16 mx-auto mb-4 text-[#777777]" />
                <h2 className="text-2xl font-bold mb-2">No Authors Found</h2>
                <p className="text-[#777777] mb-4">
                  {searchQuery 
                    ? `We couldn't find any authors matching "${searchQuery}".` 
                    : "There are no authors available at the moment."}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      window.history.pushState({}, "", window.location.pathname);
                    }}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4">
                    {searchQuery ? `Authors matching "${searchQuery}"` : "All Authors"}
                  </h2>
                  <p className="text-[#777777]">{filteredAuthors.length} authors found</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredAuthors.map(author => (
                    <AuthorCard key={author.id} author={author} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
              <p className="text-[#777777]">Discover books in your favorite genres</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryData.map((category, index) => (
                <CategoryCard 
                  key={index} 
                  name={category.name} 
                  icon={category.icon} 
                  count={category.count}
                  onClick={() => handleCategorySelect(category.name)}
                  selected={selectedCategory === category.name}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
