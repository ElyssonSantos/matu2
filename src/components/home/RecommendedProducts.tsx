import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  product_images: { image_url: string }[];
  category_id: string | null;
}

export function RecommendedProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      // Get user's order history to find purchased categories
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id);

      const orderIds = orders?.map(o => o.id) || [];

      let categoryIds: string[] = [];

      if (orderIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_id')
          .in('order_id', orderIds);

        const productIds = orderItems?.map(oi => oi.product_id) || [];

        if (productIds.length > 0) {
          const { data: purchasedProducts } = await supabase
            .from('products')
            .select('category_id')
            .in('id', productIds);

          categoryIds = [...new Set(purchasedProducts?.map(p => p.category_id).filter(Boolean) as string[])];
        }
      }

      // Get user's favorites
      const { data: favorites } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      const favoriteProductIds = favorites?.map(f => f.product_id) || [];

      if (favoriteProductIds.length > 0) {
        const { data: favoriteProducts } = await supabase
          .from('products')
          .select('category_id')
          .in('id', favoriteProductIds);

        categoryIds = [...new Set([...categoryIds, ...favoriteProducts?.map(p => p.category_id).filter(Boolean) as string[]])];
      }

      // Fetch recommended products from these categories
      let query = supabase
        .from('products')
        .select('id, name, slug, price, promotional_price, category_id, product_images(image_url)')
        .eq('is_active', true)
        .limit(10);

      if (categoryIds.length > 0) {
        query = query.in('category_id', categoryIds);
      } else {
        // If no data, show featured products
        query = query.eq('is_featured', true);
      }

      const { data } = await query;
      if (data) setProducts(data as any);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  if (!user || products.length === 0) return null;

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-primary bg-clip-text text-transparent">
        Recomendados para Você
      </h2>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id} className="md:basis-1/3 lg:basis-1/4">
              <Card className="overflow-hidden hover:shadow-elegant transition-all group">
                <Link to={`/produto/${product.slug}`}>
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.product_images[0]?.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/produto/${product.slug}`}>
                    <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div>
                      {product.promotional_price ? (
                        <>
                          <p className="text-sm text-muted-foreground line-through">
                            R$ {product.price.toFixed(2)}
                          </p>
                          <p className="text-lg font-bold text-primary">
                            R$ {product.promotional_price.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-primary">
                          R$ {product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </section>
  );
}
