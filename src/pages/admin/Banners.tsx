import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Banner {
  id: string;
  image_url: string;
  link: string | null;
  display_order: number;
  is_active: boolean;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    image_url: '',
    link: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order');

    if (!error && data) {
      setBanners(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Erro ao fazer upload',
        description: uploadError.message,
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
    toast({ title: 'Upload concluído!' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bannerData = {
      image_url: formData.image_url,
      link: formData.link || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    const { data: { user } } = await supabase.auth.getUser();

    if (editingBanner) {
      const { error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', editingBanner.id);

      if (error) {
        toast({
          title: 'Erro ao atualizar banner',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Log audit
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'update_banner',
          entity_type: 'banner',
          entity_id: editingBanner.id,
          details: { order: formData.display_order }
        });
      }

      toast({ title: 'Banner atualizado com sucesso!' });
    } else {
      const { data: newBanner, error } = await supabase.from('banners').insert(bannerData).select().single();

      if (error) {
        toast({
          title: 'Erro ao criar banner',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Log audit
      if (user && newBanner) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'create_banner',
          entity_type: 'banner',
          entity_id: newBanner.id,
          details: { order: formData.display_order }
        });
      }

      toast({ title: 'Banner criado com sucesso!' });
    }

    setDialogOpen(false);
    resetForm();
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este banner?')) return;

    const banner = banners.find(b => b.id === id);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('banners').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao deletar banner',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Log audit
    if (user && banner) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action_type: 'delete_banner',
        entity_type: 'banner',
        entity_id: id,
        details: { order: banner.display_order }
      });
    }

    toast({ title: 'Banner deletado com sucesso!' });
    fetchBanners();
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url,
      link: banner.link || '',
      display_order: banner.display_order,
      is_active: banner.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      image_url: '',
      link: '',
      display_order: 0,
      is_active: true,
    });
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-muted-foreground">Gerencie os banners da página inicial</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Imagem do Banner</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link (opcional)</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordem de Exibição</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Ativo</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.image_url || uploading}>
                  {uploading ? 'Fazendo upload...' : editingBanner ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <img
                    src={banner.image_url}
                    alt="Banner"
                    className="w-32 h-16 object-cover rounded"
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {banner.link || '-'}
                </TableCell>
                <TableCell>{banner.display_order}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      banner.is_active
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {banner.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(banner)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}