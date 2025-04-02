import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Book, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/ui/book-card";
import { calculateAverageRating } from "@/lib/utils";

const AuthorDashboard: React.FC = () => {
  // In a real app, this would come from auth context
  const userId = 1; // Mock user ID for the author

  // Get author details
  const { data: author, isLoading: authorLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      // In a real app, this would fetch from the API
      return {
        id: userId,
        username: "admin",
        password: "",
        email: "admin@booknest.com",
        fullName: "Admin User",
        bio: "BookNest administrator",
        isAuthor: true,
        createdAt: new Date(),
      };
    },
  });

  // Get author's books
  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: [`/api/books/author/${userId}`],
    enabled: !!userId,
  });

  // Get reviews for the author's books
  const { data: allReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reviews`],
    enabled: !!userId,
  });

  const renderBookSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="flex flex-col space-y-2">
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
      ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-primary serif">Author Dashboard</h1>
        <p className="text-neutral-600 mt-2">
          Manage your books, track your performance, and connect with readers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Author Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Author Profile</CardTitle>
            <CardDescription>Your public information</CardDescription>
          </CardHeader>
          <CardContent>
            {authorLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-secondary text-white text-2xl font-bold">
                  {author?.fullName?.charAt(0) || "A"}
                </div>
                <h3 className="text-lg font-medium">{author?.fullName}</h3>
                <div className="text-sm text-neutral-600">
                  <p>@{author?.username}</p>
                  <p>{author?.email}</p>
                </div>
                <div>
                  <p className="text-neutral-700">{author?.bio || "No bio provided"}</p>
                </div>
                <div className="pt-2">
                  <Link href="/dashboard/profile">
                    <Button variant="outline" className="w-full">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Statistics Overview</CardTitle>
            <CardDescription>Your publishing performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-50 rounded-md">
                <p className="text-sm text-neutral-600">Published Books</p>
                <p className="text-3xl font-bold text-primary">
                  {booksLoading ? <Skeleton className="h-10 w-10" /> : books?.length || 0}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-md">
                <p className="text-sm text-neutral-600">Total Reads</p>
                <p className="text-3xl font-bold text-primary">
                  {booksLoading ? <Skeleton className="h-10 w-16" /> : "0"}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-md">
                <p className="text-sm text-neutral-600">Reviews</p>
                <p className="text-3xl font-bold text-primary">
                  {reviewsLoading ? <Skeleton className="h-10 w-10" /> : "0"}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-md">
                <p className="text-sm text-neutral-600">Avg. Rating</p>
                <p className="text-3xl font-bold text-primary">
                  {reviewsLoading ? <Skeleton className="h-10 w-16" /> : "0.0"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/dashboard/analytics">
                <Button className="w-full bg-secondary hover:bg-secondary-dark">
                  View Detailed Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary serif">Your Books</h2>
        <Link href="/dashboard/upload">
          <Button className="bg-secondary hover:bg-secondary-dark">
            <i className="fas fa-plus mr-2"></i> Upload New Book
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="published" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="all">All Books</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          {booksLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{renderBookSkeletons()}</div>
          ) : books && books.filter(book => book.published).length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books
                .filter(book => book.published)
                .map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    author={author}
                    averageRating={4.5} // Mock rating
                    reviewCount={Math.floor(Math.random() * 50)} // Mock count
                    onPreviewClick={() => {}}
                  />
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-neutral-600 mb-4">You don't have any published books yet.</p>
                <Link href="/dashboard/upload">
                  <Button className="bg-secondary hover:bg-secondary-dark">Upload Your First Book</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drafts">
          {booksLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{renderBookSkeletons()}</div>
          ) : books && books.filter(book => !book.published).length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books
                .filter(book => !book.published)
                .map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    author={author}
                    showPreview={false}
                  />
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-neutral-600">You don't have any draft books.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all">
          {booksLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{renderBookSkeletons()}</div>
          ) : books && books.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map(book => (
                <div key={book.id} className="group relative">
                  <BookCard
                    book={book}
                    author={author}
                    averageRating={4.5} // Mock rating
                    reviewCount={Math.floor(Math.random() * 50)} // Mock count
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <Link href={`/dashboard/edit/${book.id}`}>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                        <i className="fas fa-edit"></i>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-neutral-600 mb-4">You haven't uploaded any books yet.</p>
                <Link href="/dashboard/upload">
                  <Button className="bg-secondary hover:bg-secondary-dark">Upload Your First Book</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthorDashboard;
