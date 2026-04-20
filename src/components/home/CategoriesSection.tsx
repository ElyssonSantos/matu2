import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useLocation } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchCategories();
    // Extract category from URL if on category page
    const pathMatch = location.pathname.match(/\/categoria\/([^/]+)/);
    if (pathMatch) {
      setSelectedCategory(pathMatch[1]);
    }
  }, [location.pathname]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (data) {
      setCategories(data);
    }
  };

  const handleCategoryClick = async (categoryId: string, categoryName: string) => {
    // Track analytics
    await supabase.from('analytics_events').insert({
      event_type: 'category_click',
      event_data: {
        category_id: categoryId,
        category_name: categoryName,
        timestamp: new Date().toISOString()
      }
    });
  };

  if (categories.length === 0) return null;

  return (
    <section className="py-4">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
        <Link
          to="/"
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap text-sm md:text-base transition-all px-4 py-2 rounded-full ${
            !selectedCategory 
              ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
              : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground font-light'
          }`}
        >
          Todas
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/categoria/${category.slug}`}
            onClick={() => {
              handleCategoryClick(category.id, category.name);
              setSelectedCategory(category.slug);
            }}
            className={`whitespace-nowrap text-sm md:text-base transition-all px-4 py-2 rounded-full ${
              selectedCategory === category.slug 
                ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground font-light'
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
