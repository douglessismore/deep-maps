import type { StoryCategory } from '../../types';
import { CATEGORIES } from '../../lib/categories';

interface CategoryBadgeProps {
  category: StoryCategory;
  className?: string;
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const cat = CATEGORIES[category];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase ${className}`}
      style={{
        backgroundColor: cat.bgColor,
        color: cat.color,
        border: `1px solid ${cat.borderColor}`,
      }}
    >
      {cat.label}
    </span>
  );
}
