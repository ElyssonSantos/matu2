import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  user_id: string;
  order_number: string | null;
  profiles: {
    full_name: string;
  };
  order_items: {
    quantity: number;
    price: number;
    products: {
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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchId, setSearchId] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterStatus, searchId]);

  const fetchOrders = async () => {
    setLoading(true);
    
    if (searchId.trim()) {
      const search = searchId.trim();
      
      // Check if search looks like an order number
      if (search.toUpperCase().startsWith('ORD-')) {
        // Search by order_number
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total,
            status,
            user_id,
            order_number,
            order_items (
              quantity,
              price,
              products (name)
            )
          `)
          .eq('order_number', search)
          .order('created_at', { ascending: false });

        if (!orderError && orderData && orderData.length > 0) {
          const ordersWithProfiles = await Promise.all(
            orderData.map(async (order: any) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', order.user_id)
                .single();
              
              return {
                ...order,
                profiles: profile || { full_name: 'Cliente' }
              };
            })
          );
          setOrders(ordersWithProfiles as any);
          setLoading(false);
          return;
        }
      }

      // Search by customer name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${search}%`);

      if (profileData && profileData.length > 0) {
        const userIds = profileData.map(p => p.id);
        const { data: ordersByName } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total,
            status,
            user_id,
            order_number,
            order_items (
              quantity,
              price,
              products (name)
            )
          `)
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        if (ordersByName && ordersByName.length > 0) {
          const ordersWithProfiles = await Promise.all(
            ordersByName.map(async (order: any) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', order.user_id)
                .single();
              
              return {
                ...order,
                profiles: profile || { full_name: 'Cliente' }
              };
            })
          );
          setOrders(ordersWithProfiles as any);
          setLoading(false);
          return;
        }
      }

      toast.error('Pedido não encontrado');
      setOrders([]);
      setLoading(false);
      return;
    }

    // Normal fetch with status filter
    let query = supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        status,
        user_id,
        order_number,
        order_items (
          quantity,
          price,
          products (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
      setLoading(false);
      return;
    }

    if (data) {
      const ordersWithProfiles = await Promise.all(
        data.map(async (order: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single();
          
          return {
            ...order,
            profiles: profile || { full_name: 'Cliente' }
          };
        })
      );
      
      setOrders(ordersWithProfiles as any);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Erro ao atualizar status: ' + error.message);
        return;
      }

      toast.success('Status atualizado com sucesso!');
      
      // Create notification for customer
      const orderDisplayId = order.order_number || `#${orderId.substring(0, 8)}`;
      const { error: notifError } = await supabase.from('notifications').insert({
        target: [order.user_id],
        type: 'order_status',
        title: 'Status do Pedido Atualizado',
        message: `Seu pedido ${orderDisplayId} está agora: ${statusLabels[newStatus]}`,
        order_id: orderId,
      });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      fetchOrders();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado ao atualizar status');
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteId) return;

    try {
      // Delete order items first (cascade should handle this but being explicit)
      await supabase.from('order_items').delete().eq('order_id', deleteId);
      
      // Delete the order
      const { error } = await supabase.from('orders').delete().eq('id', deleteId);

      if (error) {
        console.error('Error deleting order:', error);
        toast.error('Erro ao excluir pedido');
        return;
      }

      // Log audit
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'delete_order',
          entity_type: 'order',
          entity_id: deleteId,
          details: { timestamp: new Date().toISOString() }
        });
      }

      toast.success('Pedido excluído com sucesso');
      setDeleteId(null);
      fetchOrders();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado ao excluir pedido');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold">Gerenciar Pedidos</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por ID ou nome do cliente..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Em Separação</SelectItem>
              <SelectItem value="ready">Aguardando Retirada</SelectItem>
              <SelectItem value="completed">Finalizado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={fetchOrders} variant="outline">
        Atualizar Lista
      </Button>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {searchId.trim() !== '' 
              ? 'Pedido não encontrado' 
              : 'Nenhum pedido encontrado'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {order.order_number || `Pedido #${order.id.substring(0, 8)}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {order.profiles?.full_name || 'Sem nome'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                    
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Em Separação</SelectItem>
                        <SelectItem value="ready">Aguardando Retirada</SelectItem>
                        <SelectItem value="completed">Finalizado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(order.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.products?.name || 'Produto'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="border-t mt-4 pt-4 flex justify-between font-bold">
                  <span>Total do Pedido</span>
                  <span className="text-primary">R$ {order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido permanentemente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground">
              Excluir Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
