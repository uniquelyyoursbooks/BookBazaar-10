import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import BookCard from "@/components/BookCard";
import CategoryCard from "@/components/CategoryCard";
import AuthorCard from "@/components/AuthorCard";
import BookReader from "@/components/BookReader";
import { Button } from "@/components/ui/button";
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
  authorName?: string;
  averageRating?: number;
};

type CategoryType = {
  name: string;
  icon: string;
  count: number;
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

export default function Home() {
  // Fetch featured books
  const { data: books = [] } = useQuery<BookType[]>({
    queryKey: ['/api/books'],
  });

  // Fetch book categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch featured authors - we'll get users and enrich them with book data
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      // In a real app, there would be an API endpoint for this
      // For now, we'll just return the first 3 authors from our featured books
      const authorIds = [...new Set(books.map(book => book.authorId))];
      const authorPromises = authorIds.slice(0, 3).map(id => 
        fetch(`/api/users/${id}`).then(res => res.json())
      );
      return Promise.all(authorPromises);
    },
    enabled: books.length > 0,
  });

  // Transform categories into the CategoryType format with counts
  const categoryData: CategoryType[] = categories.map(category => {
    const count = books.filter(book => book.category === category).length;
    
    // Map categories to FontAwesome icons
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
    const authorBooks = books.filter(book => book.authorId === user.id);
    const bookCount = authorBooks.length;
    const totalRating = authorBooks.reduce((sum, book) => sum + (book.averageRating || 0), 0);
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

  // Get a featured book for the reader preview
  const featuredBook = books.length > 0 ? books[0] : null;

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold font-['Merriweather'] mb-4">Your Story Deserves to be Told</h1>
              <p className="text-xl mb-6 opacity-90">Publish your book and reach readers worldwide. No gatekeepers, just your authentic voice.</p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/upload">
                  <Button size="lg" className="bg-[#E67E22] hover:bg-[#E67E22]/90 text-white font-bold px-6 py-3 rounded-lg">
                    Start Publishing
                  </Button>
                </Link>
                <Link href="/search">
                  <Button size="lg" variant="outline" className="bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-opacity-90">
                    Explore Books
                  </Button>
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative">
                {/* Book stack illustration */}
                <div className="absolute -left-16 -top-5 w-44 h-60 bg-[#F9F6F2] rounded-r transform rotate-6">
                  <div className="h-full rounded-r border-r-8 border-t-8 border-b-8 border-[#2ECC71]"></div>
                </div>
                <div className="absolute -left-8 -bottom-6 w-44 h-64 bg-white rounded-r transform -rotate-3">
                  <div className="h-full rounded-r border-r-8 border-t-8 border-b-8 border-[#E67E22]"></div>
                </div>
                <div className="relative z-10 w-48 h-72 bg-white rounded shadow-lg">
                  {featuredBook && featuredBook.coverImage ? (
                    <div className="w-full h-full rounded overflow-hidden relative">
                      <img 
                        src={featuredBook.coverImage} 
                        alt={featuredBook.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <h3 className="text-white font-bold font-['Playfair_Display']">{featuredBook.title}</h3>
                        <p className="text-white text-sm">{users.find(u => u.id === featuredBook.authorId)?.displayName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Cover</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold font-['Merriweather']">Featured Books</h2>
            <Link href="/search" className="text-primary hover:underline flex items-center">
              See all <i className="ml-2">→</i>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {books.slice(0, 5).map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-['Merriweather'] mb-8">Browse Categories</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryData.slice(0, 8).map((category, index) => (
              <CategoryCard 
                key={index} 
                name={category.name} 
                icon={category.icon} 
                count={category.count} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Book Reader Preview */}
      {featuredBook && (
        <section className="py-16 bg-[#F9F6F2]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold font-['Merriweather'] text-center mb-8">Enjoy a Preview</h2>
            
            <div className="max-w-4xl mx-auto">
              <BookReader 
                book={featuredBook} 
                author={users.find(u => u.id === featuredBook.authorId)}
                preview={true}
              />
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-['Merriweather'] text-center mb-12">How BookVerse Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="text-2xl text-primary">↑</i>
              </div>
              <h3 className="text-xl font-bold font-['Merriweather'] mb-2">Upload Your Book</h3>
              <p className="text-[#777777]">Publish your manuscript in minutes with our simple upload system that supports multiple formats.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="text-2xl text-primary">🖌️</i>
              </div>
              <h3 className="text-xl font-bold font-['Merriweather'] mb-2">Design Your Cover</h3>
              <p className="text-[#777777]">Create a professional-looking cover using our design tools or upload your own artwork.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="text-2xl text-primary">🌐</i>
              </div>
              <h3 className="text-xl font-bold font-['Merriweather'] mb-2">Reach Readers</h3>
              <p className="text-[#777777]">Share your work with a growing community of readers passionate about discovering new voices.</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/register">
              <Button className="bg-primary text-white font-bold px-6 py-6 rounded-lg hover:bg-opacity-90">
                Learn More <i className="ml-2">→</i>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Authors */}
      {authors.length > 0 && (
        <section className="py-16 bg-[#F9F6F2]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h2 className="text-3xl font-bold font-['Merriweather'] mb-4 md:mb-0">Featured Authors</h2>
              <Link href="/search?tab=authors" className="text-primary hover:underline flex items-center">
                View all authors <i className="ml-2">→</i>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {authors.map(author => (
                <AuthorCard key={author.id} author={author} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-['Merriweather'] text-center mb-12">Author Success Stories</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <div className="text-3xl text-[#E67E22] mb-4">"</div>
              <p className="mb-6 opacity-90">BookVerse transformed my writing career. After years of rejection from traditional publishers, I reached 10,000 readers in my first month alone.</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden mr-4"></div>
                <div>
                  <h4 className="font-bold">Sarah Miller</h4>
                  <p className="text-sm opacity-75">Author of "Whispers in the Wind"</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <div className="text-3xl text-[#E67E22] mb-4">"</div>
              <p className="mb-6 opacity-90">The tools are intuitive, the support is excellent, and the community is incredibly supportive. I've sold more books here than on any other platform.</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden mr-4"></div>
                <div>
                  <h4 className="font-bold">David Rodriguez</h4>
                  <p className="text-sm opacity-75">Author of "Midnight Chronicles"</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <div className="text-3xl text-[#E67E22] mb-4">"</div>
              <p className="mb-6 opacity-90">I was skeptical at first, but BookVerse's detailed analytics showed me exactly who my readers were and helped me grow my audience exponentially.</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden mr-4"></div>
                <div>
                  <h4 className="font-bold">Amira Hassan</h4>
                  <p className="text-sm opacity-75">Author of "Desert Dreams"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-[#F9F6F2]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold font-['Merriweather'] mb-6">Ready to Share Your Story?</h2>
            <p className="text-xl text-[#777777] mb-8">Join thousands of authors who have found their audience on BookVerse.</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/upload">
                <Button size="lg" className="bg-[#E67E22] text-white font-bold px-8 py-4 rounded-lg hover:bg-opacity-90">
                  Start Publishing Today
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="bg-white border border-primary text-primary font-bold px-8 py-4 rounded-lg hover:bg-primary hover:text-white">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
