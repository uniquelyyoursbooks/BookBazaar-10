import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Heart, Search, BookmarkPlus, Star } from 'lucide-react';
import { BOOK_CATEGORIES } from '@shared/schema';
import { getCategoryLabel } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BookRecommendation {
  title: string;
  author: string;
  genre: string;
  description: string;
  reasons: string[];
  similarTo?: string;
}

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const [genre, setGenre] = useState('');
  const [interests, setInterests] = useState('');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // Fetch user ID from localStorage if available
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id?.toString());
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }, []);

  const recommendationsMutation = useMutation({
    mutationFn: async (params: { 
      userId?: string; 
      genre?: string; 
      interests?: string[];
    }) => {
      return apiRequest<BookRecommendation[]>({
        url: '/api/recommendations',
        method: 'POST',
        body: params,
        on401: 'throw'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    }
  });

  const handleSearch = () => {
    const interestsList = interests
      .split(',')
      .map(interest => interest.trim())
      .filter(Boolean);
    
    recommendationsMutation.mutate({
      userId,
      genre: genre || undefined,
      interests: interestsList.length > 0 ? interestsList : undefined
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Book Recommendations</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Discover your next favorite book based on your preferences and reading history
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Next Read</CardTitle>
            <CardDescription>
              Personalize your recommendations by selecting criteria below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any genre</SelectItem>
                    {BOOK_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interests">Interests (comma separated)</Label>
                <Input
                  id="interests"
                  placeholder="e.g., adventure, romance, history"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSearch} 
              disabled={recommendationsMutation.isPending}
              className="w-full md:w-auto"
            >
              {recommendationsMutation.isPending ? 'Finding books...' : 'Get Recommendations'}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {recommendationsMutation.isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to get recommendations. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {recommendationsMutation.isPending && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {recommendationsMutation.isSuccess && recommendationsMutation.data && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Your Recommendations</h2>
            
            {recommendationsMutation.data.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">
                    No recommendations found. Try different criteria or add more books to your reading history.
                  </p>
                </CardContent>
              </Card>
            ) : (
              recommendationsMutation.data.map((book, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{book.title}</CardTitle>
                        <CardDescription>by {book.author}</CardDescription>
                      </div>
                      <Badge variant="outline">{book.genre}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{book.description}</p>
                    
                    {book.reasons && book.reasons.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Why you might like this:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {book.reasons.map((reason, i) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {book.similarTo && (
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>Similar to: {book.similarTo}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/50 flex justify-between">
                    <Button variant="outline" size="sm">
                      <BookmarkPlus className="h-4 w-4 mr-1" />
                      Add to Library
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}