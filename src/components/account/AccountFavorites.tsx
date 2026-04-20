import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
    slug: string;
    product_images: { image_url: string }[];
  };
}

export function AccountFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        product:products (
          id,
          name,
          price,
          promotional_price,
          slug,
          product_images (image_url)
        )
      `)
      .eq('user_id', user.id);

    if (data) {
      setFavorites(data as any);
    }
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) {
      toast.error('Erro ao remover favorito');
    } else {
      toast.success('Removido dos favoritos');
      fetchFavorites();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">
            Você ainda não tem produtos favoritos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((favorite) => (
        <Card key={favorite.id}>
          <CardContent className="p-4">
            <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
              {favorite.product.product_images[0] && (
                <img
                  src={favorite.product.product_images[0].image_url}
                  alt={favorite.product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <h3 className="font-semibold mb-2 line-clamp-2">
              {favorite.product.name}
            </h3>
            
            <div className="mb-4">
              {favorite.product.promotional_price ? (
                <>
                  <span className="text-sm line-through text-muted-foreground mr-2">
                    R$ {favorite.product.price.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    R$ {favorite.product.promotional_price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-primary">
                  R$ {favorite.product.price.toFixed(2)}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => removeFavorite(favorite.id)}
              >
                <Heart className="h-4 w-4 mr-2 fill-current" />
                Remover
              </Button>
              <Link to={`/produto/${favorite.product.slug}`} className="flex-1">
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
