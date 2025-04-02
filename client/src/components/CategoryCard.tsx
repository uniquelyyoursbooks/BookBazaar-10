import { Link } from "wouter";

type CategoryCardProps = {
  name: string;
  icon: string;
  count: number;
  selected?: boolean;
  onClick?: () => void;
};

export default function CategoryCard({ name, icon, count, selected, onClick }: CategoryCardProps) {
  // Map icon names to emoji or text representations
  const getIconElement = (iconName: string) => {
    switch (iconName) {
      case 'book': return '📚';
      case 'briefcase': return '💼';
      case 'flask': return '🧪';
      case 'heart': return '❤️';
      case 'ghost': return '👻';
      case 'user': return '👤';
      case 'child': return '👶';
      default: return '📖';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link href={`/search?category=${encodeURIComponent(name)}&tab=books`} onClick={handleClick}>
      <div 
        className={`bg-[#F9F6F2] rounded-lg p-6 hover:shadow-md transition cursor-pointer
                    ${selected ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' : ''}`}
      >
        <div className={`text-3xl mb-3 ${selected ? 'text-white' : 'text-primary'}`}>
          {getIconElement(icon)}
        </div>
        <h3 className="font-bold">{name}</h3>
        <p className={`text-sm ${selected ? 'text-white/80' : 'text-[#777777]'}`}>{count} books</p>
      </div>
    </Link>
  );
}
