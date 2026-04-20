import { ShoppingCart, User, Menu, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from './search/SearchBar';
import { NotificationBadge } from './notifications/NotificationBadge';
import { CategoriesSidebar } from './CategoriesSidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function Header() {
  const { user } = useAuth();
  const { items } = useCart();
  const { isStaff, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso!');
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CategoriesSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Matu Cosméticos" 
              className="h-10 w-auto object-contain"
            />
          </Link>

        <div className="hidden md:block flex-1 mx-8">
          <SearchBar />
        </div>

          <div className="flex items-center gap-2">
            {user && <NotificationBadge />}

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <User className="h-4 w-4 mr-2" />
                    Conta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer w-full">
                      <User className="h-4 w-4 mr-2" />
                      Minha Conta
                    </Link>
                  </DropdownMenuItem>
                  {!roleLoading && isStaff && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Área Administrativa
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" className="rounded-full">
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}