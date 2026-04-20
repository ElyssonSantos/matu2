import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, MousePointer, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  totalProductViews: number;
  totalEncarteClicks: number;
  totalCategoryClicks: number;
  totalCartAdditions: number;
  productViews: { name: string; views: number }[];
  dailyEvents: { date: string; count: number }[];
  eventTypeDistribution: { name: string; value: number }[];
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProductViews: 0,
    totalEncarteClicks: 0,
    totalCategoryClicks: 0,
    totalCartAdditions: 0,
    productViews: [],
    dailyEvents: [],
    eventTypeDistribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all analytics events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000);

      if (!events) return;

      // Calculate metrics
      const productViews = events.filter(e => e.event_type === 'product_view');
      const encarteClicks = events.filter(e => e.event_type === 'encarte_click');
      const categoryClicks = events.filter(e => e.event_type === 'category_click');
      const cartAdditions = events.filter(e => e.event_type === 'add_to_cart');

      // Top products by views
      const productViewsMap = new Map<string, number>();
      productViews.forEach(event => {
        const eventData = event.event_data as any;
        const productName = eventData?.product_name || 'Unknown';
        productViewsMap.set(productName, (productViewsMap.get(productName) || 0) + 1);
      });

      const topProducts = Array.from(productViewsMap.entries())
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Daily events (last 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const dailyEventsMap = new Map<string, number>();
      events
        .filter(e => new Date(e.created_at) >= last30Days)
        .forEach(event => {
          const date = new Date(event.created_at).toLocaleDateString('pt-BR');
          dailyEventsMap.set(date, (dailyEventsMap.get(date) || 0) + 1);
        });

      const dailyEventsData = Array.from(dailyEventsMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Event type distribution
      const eventTypeMap = new Map<string, number>();
      events.forEach(event => {
        const type = event.event_type;
        eventTypeMap.set(type, (eventTypeMap.get(type) || 0) + 1);
      });

      const eventTypeData = Array.from(eventTypeMap.entries()).map(([name, value]) => ({ name, value }));

      setAnalytics({
        totalProductViews: productViews.length,
        totalEncarteClicks: encarteClicks.length,
        totalCategoryClicks: categoryClicks.length,
        totalCartAdditions: cartAdditions.length,
        productViews: topProducts,
        dailyEvents: dailyEventsData,
        eventTypeDistribution: eventTypeData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Métrica', 'Valor'],
      ['Visualizações de Produtos', analytics.totalProductViews],
      ['Cliques em Encartes', analytics.totalEncarteClicks],
      ['Cliques em Categorias', analytics.totalCategoryClicks],
      ['Adições ao Carrinho', analytics.totalCartAdditions],
      [''],
      ['Top Produtos', 'Visualizações'],
      ...analytics.productViews.map(p => [p.name, p.views])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Button onClick={exportToCSV}>Exportar Relatório CSV</Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações de Produtos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProductViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques em Encartes</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEncarteClicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques em Categorias</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCategoryClicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adições ao Carrinho</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCartAdditions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Visualizados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.productViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos Diários (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyEvents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.eventTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {analytics.eventTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
