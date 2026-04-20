import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Users, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const { isAdmin } = useUserRole();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      const [ordersData, productsData, customersData] = await Promise.all([
        supabase.from('orders').select('total'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const totalRevenue = ordersData.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setMetrics({
        totalRevenue,
        totalOrders: ordersData.data?.length || 0,
        totalProducts: productsData.count || 0,
        totalCustomers: customersData.count || 0,
      });
    };

    fetchMetrics();
  }, []);

  const handleResetEncarteStats = async () => {
    setResetting(true);
    try {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .eq('event_type', 'encarte_click');

      if (error) throw error;

      toast.success('Estatísticas de encartes resetadas com sucesso!');
    } catch (error) {
      console.error('Error resetting encarte stats:', error);
      toast.error('Erro ao resetar estatísticas');
    } finally {
      setResetting(false);
    }
  };

  const cards = [
    {
      title: 'Faturamento Total',
      value: `R$ ${metrics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Total de Pedidos',
      value: metrics.totalOrders,
      icon: ShoppingCart,
      color: 'text-accent-foreground',
    },
    {
      title: 'Total de Produtos',
      value: metrics.totalProducts,
      icon: Package,
      color: 'text-secondary-foreground',
    },
    {
      title: 'Total de Clientes',
      value: metrics.totalCustomers,
      icon: Users,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={resetting}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar Estatísticas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetar Estatísticas dos Encartes</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá zerar todas as visualizações e cliques dos encartes. 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetEncarteStats}>
                  Confirmar Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}