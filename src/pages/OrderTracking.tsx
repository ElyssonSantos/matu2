import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, TruckIcon, Home as HomeIcon, ArrowLeft } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  notes: string | null;
}

interface TrackingEvent {
  id: string;
  status: string;
  description: string | null;
  created_at: string;
}

const statusIcons: Record<string, any> = {
  'Pendente': Clock,
  'Em Separação': Package,
  'Aguardando Retirada': HomeIcon,
  'Finalizado': CheckCircle,
  'Cancelado': Clock,
};

const statusColors: Record<string, string> = {
  'Pendente': 'text-yellow-500',
  'Em Separação': 'text-blue-500',
  'Aguardando Retirada': 'text-purple-500',
  'Finalizado': 'text-green-500',
  'Cancelado': 'text-red-500',
};

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchOrderAndTracking();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('order-tracking-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_tracking',
            filter: `order_id=eq.${id}`,
          },
          () => {
            fetchOrderAndTracking();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, user]);

  const fetchOrderAndTracking = async () => {
    if (!id) return;

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch tracking events
      const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (trackingError) throw trackingError;
      setTracking(trackingData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar rastreamento: ' + error.message);
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

  if (!order) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>Pedido não encontrado</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link to="/account?tab=orders">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Meus Pedidos
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Rastreamento do Pedido #{order.id.substring(0, 8)}</CardTitle>
            <p className="text-muted-foreground">
              Realizado em {new Date(order.created_at).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-lg font-bold">Total: R$ {order.total.toFixed(2)}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="relative">
                {tracking.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>Aguardando atualizações de rastreamento...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tracking.map((event, index) => {
                      const Icon = statusIcons[event.status] || Clock;
                      const colorClass = statusColors[event.status] || 'text-gray-500';

                      return (
                        <div key={event.id} className="flex gap-4 relative">
                          {index < tracking.length - 1 && (
                            <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-border" />
                          )}
                          <div className={`relative z-10 flex-shrink-0 ${colorClass}`}>
                            <div className="bg-background border-2 border-current rounded-full p-2">
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{event.status}</h3>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(event.created_at).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
