import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface PopupCoupon {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_until: string | null;
  target_audience: string;
  special_date: string | null;
  is_active: boolean;
  display_count: number;
  created_at: string;
}

export default function PopupCoupons() {
  const [coupons, setCoupons] = useState<PopupCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PopupCoupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    valid_until: '',
    target_audience: 'new_users',
    special_date: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('popup_coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar cupons');
    } else if (data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const couponData = {
      code: formData.code.toUpperCase(),
      title: formData.title,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value.toString()),
      valid_until: formData.valid_until || null,
      target_audience: formData.target_audience,
      special_date: formData.special_date || null,
    };

    if (editingCoupon) {
      const { error } = await supabase
        .from('popup_coupons')
        .update(couponData)
        .eq('id', editingCoupon.id);

      if (error) {
        toast.error('Erro ao atualizar cupom');
      } else {
        toast.success('Cupom atualizado com sucesso!');
        setIsDialogOpen(false);
        fetchCoupons();
        resetForm();
      }
    } else {
      const { error } = await supabase.from('popup_coupons').insert([couponData]);

      if (error) {
        toast.error('Erro ao criar cupom');
      } else {
        toast.success('Cupom criado com sucesso!');
        setIsDialogOpen(false);
        fetchCoupons();
        resetForm();
      }
    }
  };

  const handleEdit = (coupon: PopupCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      valid_until: coupon.valid_until?.split('T')[0] || '',
      target_audience: coupon.target_audience,
      special_date: coupon.special_date?.split('T')[0] || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    const { error } = await supabase.from('popup_coupons').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir cupom');
    } else {
      toast.success('Cupom excluído com sucesso!');
      fetchCoupons();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('popup_coupons')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Status atualizado!');
      fetchCoupons();
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      valid_until: '',
      target_audience: 'new_users',
      special_date: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cupons Pop-up</h1>
          <p className="text-muted-foreground">Gerencie cupons automáticos em pop-up</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </DialogTitle>
              <DialogDescription>
                Configure um cupom automático para aparecer em pop-up
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom*</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="BEMVINDO10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Bem-vindo à loja!"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Aproveite seu desconto especial"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipo de Desconto*</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">Valor do Desconto*</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value),
                      })
                    }
                    placeholder="10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_audience">Público-Alvo*</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) =>
                      setFormData({ ...formData, target_audience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_users">Usuários Novos</SelectItem>
                      <SelectItem value="all_users">Todos os Usuários</SelectItem>
                      <SelectItem value="special_date">Data Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">Válido Até</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                  />
                </div>
              </div>

              {formData.target_audience === 'special_date' && (
                <div className="space-y-2">
                  <Label htmlFor="special_date">Data Especial</Label>
                  <Input
                    id="special_date"
                    type="date"
                    value={formData.special_date}
                    onChange={(e) =>
                      setFormData({ ...formData, special_date: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhum cupom cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Público</TableHead>
                  <TableHead>Válido Até</TableHead>
                  <TableHead>Visualizações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>{coupon.title}</TableCell>
                    <TableCell>
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `R$ ${coupon.discount_value.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {coupon.target_audience === 'new_users' && 'Novos'}
                      {coupon.target_audience === 'all_users' && 'Todos'}
                      {coupon.target_audience === 'special_date' && 'Data Especial'}
                    </TableCell>
                    <TableCell>
                      {coupon.valid_until
                        ? format(new Date(coupon.valid_until), 'dd/MM/yyyy')
                        : 'Ilimitado'}
                    </TableCell>
                    <TableCell>{coupon.display_count}</TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(coupon.id, coupon.is_active)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
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
