import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  order_items: {
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Em Separação',
  ready: 'Aguardando Retirada',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  ready: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Setup realtime subscription for order status changes
      const channel = supabase
        .channel('order-status-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedOrder = payload.new as Order;

            setOrders((prevOrders) => {
              const existing = prevOrders.find((order) => order.id === updatedOrder.id);

              if (existing && existing.status !== updatedOrder.status) {
                toast.info('Status do Pedido Atualizado', {
                  description: `Seu pedido #${updatedOrder.id.substring(0, 8)} agora está: ${statusLabels[updatedOrder.status]}`,
                });
              }

              return prevOrders.map((order) =>
                order.id === updatedOrder.id ? { ...order, status: updatedOrder.status } : order
              );
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        status,
        order_items (
          quantity,
          price,
          product:products (name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as any);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">
            Você ainda não tem pedidos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  Pedido #{order.id.substring(0, 8)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {order.order_items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">R$ {order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
