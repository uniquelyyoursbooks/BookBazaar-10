import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AuthorCardProps = {
  author: {
    id: number;
    displayName: string;
    profileImage?: string;
    bannerImage?: string;
    bio?: string;
    category: string;
    bookCount: number;
    averageRating: number;
  };
};

export default function AuthorCard({ author }: AuthorCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="aspect-w-16 aspect-h-9 w-full h-40 bg-primary bg-opacity-10">
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
      
      <div className="px-6 pt-8 pb-6 relative">
        <div className="absolute -top-12 left-6 w-16 h-16 bg-white rounded-full border-4 border-white shadow-md overflow-hidden">
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
        
        <h3 className="font-bold font-['Merriweather'] text-xl mb-1">{author.displayName}</h3>
        
        <p className="text-[#777777] text-sm mb-3">
          {author.category ? `${author.category} Author` : "Author"}
        </p>
        
        <p className="text-[#333333] mb-4 line-clamp-2">
          {author.bio || `Author of books in the ${author.category || "various"} category.`}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-[#F9F6F2] text-xs px-2 py-1 rounded-full">
              {author.bookCount} {author.bookCount === 1 ? 'Book' : 'Books'}
            </Badge>
            <Badge variant="secondary" className="bg-[#F9F6F2] text-xs px-2 py-1 rounded-full">
              {author.averageRating.toFixed(1)} Avg Rating
            </Badge>
          </div>
          
          <Link href={`/author/${author.id}`} className="text-primary hover:underline text-sm">
            View Profile
          </Link>
        </div>
      </div>
    </Card>
  );
}
