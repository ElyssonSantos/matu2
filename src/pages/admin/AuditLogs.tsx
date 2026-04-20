import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileText, Trash2, Bell, Package } from 'lucide-react';

interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles!audit_logs_user_id_fkey (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterType !== 'all') {
      query = query.eq('action_type', filterType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
    } else if (data) {
      setLogs(data as any);
    }
    setLoading(false);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'delete_order':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'create_notification':
      case 'update_notification':
      case 'delete_notification':
        return <Bell className="h-4 w-4 text-primary" />;
      case 'update_product':
      case 'create_product':
      case 'delete_product':
        return <Package className="h-4 w-4 text-accent" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      delete_order: 'Pedido Excluído',
      create_notification: 'Notificação Criada',
      update_notification: 'Notificação Atualizada',
      delete_notification: 'Notificação Excluída',
      create_product: 'Produto Criado',
      update_product: 'Produto Atualizado',
      delete_product: 'Produto Excluído',
      create_category: 'Categoria Criada',
      update_category: 'Categoria Atualizada',
      delete_category: 'Categoria Excluída',
      create_banner: 'Banner Criado',
      update_banner: 'Banner Atualizado',
      delete_banner: 'Banner Excluído',
    };
    return labels[actionType] || actionType;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Histórico de Ações</h1>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Ações</SelectItem>
            <SelectItem value="create_product">Produtos Criados</SelectItem>
            <SelectItem value="update_product">Produtos Atualizados</SelectItem>
            <SelectItem value="delete_product">Produtos Excluídos</SelectItem>
            <SelectItem value="create_category">Categorias Criadas</SelectItem>
            <SelectItem value="update_category">Categorias Atualizadas</SelectItem>
            <SelectItem value="delete_category">Categorias Excluídas</SelectItem>
            <SelectItem value="create_banner">Banners Criados</SelectItem>
            <SelectItem value="update_banner">Banners Atualizados</SelectItem>
            <SelectItem value="delete_banner">Banners Excluídos</SelectItem>
            <SelectItem value="delete_order">Pedidos Excluídos</SelectItem>
            <SelectItem value="create_notification">Notificações Criadas</SelectItem>
            <SelectItem value="update_notification">Notificações Atualizadas</SelectItem>
            <SelectItem value="delete_notification">Notificações Excluídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma ação registrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_type)}
                        <span className="font-medium">{getActionLabel(log.action_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.profiles?.full_name || 'Admin'}</TableCell>
                    <TableCell className="capitalize">{log.entity_type}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.entity_id ? log.entity_id.substring(0, 8) : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
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
