import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  sales_count: number;
  created_at: string;
  category_id: string | null;
  product_images: { image_url: string }[];
}

interface Category {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { addItem } = useCart();

  const { setObserverTarget } = useInfiniteScroll({
    onLoadMore: () => fetchProducts(page + 1, true),
    hasMore,
    isLoading: isLoadingMore
  });

  const query = searchParams.get('query') || '';
  const categoryFilter = searchParams.get('categoria') || '';
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    resetAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryFilter, sort]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const resetAndFetch = () => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  };

  const fetchProducts = async (pageToLoad: number, append: boolean) => {
    if (!hasMore && append) return;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    let queryBuilder = supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        price,
        promotional_price,
        sales_count,
        created_at,
        category_id,
        product_images (image_url)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true);

    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    if (categoryFilter) {
      queryBuilder = queryBuilder.eq('category_id', categoryFilter);
    }

    if (sort === 'price_asc') {
      queryBuilder = queryBuilder.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      queryBuilder = queryBuilder.order('price', { ascending: false });
    } else if (sort === 'sales') {
      queryBuilder = queryBuilder.order('sales_count', { ascending: false });
    } else if (sort === 'recent') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await queryBuilder.range(from, to);

    if (data) {
      setProducts((prev) => (append ? [...prev, ...(data as any)] : (data as any)));
      const total = count ?? data.length;
      const loaded = from + data.length;
      setHasMore(loaded < total);
      setPage(pageToLoad);
    }

    if (append) {
      setIsLoadingMore(false);
    } else {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          {query ? `Resultados para "${query}"` : 'Buscar Produtos'}
        </h1>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Categoria</label>
                  <Select value={categoryFilter || 'all'} onValueChange={(val) => updateFilter('categoria', val === 'all' ? '' : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Ordenar por</label>
                  <Select value={sort || 'relevance'} onValueChange={(val) => updateFilter('sort', val === 'relevance' ? '' : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Relevância" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="price_asc">Menor Preço</SelectItem>
                      <SelectItem value="price_desc">Maior Preço</SelectItem>
                      <SelectItem value="sales">Mais Vendidos</SelectItem>
                      <SelectItem value="recent">Mais Recentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-center py-8">Carregando...</p>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-2xl font-semibold mb-4">Nenhum produto encontrado</p>
                <p className="text-muted-foreground mb-6">Tente ajustar os filtros ou buscar por outro termo</p>
                <Link to="/">
                  <Button>Voltar para Home</Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const finalPrice = product.promotional_price || product.price;
                  const hasDiscount = !!product.promotional_price;

                  return (
                    <Link
                      key={product.id}
                      to={`/produto/${product.slug}`}
                      className="block h-full"
                    >
                      <Card className="overflow-hidden group hover:shadow-elegant transition-shadow h-full">
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={product.product_images[0]?.image_url || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-4 flex flex-col h-full">
                          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
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
                            className="w-full mt-auto"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItem({
                                id: product.id,
                                name: product.name,
                                price: finalPrice,
                                image: product.product_images[0]?.image_url || '',
                              });
                            }}
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Adicionar
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {hasMore && !loading && (
              <div ref={setObserverTarget} className="flex justify-center py-8">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Carregando mais produtos...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
