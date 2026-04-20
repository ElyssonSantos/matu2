import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoriesSidebar({ open, onOpenChange }: CategoriesSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (data) setCategories(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Categorias
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {categories.map((category) => (
            <Link key={category.id} to={`/categoria/${category.slug}`} onClick={() => onOpenChange(false)}>
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-accent hover:text-accent-foreground"
              >
                <span className="font-medium">{category.name}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma categoria disponível
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
