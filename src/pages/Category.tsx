import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 20;

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sort = searchParams.get('sort') || 'recent';

  const { setObserverTarget } = useInfiniteScroll({
    onLoadMore: () => fetchCategoryAndProducts(page + 1, true),
    hasMore,
    isLoading: isLoadingMore
  });

  useEffect(() => {
    if (slug) {
      resetAndFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, sort]);

  const resetAndFetch = () => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchCategoryAndProducts(1, false);
  };

  const fetchCategoryAndProducts = async (pageToLoad: number, append: boolean) => {
    if (!slug) return;
    if (!hasMore && append) return;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (categoryData) {
        setCategory(categoryData);

        let query = supabase
          .from('products')
          .select('id, name, slug, price, promotional_price, product_images(image_url)', { count: 'exact' })
          .eq('category_id', categoryData.id)
          .eq('is_active', true);

        switch (sort) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'bestseller':
            query = query.order('sales_count', { ascending: false });
            break;
          case 'recent':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        const from = (pageToLoad - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, count } = await query.range(from, to);

        if (data) {
          const productsList: Product[] = data.map((product: any) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            promotional_price: product.promotional_price,
            image_url: product.product_images?.[0]?.image_url || null,
          }));

          setProducts((prev) => (append ? [...prev, ...productsList] : productsList));
          const total = count ?? data.length;
          const loaded = from + data.length;
          setHasMore(loaded < total);
          setPage(pageToLoad);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'recent') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    setSearchParams(params);
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast.error('Faça login para favoritar produtos');
      return;
    }

    try {
      const { data: existingFavorite } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingFavorite) {
        await supabase.from('favorites').delete().eq('id', existingFavorite.id);
        toast.success('Produto removido dos favoritos');
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
        toast.success('Produto adicionado aos favoritos');
      }
    } catch (error) {
      toast.error('Erro ao atualizar favoritos');
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

  if (!category) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>Categoria não encontrada.</p>
          <Link to="/">
            <Button className="mt-4">Voltar para Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{category.name}</h1>
          <div className="w-64">
            <label className="block font-semibold mb-2">Ordenar por</label>
            <Select value={sort} onValueChange={updateSort}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="price_asc">Menor Preço</SelectItem>
                <SelectItem value="price_desc">Maior Preço</SelectItem>
                <SelectItem value="bestseller">Mais Vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-2xl font-semibold mb-4">Nenhum produto encontrado</p>
                <p className="text-muted-foreground mb-6">
                  Não há produtos disponíveis nesta categoria
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => {
                    const finalPrice = product.promotional_price || product.price;
                    const hasDiscount = !!product.promotional_price;

                    return (
                      <Card key={product.id} className="overflow-hidden group hover:shadow-elegant transition-shadow">
                        <Link to={`/produto/${product.slug}`}>
                          <div className="aspect-square overflow-hidden relative">
                            <img
                              src={product.image_url || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                              className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleFavorite(product.id);
                              }}
                            >
                              <Heart className="h-5 w-5" />
                            </button>
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
                                image: product.image_url || '',
                              })
                            }
                          >
                            Adicionar ao Carrinho
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {hasMore && (
                  <div ref={setObserverTarget} className="flex justify-center py-8">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Carregando mais produtos...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
      </main>
    </div>
  );
}
