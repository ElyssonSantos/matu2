import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  averageTicket: number;
  salesLast30Days: { date: string; value: number }[];
  monthlyRevenue: { month: string; value: number }[];
  topProducts: { name: string; sales: number }[];
  ordersByStatus: { status: string; count: number }[];
}

const COLORS = ['#ec4899', '#f472b6', '#fbcfe8', '#fce7f3'];

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    averageTicket: 0,
    salesLast30Days: [],
    monthlyRevenue: [],
    topProducts: [],
    ordersByStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status, created_at');

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const totalOrders = orders?.length || 0;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales last 30 days
    const recentOrders = orders?.filter(
      (order) => new Date(order.created_at) >= thirtyDaysAgo
    ) || [];
    
    const salesByDate = recentOrders.reduce((acc: Record<string, number>, order) => {
      const date = new Date(order.created_at).toLocaleDateString('pt-BR');
      acc[date] = (acc[date] || 0) + Number(order.total);
      return acc;
    }, {});

    const salesLast30Days = Object.entries(salesByDate).map(([date, value]) => ({
      date,
      value,
    }));

    // Monthly revenue (last 12 months)
    const monthlyData: Record<string, number> = {};
    orders?.forEach((order) => {
      const month = new Date(order.created_at).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      });
      monthlyData[month] = (monthlyData[month] || 0) + Number(order.total);
    });

    const monthlyRevenue = Object.entries(monthlyData).map(([month, value]) => ({
      month,
      value,
    }));

    // Top products
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, products(name)');

    const productSales: Record<string, { name: string; sales: number }> = {};
    orderItems?.forEach((item) => {
      const productName = (item.products as any)?.name || 'Produto sem nome';
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = { name: productName, sales: 0 };
      }
      productSales[item.product_id].sales += item.quantity;
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Orders by status
    const statusCount: Record<string, number> = {};
    orders?.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
    }));

    // Products and customers count
    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    const { count: customersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    setLoading(false);
  };

  const handleResetEncarteStats = async () => {
    setResetting(true);
    try {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .like('event_type', 'encarte_%');

      if (error) throw error;

      toast.success('Estatísticas de encartes resetadas com sucesso.');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Erro ao resetar estatísticas de encartes:', error);
      toast.error('Erro ao resetar estatísticas de encartes: ' + error.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div>Carregando dashboard...</div>;
  }

  const metrics = [
    {
      title: 'Faturamento Total',
      value: `R$ ${data.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Total de Pedidos',
      value: data.totalOrders,
      icon: ShoppingCart,
      color: 'text-accent-foreground',
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${data.averageTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-secondary-foreground',
    },
    {
      title: 'Total de Clientes',
      value: data.totalCustomers,
      icon: Users,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={resetting}>
                {resetting ? 'Resetando...' : 'Resetar Estatísticas'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetar estatísticas dos encartes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível e irá remover todos os cliques, visualizações e métricas relacionadas aos encartes.
                  Tem certeza que deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetEncarteStats} disabled={resetting}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.salesLast30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#ec4899" name="Vendas (R$)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="value" stroke="#ec4899" fill="#fbcfe8" name="Faturamento (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#ec4899" name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label
                >
                  {data.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}