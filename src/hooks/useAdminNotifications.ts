import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';
import { toast } from 'sonner';

export function useAdminNotifications() {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();

  useEffect(() => {
    if (!user || (!isAdmin && !isManager)) return;

    // Subscribe to new reviews
    const reviewsChannel = supabase
      .channel('admin-reviews-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
        },
        async (payload) => {
          const review = payload.new;
          
          // Get product details
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', review.product_id)
            .single();

          // Get user details
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .single();

          toast.info('Nova Avaliação Recebida!', {
            description: `${profile?.full_name || 'Um cliente'} avaliou "${product?.name}" com ${review.rating} estrelas`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Subscribe to low stock alerts
    const productsChannel = supabase
      .channel('admin-stock-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        async (payload) => {
          const product = payload.new;
          const oldProduct = payload.old;
          
          // Alert when stock reaches 10 or below (configurable threshold)
          const LOW_STOCK_THRESHOLD = 10;
          
          if (
            product.stock <= LOW_STOCK_THRESHOLD &&
            oldProduct.stock > LOW_STOCK_THRESHOLD
          ) {
            toast.warning('Estoque Baixo!', {
              description: `O produto "${product.name}" está com apenas ${product.stock} unidades em estoque`,
              duration: 7000,
            });
          }

          // Alert when stock reaches 0
          if (product.stock === 0 && oldProduct.stock > 0) {
            toast.error('Produto Sem Estoque!', {
              description: `O produto "${product.name}" está esgotado`,
              duration: 7000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(productsChannel);
    };
  }, [user, isAdmin, isManager]);
}
