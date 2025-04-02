import React from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  showCount = false,
  count,
  className,
  interactive = false,
  onChange
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  };
  
  const renderStar = (index: number) => {
    const value = index + 1;
    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
    
    let starType = "far fa-star"; // empty star
    
    if (value <= displayRating) {
      starType = "fas fa-star"; // filled star
    } else if (value - 0.5 <= displayRating) {
      starType = "fas fa-star-half-alt"; // half star
    }
    
    return (
      <i 
        key={index}
        className={cn(starType, "text-accent-dark", interactive && "cursor-pointer")}
        onMouseEnter={() => interactive && setHoverRating(value)}
        onMouseLeave={() => interactive && setHoverRating(0)}
        onClick={() => interactive && onChange && onChange(value)}
      />
    );
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn("flex", sizeClasses[size])}>
        {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      </div>
      {showCount && count !== undefined && (
        <span className="ml-1 text-xs text-neutral-500">({count})</span>
      )}
    </div>
  );
};

export default StarRating;
