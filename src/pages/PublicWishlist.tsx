import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
}

export default function PublicWishlist() {
  const { userId } = useParams<{ userId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWishlist();
    }
  }, [userId]);

  const fetchWishlist = async () => {
    if (!userId) return;

    try {
      // Fetch user name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (profile) {
        setUserName(profile.full_name);
      }

      // Fetch favorites
      const { data: favorites } = await supabase
        .from('favorites')
        .select(`
          id,
          products (
            id,
            name,
            slug,
            price,
            promotional_price,
            product_images (image_url)
          )
        `)
        .eq('user_id', userId);

      if (favorites) {
        const productsList: Product[] = favorites.map((fav: any) => ({
          id: fav.products.id,
          name: fav.products.name,
          slug: fav.products.slug,
          price: fav.products.price,
          promotional_price: fav.products.promotional_price,
          image_url: fav.products.product_images?.[0]?.image_url || null,
        }));
        
        setProducts(productsList);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>Carregando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Lista de Desejos de {userName}
          </h1>
          <p className="text-muted-foreground">
            Confira os produtos favoritos de {userName}
          </p>
        </div>

        {products.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                Esta lista de desejos está vazia
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const finalPrice = product.promotional_price || product.price;

              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-elegant transition-shadow">
                  <Link to={`/produto/${product.slug}`}>
                    {product.image_url && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/produto/${product.slug}`}>
                      <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-4">
                      {product.promotional_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl font-bold text-primary">
                        R$ {finalPrice.toFixed(2)}
                      </span>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/produto/${product.slug}`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
