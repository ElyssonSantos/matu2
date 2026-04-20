import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { toast } from 'sonner';
import { playNotificationSound } from '@/utils/notificationSound';

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  user_id: string;
}

export function useRealtimeOrders() {
  const { isStaff } = useUserRole();
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    if (!isStaff) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const newOrder = payload.new as Order;
          setNewOrdersCount((prev) => prev + 1);

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newOrder.user_id)
            .single();

          playNotificationSound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const oldOrder = payload.old as Order;
          const newOrder = payload.new as Order;

          if (oldOrder.status !== newOrder.status) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isStaff]);

  const clearNewOrdersCount = () => {
    setNewOrdersCount(0);
  };

  return { newOrdersCount, clearNewOrdersCount };
}
