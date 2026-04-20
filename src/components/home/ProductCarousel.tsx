import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  price_pix: number | null;
  price_card: number | null;
  price_club: number | null;
  is_club_discount: boolean;
  description: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  product_images: { image_url: string }[];
}

interface ProductCarouselProps {
  title: string;
  filter: 'featured' | 'bestseller' | 'recent';
}

export function ProductCarousel({ title, filter }: ProductCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        promotional_price,
        price_pix,
        price_card,
        price_club,
        is_club_discount,
        description,
        is_featured,
        is_bestseller,
        product_images (image_url)
      `)
      .eq('is_active', true)
      .limit(8);

    if (filter === 'featured') {
      query = query.eq('is_featured', true);
    } else if (filter === 'bestseller') {
      query = query.eq('is_bestseller', true);
    } else if (filter === 'recent') {
      query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;
    if (data) {
      setProducts(data as any);
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast.error('Faça login para favoritar produtos');
      return;
    }

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      toast.success('Removido dos favoritos');
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        product_id: productId,
      });
      toast.success('Adicionado aos favoritos!');
    }
  };

  const trackAddToCart = async (productId: string, productName: string) => {
    await supabase.from('analytics_events').insert({
      event_type: 'add_to_cart',
      event_data: {
        product_id: productId,
        product_name: productName,
        timestamp: new Date().toISOString()
      }
    });
  };

  if (products.length === 0) return null;

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
        {title}
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/produto/${product.slug}`}
            className="block h-full"
          >
            <Card className="group overflow-hidden h-full">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted relative">
                  {product.product_images[0] && (
                    <img
                      src={product.product_images[0].image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {product.is_featured && (
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md">
                        Novo
                      </span>
                    )}
                    {product.promotional_price && (
                      <span className="bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md">
                        {Math.round(((product.price - product.promotional_price) / product.price) * 100)}% OFF
                      </span>
                    )}
                    {product.is_bestseller && (
                      <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md">
                        Mais Vendido
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background z-20"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                  {product.name}
                </h3>

                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description.length > 90
                      ? product.description.substring(0, 90) + '...'
                      : product.description}
                  </p>
                )}

                <div className="mb-4 space-y-1">
                  {product.is_club_discount && product.price_club ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        R$ {product.price.toFixed(2)} sem clube
                      </div>
                      <div className="text-lg font-bold text-primary">
                        R$ {product.price_club.toFixed(2)}{' '}
                        <span className="text-sm font-normal">com clube</span>
                      </div>
                    </>
                  ) : product.promotional_price ? (
                    <>
                      <div className="text-sm line-through text-muted-foreground">
                        R$ {product.price.toFixed(2)}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        R$ {(product.price_pix || product.promotional_price).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">no PIX</div>
                      {product.price_card && (
                        <div className="text-xs text-muted-foreground">
                          ou R$ {product.price_card.toFixed(2)} no cartão
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      R$ {product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-auto">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center border rounded-md flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const qty = Number(
                            (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.value || 1
                          );
                          if (qty > 1) {
                            (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement).value = String(
                              qty - 1
                            );
                          }
                        }}
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        min="1"
                        defaultValue="1"
                        className="w-12 text-center border-0 focus:outline-none bg-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                          input.value = String(Number(input.value) + 1);
                        }}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      className="flex-1 min-w-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const qty = Number(
                          (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.value || 1
                        );
                        for (let i = 0; i < qty; i++) {
                          addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price_pix || product.promotional_price || product.price,
                            image: product.product_images[0]?.image_url || '',
                          });
                        }
                        trackAddToCart(product.id, product.name);
                        toast.success(`${qty} produto(s) adicionado(s) ao carrinho!`);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Adicionar</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const message = `Oi, tudo bem? Quero saber mais sobre o produto:\n\n*${product.name}*\nValor: R$ ${(product.price_pix || product.promotional_price || product.price).toFixed(
                        2
                      )}\nLink: ${window.location.origin}/produto/${product.slug}`;
                      const whatsappUrl = `https://wa.me/5579999008032?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Saiba Mais!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
