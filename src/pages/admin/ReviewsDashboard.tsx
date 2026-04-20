import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReviewMetrics {
  averageRating: number;
  totalReviews: number;
  topProducts: Array<{
    name: string;
    averageRating: number;
    reviewCount: number;
  }>;
  trendData: Array<{
    date: string;
    count: number;
    averageRating: number;
  }>;
}

export default function ReviewsDashboard() {
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Fetch reviews with product info
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        rating,
        created_at,
        products!reviews_product_id_fkey (name, id)
      `)
      .gte('created_at', daysAgo.toISOString());

    if (error) {
      console.error('Error fetching review metrics:', error);
      setLoading(false);
      return;
    }

    if (!reviews || reviews.length === 0) {
      setMetrics({
        averageRating: 0,
        totalReviews: 0,
        topProducts: [],
        trendData: []
      });
      setLoading(false);
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Group by product
    const productMap = new Map<string, { name: string; ratings: number[]; count: number }>();
    
    reviews.forEach((review) => {
      const productName = review.products?.name || 'Produto';
      if (!productMap.has(productName)) {
        productMap.set(productName, { name: productName, ratings: [], count: 0 });
      }
      const product = productMap.get(productName)!;
      product.ratings.push(review.rating);
      product.count++;
    });

    // Top products
    const topProducts = Array.from(productMap.values())
      .map((p) => ({
        name: p.name,
        averageRating: p.ratings.reduce((sum, r) => sum + r, 0) / p.ratings.length,
        reviewCount: p.count
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    // Trend data by day
    const dateMap = new Map<string, { ratings: number[]; count: number }>();
    reviews.forEach((review) => {
      const date = new Date(review.created_at).toLocaleDateString('pt-BR');
      if (!dateMap.has(date)) {
        dateMap.set(date, { ratings: [], count: 0 });
      }
      const dayData = dateMap.get(date)!;
      dayData.ratings.push(review.rating);
      dayData.count++;
    });

    const trendData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        averageRating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

    setMetrics({
      averageRating,
      totalReviews: reviews.length,
      topProducts,
      trendData
    });
    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard de Avaliações</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard de Avaliações</h1>
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nota Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-primary">
                {metrics?.averageRating.toFixed(1)}
              </span>
              {renderStars(Math.round(metrics?.averageRating || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold">{metrics?.totalReviews}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {metrics && metrics.trendData.length > 0 ? '+' + metrics.trendData[metrics.trendData.length - 1].count : '0'}
            </span>
            <span className="text-sm text-muted-foreground ml-2">no último dia</span>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.trendData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Quantidade" />
              <Line type="monotone" dataKey="averageRating" stroke="hsl(var(--accent))" strokeWidth={2} name="Nota Média" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produtos Mais Bem Avaliados</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.topProducts || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="averageRating" fill="hsl(var(--primary))" name="Nota Média" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-6 space-y-3">
            {metrics?.topProducts.map((product, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.reviewCount} avaliações</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{product.averageRating.toFixed(1)}</span>
                  {renderStars(Math.round(product.averageRating))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
