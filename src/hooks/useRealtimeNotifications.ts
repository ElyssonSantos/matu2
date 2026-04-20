import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { playNotificationSound } from '@/utils/notificationSound';
import { 
  registerServiceWorker, 
  requestNotificationPermission as requestPushPermission, 
  subscribeToPushNotifications,
  checkPushSubscription 
} from '@/utils/pushNotifications';

// Show browser notification
const showBrowserNotification = (title: string, message: string, link?: string | null) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'amazona-notification',
    });

    if (link) {
      notification.onclick = () => {
        window.open(link, '_blank');
        notification.close();
      };
    }
  }
};

interface Notification {
  id: string;
  title: string;
  message: string;
  target: string[];
  read_by: string[];
  hidden_by: string[];
  order_id: string | null;
  created_at: string;
  link: string | null;
  type: string | null;
  scheduled_time: string | null;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Initialize push notifications
    const initPushNotifications = async () => {
      // Register service worker
      await registerServiceWorker();
      
      // Request notification permission
      const hasPermission = await requestPushPermission();
      
      if (hasPermission) {
        // Check if already subscribed
        const isSubscribed = await checkPushSubscription();
        
        // Subscribe to push notifications if not already subscribed
        if (!isSubscribed) {
          await subscribeToPushNotifications(user.id);
        }
      }
    };

    initPushNotifications();
    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Check if this notification is for current user
          const shouldReceive = 
            newNotification.target.includes('ALL') || 
            newNotification.target.includes(user.id);
          
          if (shouldReceive) {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            playNotificationSound();
            showBrowserNotification(
              newNotification.title,
              newNotification.message,
              newNotification.link
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or('scheduled_time.is.null,scheduled_time.lte.' + new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      // Filter notifications for current user (ALL or specific user_id) and not hidden
      const filtered = data.filter(
        (n) => (n.target.includes('ALL') || n.target.includes(user.id)) && 
               !(n.hidden_by || []).includes(user.id)
      );
      
      setNotifications(filtered);
      setUnreadCount(filtered.filter((n) => !n.read_by.includes(user.id)).length);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.read_by.includes(user.id)) return;

    const updatedReadBy = [...notification.read_by, user.id];
    
    await supabase
      .from('notifications')
      .update({ read_by: updatedReadBy })
      .eq('id', notificationId);

    setNotifications((prev) =>
      prev.map((n) => 
        n.id === notificationId 
          ? { ...n, read_by: updatedReadBy } 
          : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter(
      (n) => !n.read_by.includes(user.id)
    );

    if (unreadNotifications.length === 0) return;

    // Update all unread notifications in parallel
    const updates = unreadNotifications.map((n) => {
      const updatedReadBy = [...(n.read_by || []), user.id];
      return supabase
        .from('notifications')
        .update({ read_by: updatedReadBy })
        .eq('id', n.id);
    });

    await Promise.all(updates);

    // Update local state
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.read_by.includes(user.id)) {
          return { ...n, read_by: [...(n.read_by || []), user.id] };
        }
        return n;
      })
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return false;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return false;

    const updatedHiddenBy = [...(notification.hidden_by || []), user.id];
    
    const { error } = await supabase
      .from('notifications')
      .update({ hidden_by: updatedHiddenBy })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const wasUnread = notification && !notification.read_by.includes(user.id);
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return true;
    }
    return false;
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
