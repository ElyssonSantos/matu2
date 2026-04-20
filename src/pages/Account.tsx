import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountFavorites } from '@/components/account/AccountFavorites';
import { AccountOrders } from '@/components/account/AccountOrders';
import { AccountReviews } from '@/components/account/AccountReviews';
import { AccountProfile } from '@/components/account/AccountProfile';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { User, Heart, ShoppingBag, Star, BarChart3, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Account() {
  const { user } = useAuth();

  const shareWishlist = () => {
    if (user) {
      const wishlistUrl = `${window.location.origin}/wishlist/${user.id}`;
      navigator.clipboard.writeText(wishlistUrl);
      toast.success('Link da wishlist copiado!');
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Minha Conta
          </h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/cliente/dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button onClick={shareWishlist} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar Desejos
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoritos</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Avaliações</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <AccountProfile />
          </TabsContent>
          
          <TabsContent value="favorites">
            <AccountFavorites />
          </TabsContent>
          
          <TabsContent value="orders">
            <AccountOrders />
          </TabsContent>
          
          <TabsContent value="reviews">
            <AccountReviews />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
