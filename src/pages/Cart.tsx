import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  usage_limit: number | null;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? total * (appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;

  const finalTotal = total - discountAmount;

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um cupom');
      return;
    }

    setLoadingCoupon(true);

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    setLoadingCoupon(false);

    if (error || !data) {
      toast.error('Cupom inválido');
      return;
    }

    const coupon = data as Coupon;

    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      toast.error('Cupom expirado');
      return;
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      toast.error('Limite de uso do cupom atingido');
      return;
    }

    setAppliedCoupon(coupon);
    toast.success(`Cupom aplicado! Desconto de ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value.toFixed(2)}`}`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Cupom removido');
  };

  const handleWhatsApp = async () => {
    const customerName = user?.user_metadata?.full_name || 'Cliente';
    let orderNumber = '';
    
    const itemsList = items
      .map(
        (item) =>
          `• ${item.name}\n  Qtd: ${item.quantity} x R$ ${item.price.toFixed(2)} = R$ ${(item.quantity * item.price).toFixed(2)}`
      )
      .join('\n\n');

    const couponInfo = appliedCoupon
      ? `\n*Cupom:* ${appliedCoupon.code}\n*Desconto:* -R$ ${discountAmount.toFixed(2)}\n`
      : '';

    if (user) {
      // Generate order_number before creating order
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      orderNumber = `ORD-${timestamp}-${randomSuffix}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: finalTotal,
          status: 'pending',
          coupon_id: appliedCoupon?.id,
          discount_amount: discountAmount,
          order_number: orderNumber,
        })
        .select()
        .single();

      if (orderData && !orderError) {
        const orderItems = items.map((item) => ({
          order_id: orderData.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }));

        await supabase.from('order_items').insert(orderItems);

        if (appliedCoupon) {
          await supabase
            .from('coupons')
            .update({ used_count: appliedCoupon.used_count + 1 })
            .eq('id', appliedCoupon.id);
        }

        await supabase.from('notifications').insert({
          target: [user.id],
          type: 'order_created',
          title: 'Pedido Recebido!',
          message: `Seu pedido ${orderNumber} foi criado com sucesso. Total: R$ ${finalTotal.toFixed(2)}`,
          order_id: orderData.id,
        });

        clearCart();
      }
    } else {
      orderNumber = `ORD-${Date.now()}`;
    }

    const fullMessage = `🛍️ *NOVO PEDIDO - Matu Cosméticos*\n\n` +
      `*Cliente:* ${customerName}\n` +
      `*ID do Pedido:* ${orderNumber}\n` +
      `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      `*PRODUTOS:*\n${itemsList}\n\n` +
      `*Subtotal:* R$ ${total.toFixed(2)}${couponInfo}\n` +
      `*TOTAL:* R$ ${finalTotal.toFixed(2)}\n\n` +
      `*Link da Loja:* ${window.location.origin}\n\n` +
      `_Pedido gerado automaticamente pelo site._`;

    const whatsappUrl = `https://wa.me/5579999008032?text=${encodeURIComponent(fullMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-8">
            Adicione produtos para começar suas compras
          </p>
          <Link to="/">
            <Button size="lg">Continuar Comprando</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Meu Carrinho</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-primary font-bold text-xl">
                      R$ {item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-2xl font-bold">Resumo</h3>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold">Cupom de Desconto</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button variant="outline" onClick={removeCoupon}>
                        Remover
                      </Button>
                    ) : (
                      <Button onClick={validateCoupon} disabled={loadingCoupon}>
                        <Tag className="mr-2 h-4 w-4" />
                        Aplicar
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Tag className="h-4 w-4" />
                      <span>Cupom {appliedCoupon.code} aplicado!</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span>-R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold text-primary">
                    <span>Total</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleWhatsApp}
                >
                  Finalizar pelo WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Limpar Carrinho
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}