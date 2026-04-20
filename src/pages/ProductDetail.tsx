import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProductComparison } from '@/hooks/useProductComparison';
import { Heart, ShoppingCart, GitCompare } from 'lucide-react';
import { toast } from 'sonner';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductReviews } from '@/components/product/ProductReviews';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { RecommendedProducts } from '@/components/home/RecommendedProducts';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promotional_price: number | null;
  price_pix: number | null;
  price_card: number | null;
  price_club: number | null;
  is_club_discount: boolean;
  usage_instructions: string | null;
  category_id: string | null;
  product_images: { image_url: string; display_order: number }[];
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { user } = useAuth();
  const { addToCompare, isInCompare, count } = useProductComparison();

  useEffect(() => {
    fetchProduct();
    if (user) checkFavorite();
  }, [slug, user]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (image_url, display_order)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (data) {
      setProduct(data);
    }
    setLoading(false);
  };

  const checkFavorite = async () => {
    if (!user || !product) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .single();
    
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }
    if (!product) return;

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      setIsFavorite(false);
      toast.success('Removido dos favoritos');
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: product.id });
      setIsFavorite(true);
      toast.success('Adicionado aos favoritos');
    }
  };

  const handleAddToCart = (quantity: number = 1) => {
    if (!product) return;
    const price = product.is_club_discount && product.price_club 
      ? product.price_club 
      : (product.price_pix || product.promotional_price || product.price);
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price,
        image: product.product_images[0]?.image_url || '',
      });
    }
    toast.success(`${quantity} produto(s) adicionado(s) ao carrinho!`);
  };

  const handleWhatsApp = async () => {
    if (!product || !user) {
      toast.error('Faça login para reservar pelo WhatsApp');
      return;
    }
    
    const price = product.is_club_discount && product.price_club 
      ? product.price_club 
      : (product.promotional_price || product.price);
    const customerName = user?.user_metadata?.full_name || 'Cliente';
    
    // Generate order_number before creating order
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const orderNumber = `ORD-${timestamp}-${randomSuffix}`;
    
    // Create order with order_number
    const { data: orderData } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total: price,
        status: 'pending',
        order_number: orderNumber,
      })
      .select()
      .single();

    if (orderData) {
      await supabase.from('order_items').insert({
        order_id: orderData.id,
        product_id: product.id,
        quantity: 1,
        price: price,
      });

      await supabase.from('notifications').insert({
        target: [user.id],
        type: 'reservation_created',
        title: 'Reserva Recebida!',
        message: `Sua reserva ${orderNumber} foi criada. Produto: ${product.name}`,
        order_id: orderData.id,
      });
    }
    
    const message = `🛍️ *RESERVA - Matu Cosméticos*\n\n*Cliente:* ${customerName}\n*Produto:* ${product.name}\n*Preço:* R$ ${price.toFixed(2)}\n*ID da Reserva:* ${orderNumber}\n*Link do Produto:* ${window.location.href}\n\n_Reserva gerada automaticamente pelo site._`;
    const whatsappUrl = `https://wa.me/55799999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Produto não encontrado</h1>
          <Link to="/">
            <Button>Voltar para Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = product.is_club_discount && product.price_club 
    ? product.price_club 
    : (product.price_pix || product.promotional_price || product.price);
  const hasDiscount = !!product.promotional_price && !product.is_club_discount;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <ProductGallery images={product.product_images} productName={product.name} />

          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <div className="space-y-2">
                {product.is_club_discount && product.price_club ? (
                  <>
                    <div className="text-base text-muted-foreground">
                      R$ {product.price.toFixed(2)} sem clube
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      R$ {product.price_club.toFixed(2)}{' '}
                      <span className="text-xl font-normal">com clube</span>
                    </div>
                  </>
                ) : (
                  <>
                    {hasDiscount && (
                      <>
                        <div className="inline-block bg-accent text-accent-foreground text-sm font-semibold px-3 py-1 rounded-md">
                          {Math.round(((product.price - (product.promotional_price || 0)) / product.price) * 100)}% OFF
                        </div>
                        <div className="text-xl text-muted-foreground line-through">
                          R$ {product.price.toFixed(2)}
                        </div>
                      </>
                    )}
                    <div className="text-4xl font-bold text-primary">
                      R$ {finalPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      no PIX
                    </div>
                    {product.price_card && (
                      <div className="text-sm text-muted-foreground">
                        ou R$ {product.price_card.toFixed(2)} no cartão
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {product.description && (
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-semibold mb-3 text-foreground">Descrição</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {product.usage_instructions && (
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-semibold mb-3 text-foreground">Modo de Usar</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.usage_instructions}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-16 text-center border-0 focus:outline-none bg-transparent"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button size="lg" className="flex-1" onClick={() => handleAddToCart(quantity)}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Adicionar ao Carrinho
                </Button>
              </div>

              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  const message = `Oi, tudo bem? Quero saber mais sobre o produto:\n\n*${product.name}*\nValor: R$ ${finalPrice.toFixed(2)}\nLink: ${window.location.href}`;
                  const whatsappUrl = `https://wa.me/55799999999?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                Saiba Mais!
              </Button>
              
              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant={isFavorite ? "default" : "outline"}
                  onClick={toggleFavorite}
                  className="flex-1"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="lg"
                  variant={isInCompare(product.id) ? "default" : "outline"}
                  onClick={() => addToCompare(product.id)}
                  disabled={count >= 4 && !isInCompare(product.id)}
                  className="flex-1"
                >
                  <GitCompare className="h-5 w-5" />
                </Button>
              </div>

              <Button size="lg" variant="outline" className="w-full" onClick={handleWhatsApp}>
                Reservar pelo WhatsApp
              </Button>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />
        
        {product.category_id && (
          <RelatedProducts categoryId={product.category_id} currentProductId={product.id} />
        )}
        
        <RecommendedProducts />
      </main>
    </div>
  );
}
