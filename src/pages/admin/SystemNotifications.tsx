import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Trash2, Bell, Edit } from 'lucide-react';
import { enviarNotificacaoGlobal, enviarNotificacaoParaUsuario } from '@/utils/notificationHelpers';

interface Notification {
  id: string;
  title: string;
  message: string;
  target: string[];
  created_at: string;
  order_id: string | null;
  type: string | null;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

export default function SystemNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'global' as 'global' | 'user',
    userId: '',
    link: '',
    category: 'info' as 'info' | 'promocao' | 'pedido' | 'sistema',
    scheduledTime: '',
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erro ao carregar notificações');
    } else if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (profilesData) {
      const usersFormatted = profilesData.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name || 'Usuário',
        email: profile.full_name || 'Usuário',
      }));
      setUsers(usersFormatted);
    }
  };

  const handleDeleteOldNotifications = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error, count } = await supabase
        .from('notifications')
        .delete({ count: 'exact' })
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      toast.success(`${count || 0} notificações antigas foram deletadas`);
      fetchNotifications();

      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'bulk_delete_notifications',
          entity_type: 'notification',
          details: { count, threshold_days: 30 }
        });
      }
    } catch (error) {
      toast.error('Erro ao deletar notificações antigas');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const notificationData = {
        title: formData.title,
        message: formData.message,
        target: formData.type === 'global' ? ['ALL'] : [formData.userId],
        link: formData.link || null,
        type: formData.category,
        scheduled_time: formData.scheduledTime ? new Date(formData.scheduledTime).toISOString() : null,
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (error) throw error;

      toast.success('Notificação enviada com sucesso!');
      
      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'create_notification',
          entity_type: 'notification',
          details: { title: formData.title, type: formData.type }
        });
      }
      
      setFormData({
        title: '',
        message: '',
        type: 'global',
        userId: '',
        link: '',
        category: 'info',
        scheduledTime: '',
      });
      setOpen(false);
      fetchNotifications();
    } catch (error) {
      toast.error('Erro ao enviar notificação');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir notificação');
    } else {
      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'delete_notification',
          entity_type: 'notification',
          entity_id: id,
          details: { timestamp: new Date().toISOString() }
        });
      }
      
      toast.success('Notificação excluída');
      fetchNotifications();
    }
  };

  const getTargetDisplay = (target: string[]) => {
    if (target.includes('ALL')) {
      return <Badge>Global (Todos)</Badge>;
    }
    return <Badge variant="secondary">Usuário Específico</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-3xl font-bold">Notificações do Sistema</h1>
        
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Antigas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar notificações antigas?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá deletar permanentemente todas as notificações com mais de 30 dias.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteOldNotifications}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Notificação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Notificação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Notificação</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'global' | 'user') =>
                    setFormData({ ...formData, type: value, userId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (Todos os usuários)</SelectItem>
                    <SelectItem value="user">Usuário Específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'user' && (
                <div className="space-y-2">
                  <Label htmlFor="userId">Selecionar Usuário</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, userId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ex: Nova promoção disponível"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  placeholder="Escreva a mensagem da notificação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: 'info' | 'promocao' | 'pedido' | 'sistema') =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="promocao">Promoção</SelectItem>
                    <SelectItem value="pedido">Pedido</SelectItem>
                    <SelectItem value="sistema">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link (opcional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Agendar Envio (opcional)</Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Se preenchido, a notificação será enviada no horário agendado
                </p>
              </div>

              <Button type="submit" className="w-full">
                {formData.scheduledTime ? 'Agendar Notificação' : 'Enviar Notificação'}
              </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            Nenhuma notificação criada ainda
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell>
                      <p className="font-medium">{notif.title}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                        {notif.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        notif.type === 'promocao' ? 'default' :
                        notif.type === 'pedido' ? 'secondary' :
                        notif.type === 'sistema' ? 'destructive' :
                        'outline'
                      }>
                        {notif.type === 'promocao' ? '🎉 Promoção' :
                         notif.type === 'pedido' ? '📦 Pedido' :
                         notif.type === 'sistema' ? '⚙️ Sistema' :
                         'ℹ️ Info'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getTargetDisplay(notif.target)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notif.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
