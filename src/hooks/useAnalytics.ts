import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  const trackEvent = async (eventType: string, eventData?: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: eventData || {},
        user_id: session?.user?.id || null,
        session_id: session?.access_token?.substring(0, 32) || null
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  return { trackEvent };
};
