import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, MoveUp, MoveDown, Eye, EyeOff, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Encarte {
  id: string;
  title: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  link: string | null;
  display_order: number;
  is_active: boolean;
}

export default function Encartes() {
  const [encartes, setEncartes] = useState<Encarte[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingEncarte, setEditingEncarte] = useState<Encarte | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    media_type: 'image' as 'image' | 'video',
    is_active: true
  });
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      link: '',
      media_type: 'image',
      is_active: true
    });
    setMediaFile(null);
    setEditingEncarte(null);
  };

  const handleOpenDialog = (encarte?: Encarte) => {
    if (encarte) {
      setEditingEncarte(encarte);
      setFormData({
        title: encarte.title || '',
        link: encarte.link || '',
        media_type: encarte.media_type,
        is_active: encarte.is_active
      });
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setTimeout(resetForm, 200);
  };

  useEffect(() => {
    fetchEncartes();
  }, []);

  const fetchEncartes = async () => {
    try {
      const { data, error } = await supabase
        .from('encartes')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setEncartes((data || []) as Encarte[]);
    } catch (error: any) {
      toast.error('Erro ao carregar encartes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEncarte && !mediaFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    setUploading(true);
    try {
      let mediaUrl = editingEncarte?.media_url || '';

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `encartes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        mediaUrl = publicUrl;
      }

      if (editingEncarte) {
        const { error: updateError } = await supabase
          .from('encartes')
          .update({
            title: formData.title || null,
            link: formData.link || null,
            media_type: formData.media_type,
            media_url: mediaUrl,
            is_active: formData.is_active
          })
          .eq('id', editingEncarte.id);

        if (updateError) throw updateError;
        toast.success('Encarte atualizado com sucesso!');
      } else {
        const maxOrder = encartes.length > 0 
          ? Math.max(...encartes.map(e => e.display_order))
          : -1;

        const { error: insertError } = await supabase
          .from('encartes')
          .insert({
            title: formData.title || null,
            link: formData.link || null,
            media_type: formData.media_type,
            media_url: mediaUrl,
            is_active: formData.is_active,
            display_order: maxOrder + 1
          });

        if (insertError) throw insertError;
        toast.success('Encarte criado com sucesso!');
      }

      handleCloseDialog();
      fetchEncartes();
    } catch (error: any) {
      toast.error('Erro ao salvar encarte: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este encarte?')) return;

    try {
      const { error } = await supabase
        .from('encartes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Encarte excluído!');
      fetchEncartes();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('encartes')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status atualizado!');
      fetchEncartes();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    const index = encartes.findIndex(e => e.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === encartes.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const current = encartes[index];
    const swap = encartes[swapIndex];

    try {
      const { error: error1 } = await supabase
        .from('encartes')
        .update({ display_order: swap.display_order })
        .eq('id', current.id);

      const { error: error2 } = await supabase
        .from('encartes')
        .update({ display_order: current.display_order })
        .eq('id', swap.id);

      if (error1 || error2) throw error1 || error2;
      toast.success('Ordem atualizada!');
      fetchEncartes();
    } catch (error: any) {
      toast.error('Erro ao reordenar: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Encartes</h1>
          <p className="text-muted-foreground mt-1">
            Adicione e organize os encartes exibidos na página inicial
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Encarte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEncarte ? 'Editar Encarte' : 'Criar Novo Encarte'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título (opcional)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Promoção de Natal"
                />
              </div>

              <div>
                <Label>Tipo de Mídia</Label>
                <Select
                  value={formData.media_type}
                  onValueChange={(value: 'image' | 'video') =>
                    setFormData({ ...formData, media_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Arquivo {!editingEncarte && '*'}</Label>
                <Input
                  type="file"
                  accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  required={!editingEncarte}
                />
              </div>

              <div>
                <Label>Link (opcional)</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Enviando...' : editingEncarte ? 'Salvar Alterações' : 'Criar Encarte'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Encartes Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {encartes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum encarte cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                encartes.map((encarte, index) => (
                  <TableRow key={encarte.id}>
                    <TableCell>
                      {encarte.media_type === 'image' ? (
                        <img
                          src={encarte.media_url}
                          alt={encarte.title || 'Encarte'}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <video
                          src={encarte.media_url}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </TableCell>
                    <TableCell>{encarte.title || '-'}</TableCell>
                    <TableCell className="capitalize">{encarte.media_type}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(encarte.id, encarte.is_active)}
                      >
                        {encarte.is_active ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveOrder(encarte.id, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveOrder(encarte.id, 'down')}
                          disabled={index === encartes.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(encarte)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(encarte.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
