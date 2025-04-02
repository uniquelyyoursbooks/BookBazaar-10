import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { UserType } from "@/App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, BookOpen, Edit, Eye, Plus, Trash } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import { apiRequest } from "@/lib/queryClient";

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

type AuthorDashboardProps = {
  user: UserType;
};

export default function AuthorDashboard({ user }: AuthorDashboardProps) {
  const [location, setLocation] = useLocation();
  const [editBookId, setEditBookId] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: user.displayName,
    bio: user.bio || '',
    profileImage: null as File | null,
    bannerImage: null as File | null,
  });
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check URL for edit parameter
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const editId = params.get('edit');
    if (editId) {
      setEditBookId(parseInt(editId));
    }
  }, [location]);

  // Fetch author's books
  const { data: books = [], isLoading: isLoadingBooks } = useQuery<BookType[]>({
    queryKey: [`/api/books?author=${user.id}`],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('displayName', profileForm.displayName);
      if (profileForm.bio) formData.append('bio', profileForm.bio);
      if (profileForm.profileImage) formData.append('profileImage', profileForm.profileImage);
      if (profileForm.bannerImage) formData.append('bannerImage', profileForm.bannerImage);
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update local storage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const updatedUser = { ...parsedUser, ...data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    },
    onError: () => {
      setUpdateMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      setTimeout(() => setUpdateMessage(null), 3000);
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      return apiRequest('DELETE', `/api/books/${bookId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books?author=${user.id}`] });
      setUpdateMessage({ type: 'success', text: 'Book deleted successfully!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    },
    onError: () => {
      setUpdateMessage({ type: 'error', text: 'Failed to delete book. Please try again.' });
      setTimeout(() => setUpdateMessage(null), 3000);
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handleDeleteBook = (bookId: number) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      deleteBookMutation.mutate(bookId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold font-['Merriweather'] mb-8">Author Dashboard</h1>
      
      {updateMessage && (
        <Alert className={`mb-6 ${updateMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{updateMessage.text}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue={editBookId ? "books" : "overview"}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Books Published</CardTitle>
                <CardDescription>Your published works</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{books.filter(b => b.isPublished).length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Drafts</CardTitle>
                <CardDescription>Works in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{books.filter(b => !b.isPublished).length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Reviews</CardTitle>
                <CardDescription>Reader feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {/* In a real app, this would come from an API */}
                  {books.length > 0 ? Math.floor(Math.random() * 10 * books.length) : 0}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {books.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[#777777] mb-4">You haven't published any books yet.</p>
                      <Link href="/upload">
                        <Button>Upload Your First Book</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {books.slice(0, 3).map(book => (
                        <div key={book.id} className="flex items-center p-3 border rounded hover:bg-gray-50">
                          <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden mr-3">
                            {book.coverImage ? (
                              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                            ) : null}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{book.title}</h3>
                            <p className="text-sm text-[#777777]">
                              {new Date(book.publishedAt).toLocaleDateString()}
                              {book.isPublished ? (
                                <Badge className="ml-2 bg-green-100 text-green-800">Published</Badge>
                              ) : (
                                <Badge className="ml-2 bg-yellow-100 text-yellow-800">Draft</Badge>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/books/${book.id}`}>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard?edit=${book.id}`}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                {books.length > 3 && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="?tab=books">
                        View All Books
                      </Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-[#E67E22] hover:bg-[#E67E22]/90" asChild>
                    <Link href="/upload">
                      <Plus className="h-4 w-4 mr-2" /> Upload New Book
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/author/${user.id}`}>
                      <Eye className="h-4 w-4 mr-2" /> View Public Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* My Books Tab */}
        <TabsContent value="books">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-['Merriweather']">My Books</h2>
            <Button className="bg-[#E67E22] hover:bg-[#E67E22]/90" asChild>
              <Link href="/upload">
                <Plus className="h-4 w-4 mr-2" /> Upload New Book
              </Link>
            </Button>
          </div>
          
          {isLoadingBooks ? (
            <div className="flex justify-center p-12">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : books.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-[#777777]" />
                <h3 className="text-xl font-bold mb-2">No Books Yet</h3>
                <p className="text-[#777777] mb-6">Start your publishing journey by uploading your first book.</p>
                <Button className="bg-[#E67E22] hover:bg-[#E67E22]/90" asChild>
                  <Link href="/upload">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {books.map(book => (
                <Card key={book.id} className={editBookId === book.id ? 'border-primary ring-1 ring-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-24 h-32 bg-gray-200 rounded overflow-hidden mb-4 sm:mb-0 sm:mr-6">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                          <h3 className="text-xl font-bold font-['Merriweather']">{book.title}</h3>
                          <div className="flex mt-2 sm:mt-0">
                            {book.isPublished ? (
                              <Badge className="bg-green-100 text-green-800">Published</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-[#777777] mb-2">
                          Published: {new Date(book.publishedAt).toLocaleDateString()} • Category: {book.category}
                        </p>
                        
                        <p className="text-[#333333] mb-4 line-clamp-2">{book.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/books/${book.id}`}>
                              <Eye className="h-4 w-4 mr-1" /> View Details
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/read/${book.id}`}>
                              <BookOpen className="h-4 w-4 mr-1" /> Read
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard?edit=${book.id}`}>
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteBook(book.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Profile Settings Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your author profile details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={profileForm.displayName}
                          onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Author Bio</Label>
                        <Textarea
                          id="bio"
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                          placeholder="Tell readers about yourself..."
                          className="min-h-[120px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <FileUploader
                          accept="image/*"
                          onFileSelect={(file) => setProfileForm({...profileForm, profileImage: file})}
                          label="Upload profile picture"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Banner Image</Label>
                        <FileUploader
                          accept="image/*"
                          onFileSelect={(file) => setProfileForm({...profileForm, bannerImage: file})}
                          label="Upload banner image"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border">
                    <div className="h-24 bg-primary bg-opacity-10">
                      {user.bannerImage && (
                        <img src={user.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4 relative">
                      <Avatar className="w-16 h-16 border-4 border-white absolute -top-8 left-4">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback className="bg-primary text-white">
                          {user.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="mt-10">
                        <h3 className="font-bold text-lg">{profileForm.displayName}</h3>
                        <p className="text-sm text-[#777777] mb-2">@{user.username}</p>
                        {profileForm.bio && (
                          <p className="text-sm text-[#333333] line-clamp-3">{profileForm.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    asChild
                  >
                    <Link href={`/author/${user.id}`}>
                      View Public Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
