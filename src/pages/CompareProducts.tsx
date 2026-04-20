import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { X, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  description: string | null;
  usage_instructions: string | null;
  product_images: { image_url: string }[];
  categories: { name: string } | null;
}

export default function CompareProducts() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    loadCompareList();
  }, []);

  useEffect(() => {
    if (compareIds.length > 0) {
      fetchProducts();
    }
  }, [compareIds]);

  const loadCompareList = () => {
    const stored = localStorage.getItem('compareProducts');
    if (stored) {
      setCompareIds(JSON.parse(stored));
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(image_url), categories(name)')
      .in('id', compareIds);

    if (data) setProducts(data as any);
  };

  const removeFromCompare = (id: string) => {
    const updated = compareIds.filter(pid => pid !== id);
    setCompareIds(updated);
    localStorage.setItem('compareProducts', JSON.stringify(updated));
    toast.success('Produto removido da comparação');
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.promotional_price || product.price,
      image: product.product_images[0]?.image_url || ''
    });
    toast.success('Produto adicionado ao carrinho!');
  };

  if (products.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Comparar Produtos</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum produto para comparar.</p>
              <Link to="/">
                <Button className="mt-4">Voltar para Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Comparar Produtos</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold">Característica</th>
                {products.map(product => (
                  <th key={product.id} className="p-4 min-w-[250px]">
                    <Card>
                      <CardContent className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeFromCompare(product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <img
                          src={product.product_images[0]?.image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded mb-2"
                        />
                        <h3 className="font-semibold mb-2">{product.name}</h3>
                      </CardContent>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-semibold">Preço</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 text-center">
                    {product.promotional_price ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">
                          R$ {product.price.toFixed(2)}
                        </p>
                        <p className="text-xl font-bold text-primary">
                          R$ {product.promotional_price.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xl font-bold text-primary">
                        R$ {product.price.toFixed(2)}
                      </p>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b">
                <td className="p-4 font-semibold">Categoria</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 text-center">
                    {product.categories?.name || '-'}
                  </td>
                ))}
              </tr>

              <tr className="border-b">
                <td className="p-4 font-semibold">Descrição</td>
                {products.map(product => (
                  <td key={product.id} className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {product.description || '-'}
                    </p>
                  </td>
                ))}
              </tr>

              <tr className="border-b">
                <td className="p-4 font-semibold">Modo de Usar</td>
                {products.map(product => (
                  <td key={product.id} className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {product.usage_instructions || '-'}
                    </p>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold">Ações</td>
                {products.map(product => (
                  <td key={product.id} className="p-4">
                    <div className="flex flex-col gap-2">
                      <Link to={`/produto/${product.slug}`}>
                        <Button variant="outline" className="w-full">
                          Ver Detalhes
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Adicionar ao Carrinho
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
