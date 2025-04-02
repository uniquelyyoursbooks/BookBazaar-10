import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/ui/book-card";
import { useQuery } from "@tanstack/react-query";
import { Book, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Home: React.FC = () => {
  // Fetch featured books
  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    queryFn: async () => {
      const response = await fetch('/api/books?limit=4');
      if (!response.ok) throw new Error('Failed to fetch books');
      return response.json();
    }
  });

  // Mock fetching authors - in a real app we'd fetch the actual authors
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

  // Logic to match authors to books
  const getAuthorForBook = (authorId: number): User | undefined => {
    return authors?.find(author => author.id === authorId);
  };

  // Book loading skeleton
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>
            <div className="pt-10 mx-auto max-w-7xl px-4 sm:pt-12 sm:px-6 md:pt-16 lg:pt-20 lg:px-8 xl:pt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-primary sm:text-5xl md:text-6xl">
                  <span className="block">Share your story with</span>
                  <span className="block text-secondary">the world</span>
                </h1>
                <p className="mt-3 text-base text-neutral-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Publish your book in minutes, not months. Join thousands of authors who have shared their stories, built their audience, and earned income through BookNest.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="/dashboard/upload">
                      <Button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-secondary-dark md:py-4 md:text-lg md:px-10">
                        Start Publishing
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="/discover">
                      <Button variant="outline" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-secondary bg-white hover:bg-neutral-50 md:py-4 md:text-lg md:px-10">
                        How It Works
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80" alt="Books on shelves in a library" />
        </div>
      </div>

      {/* Featured Books */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary serif">Featured Books</h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
              Discover the latest releases from our talented community of authors.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
            {booksLoading || authorsLoading ? (
              // Loading skeletons
              Array(4).fill(0).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))
            ) : books && books.length > 0 ? (
              // Render actual book cards
              books.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  author={getAuthorForBook(book.authorId)}
                  averageRating={4.5} // Mock rating
                  reviewCount={Math.floor(Math.random() * 200)} // Mock review count
                />
              ))
            ) : (
              // No books found state
              <div className="col-span-4 text-center py-10">
                <p className="text-neutral-600">No books found. Be the first to publish!</p>
                <Link href="/dashboard/upload">
                  <Button className="mt-4 bg-secondary hover:bg-secondary-dark text-white">
                    Upload a Book
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <Link href="/discover">
              <Button variant="outline" className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
                View All Books
                <i className="ml-2 fas fa-arrow-right"></i>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-neutral-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary serif">How BookNest Works</h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
              From manuscript to published book in three simple steps
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-white text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="mt-6 text-xl font-medium text-primary text-center serif">Upload Your Manuscript</h3>
              <p className="mt-2 text-center text-neutral-600">
                Convert your document to ePub or upload a PDF. Our system automatically preserves your formatting and layout.
              </p>
              <div className="mt-4 flex justify-center">
                <img className="h-48 w-auto object-contain" src="https://images.unsplash.com/photo-1531346878377-a5be20888e57?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="Person writing on laptop" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-white text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="mt-6 text-xl font-medium text-primary text-center serif">Customize Your Book</h3>
              <p className="mt-2 text-center text-neutral-600">
                Add a cover image, description, categories, and set your price. Make your book stand out to potential readers.
              </p>
              <div className="mt-4 flex justify-center">
                <img className="h-48 w-auto object-contain" src="https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="Book cover design" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-white text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="mt-6 text-xl font-medium text-primary text-center serif">Publish & Share</h3>
              <p className="mt-2 text-center text-neutral-600">
                With one click, your book is live! Share it with your audience, promote it on social media, and start earning.
              </p>
              <div className="mt-4 flex justify-center">
                <img className="h-48 w-auto object-contain" src="https://images.unsplash.com/photo-1522542550221-31fd19575a2d?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="Person reading on tablet" />
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/dashboard/upload">
              <Button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
                Start Your Publishing Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Author Dashboard */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary serif">Author Dashboard</h2>
              <p className="mt-3 max-w-3xl text-lg text-neutral-600">
                Everything you need to manage your books, track your sales, and grow your readership in one intuitive interface.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-secondary text-white">
                      <i className="fas fa-chart-line"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary serif">Real-time Analytics</h3>
                    <p className="mt-2 text-neutral-600">Track sales, reads, and reader engagement in real-time. Understand your audience better.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-secondary text-white">
                      <i className="fas fa-edit"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary serif">Easy Editing</h3>
                    <p className="mt-2 text-neutral-600">Update your book anytime. Changes go live instantly, no need to republish.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-secondary text-white">
                      <i className="fas fa-comment-alt"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary serif">Reader Engagement</h3>
                    <p className="mt-2 text-neutral-600">Respond to reviews, answer questions, and build a loyal reader community.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-secondary text-white">
                      <i className="fas fa-money-bill-wave"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary serif">Flexible Monetization</h3>
                    <p className="mt-2 text-neutral-600">Set your own prices, offer promotions, or even create subscription content.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="relative mx-auto rounded-xl shadow-xl overflow-hidden lg:max-w-md">
                <img className="w-full" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" alt="Dashboard interface on laptop" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to share your story?</span>
            <span className="block text-accent">Start publishing today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/register">
                <Button variant="secondary" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-neutral-100">
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link href="/discover">
                <Button className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-secondary-dark">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
