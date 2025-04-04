import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, Star, BookmarkPlus } from 'lucide-react';

interface BookRecommendation {
  title: string;
  author: string;
  genre: string;
  description: string;
  reasons: string[];
  similarTo?: string;
}

interface RecommendationCardProps {
  recommendation: BookRecommendation;
  onAddToLibrary?: (recommendation: BookRecommendation) => void;
  onLike?: (recommendation: BookRecommendation) => void;
  onRate?: (recommendation: BookRecommendation) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAddToLibrary,
  onLike,
  onRate
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{recommendation.title}</CardTitle>
            <CardDescription>by {recommendation.author}</CardDescription>
          </div>
          <Badge variant="outline">{recommendation.genre}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{recommendation.description}</p>
        
        {recommendation.reasons && recommendation.reasons.length > 0 && (
          <div className="mt-4">
            <p className="font-medium mb-2">Why you might like this:</p>
            <ul className="list-disc pl-5 space-y-1">
              {recommendation.reasons.map((reason, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{reason}</li>
              ))}
            </ul>
          </div>
        )}
        
        {recommendation.similarTo && (
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <BookOpen className="h-4 w-4 mr-1" />
            <span>Similar to: {recommendation.similarTo}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAddToLibrary?.(recommendation)}
        >
          <BookmarkPlus className="h-4 w-4 mr-1" />
          Add to Library
        </Button>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onLike?.(recommendation)}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onRate?.(recommendation)}
          >
            <Star className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};