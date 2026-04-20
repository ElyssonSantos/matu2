import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function NotificationBadge() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useRealtimeNotifications();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');

  if (!user) return null;

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const handleNotificationClick = (notification: any) => {
    const isRead = notification.read_by.includes(user.id);
    if (!isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.open(notification.link, '_blank');
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const success = await deleteNotification(notificationId);
    if (success) {
      toast.success('Notificação excluída');
    } else {
      toast.error('Erro ao excluir notificação');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="promocao">🎉</TabsTrigger>
              <TabsTrigger value="pedido">📦</TabsTrigger>
              <TabsTrigger value="sistema">⚙️</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="h-96">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="p-2">
              {filteredNotifications.map((notification) => {
                const isRead = notification.read_by.includes(user.id);
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors mb-2 relative ${
                      !isRead ? 'bg-accent/50' : ''
                    }`}
                  >
                    <button
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                    >
                      <span className="text-destructive text-xs">✕</span>
                    </button>
                    <div className="flex justify-between items-start mb-1 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {notification.type === 'promocao' ? '🎉' :
                           notification.type === 'pedido' ? '📦' :
                           notification.type === 'sistema' ? '⚙️' : 'ℹ️'}
                        </span>
                        <span className="font-semibold text-sm">{notification.title}</span>
                      </div>
                      {!isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 ml-2 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <p className="text-xs text-primary underline">
                        Clique para abrir link
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
