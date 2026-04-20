import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  product_images: { image_url: string }[];
}

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    fetchRelatedProducts();
  }, [categoryId, currentProductId]);

  const fetchRelatedProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        promotional_price,
        product_images (image_url)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', currentProductId)
      .limit(8);

    if (data) {
      setProducts(data as any);
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="my-12">
      <h2 className="text-3xl font-bold mb-6">Produtos Relacionados</h2>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => {
            const finalPrice = product.promotional_price || product.price;
            const hasDiscount = !!product.promotional_price;

            return (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                <Card className="overflow-hidden group hover:shadow-elegant transition-shadow">
                  <Link to={`/produto/${product.slug}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product.product_images[0]?.image_url || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/produto/${product.slug}`}>
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl font-bold text-primary">
                        R$ {finalPrice.toFixed(2)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        addItem({
                          id: product.id,
                          name: product.name,
                          price: finalPrice,
                          image: product.product_images[0]?.image_url || '',
                        })
                      }
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
