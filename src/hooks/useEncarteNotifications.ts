import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEncarteNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('encarte-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'encartes'
        },
        (payload) => {
          toast({
            title: 'Novo encarte disponível!',
            description: 'Veja as novas promoções e produtos.',
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
}
