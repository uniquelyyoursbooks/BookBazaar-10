import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Book, Review, User } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays } from "date-fns";

const Analytics: React.FC = () => {
  // Mock user ID - would come from auth context in a real app
  const userId = 1;
  
  // Fetch author's books
  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: [`/api/books/author/${userId}`],
    enabled: !!userId,
  });
  
  // Generate mock data for demonstration
  const generateMockReadsData = () => {
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, "MMM dd"),
        reads: Math.floor(Math.random() * 20),
      });
    }
    return data;
  };
  
  const generateMockCategoryData = () => {
    return [
      { name: "Fiction", value: 45 },
      { name: "Mystery", value: 20 },
      { name: "Sci-Fi", value: 15 },
      { name: "Romance", value: 10 },
      { name: "Other", value: 10 },
    ];
  };
  
  const readsData = generateMockReadsData();
  const categoryData = generateMockCategoryData();
  
  // Colors for the pie chart
  const COLORS = ["#805AD5", "#F6AD55", "#2D3748", "#4A5568", "#A0AEC0"];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary serif">Analytics Dashboard</h1>
        <p className="text-neutral-600 mt-2">
          Track the performance of your books and understand your audience
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-neutral-600 text-sm font-medium">Total Books</h3>
              <div className="mt-2 flex items-center justify-center">
                {booksLoading ? (
                  <Skeleton className="h-10 w-10" />
                ) : (
                  <span className="text-4xl font-bold text-primary">{books?.length || 0}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-neutral-600 text-sm font-medium">Total Reads</h3>
              <div className="mt-2 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">537</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-neutral-600 text-sm font-medium">Reviews</h3>
              <div className="mt-2 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-neutral-600 text-sm font-medium">Avg. Rating</h3>
              <div className="mt-2 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">4.5</span>
                <i className="fas fa-star text-accent-dark ml-2"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Daily Reads</CardTitle>
            <CardDescription>Number of reads per day over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={readsData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reads" fill="#805AD5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reader Demographics</CardTitle>
            <CardDescription>Book popularity by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Book Performance */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Book Performance</CardTitle>
          <CardDescription>Compare the performance of your published books</CardDescription>
        </CardHeader>
        <CardContent>
          {booksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : books && books.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-neutral-200">
                    <th className="py-3 px-4 font-medium">Book Title</th>
                    <th className="py-3 px-4 font-medium">Published</th>
                    <th className="py-3 px-4 font-medium">Reads</th>
                    <th className="py-3 px-4 font-medium">Avg. Rating</th>
                    <th className="py-3 px-4 font-medium">Reviews</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">{book.title}</td>
                      <td className="py-3 px-4">{new Date(book.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{Math.floor(Math.random() * 200)}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center">
                          {(Math.random() * 2 + 3).toFixed(1)}
                          <i className="fas fa-star text-accent-dark ml-2 text-sm"></i>
                        </span>
                      </td>
                      <td className="py-3 px-4">{Math.floor(Math.random() * 15)}</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/edit/${book.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-600 mb-4">You haven't published any books yet.</p>
              <Link href="/dashboard/upload">
                <Button className="bg-secondary hover:bg-secondary-dark">Upload Your First Book</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reader Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Reader Feedback</CardTitle>
          <CardDescription>Recent reviews from your readers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-neutral-600 mb-4">No reviews yet. Keep promoting your books to get feedback!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
