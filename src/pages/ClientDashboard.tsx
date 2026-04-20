import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp, Package, Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';

interface OrderStats {
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItems: number;
}

interface MonthlyData {
  month: string;
  total: number;
}

interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  count: number;
  image_url: string | null;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OrderStats>({
    totalSpent: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalItems: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topFavorites, setTopFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch order statistics
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total, created_at, order_items(quantity)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (orders) {
        const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const totalItems = orders.reduce((sum, order) => {
          return sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
        }, 0);

        setStats({
          totalSpent,
          totalOrders,
          averageOrderValue,
          totalItems,
        });

        // Process monthly data
        const monthlyMap = new Map<string, number>();
        orders.forEach(order => {
          const date = new Date(order.created_at);
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + Number(order.total));
        });

        const monthlyArray = Array.from(monthlyMap.entries())
          .map(([month, total]) => ({ month, total }))
          .slice(-6);
        
        setMonthlyData(monthlyArray);
      }

      // Fetch favorite products
      const { data: favorites } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            slug,
            price,
            product_images (image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (favorites) {
        const topFavs: FavoriteProduct[] = favorites.map((fav: any) => ({
          id: fav.products.id,
          name: fav.products.name,
          slug: fav.products.slug,
          price: fav.products.price,
          count: 1,
          image_url: fav.products.product_images?.[0]?.image_url || null,
        }));
        
        setTopFavorites(topFavs);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
          Meu Dashboard
        </h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalSpent.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.averageOrderValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Compras dos Últimos Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Favoritos</CardTitle>
            </CardHeader>
            <CardContent>
              {topFavorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Heart className="h-12 w-12 mb-4" />
                  <p>Você ainda não tem favoritos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topFavorites.map((product) => (
                    <Link
                      key={product.id}
                      to={`/produto/${product.slug}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-primary font-semibold">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
