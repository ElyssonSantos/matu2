import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RotatingMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ message: '', link: '', text_color: '#FFFFFF', bg_color: '#FF1493', scroll_speed: 30, is_active: true, display_order: 0 });

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from('rotating_messages').select('*').order('display_order');
    if (data) setMessages(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, link: form.link || null };
    if (editing) {
      await supabase.from('rotating_messages').update(data).eq('id', editing.id);
      toast.success('Atualizado!');
    } else {
      await supabase.from('rotating_messages').insert(data);
      toast.success('Criado!');
    }
    setOpen(false);
    setForm({ message: '', link: '', text_color: '#FFFFFF', bg_color: '#FF1493', scroll_speed: 30, is_active: true, display_order: 0 });
    setEditing(null);
    fetchMessages();
  };

  const handleEdit = (msg: any) => {
    setEditing(msg);
    setForm({ message: msg.message, link: msg.link || '', text_color: msg.text_color || '#FFFFFF', bg_color: msg.bg_color || '#FF1493', scroll_speed: msg.scroll_speed || 30, is_active: msg.is_active, display_order: msg.display_order || 0 });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return;
    await supabase.from('rotating_messages').delete().eq('id', id);
    toast.success('Excluído!');
    fetchMessages();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mensagens Rotativas</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm({ message: '', link: '', text_color: '#FFFFFF', bg_color: '#FF1493', scroll_speed: 30, is_active: true, display_order: 0 }); setEditing(null); } }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Mensagem</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Mensagem *</Label><Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
              <div><Label>Link</Label><Input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
              <div><Label>Cor do Texto</Label><Input type="color" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })} /></div>
              <div><Label>Cor de Fundo</Label><Input type="color" value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} /></div>
              <div><Label>Velocidade (s)</Label><Input type="number" value={form.scroll_speed} onChange={(e) => setForm({ ...form, scroll_speed: Number(e.target.value) })} /></div>
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} /></div>
              <Button type="submit" className="w-full">{editing ? 'Atualizar' : 'Criar'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Mensagem</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {messages.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.message}</TableCell>
              <TableCell>{m.is_active ? '✓ Ativo' : '✗ Inativo'}</TableCell>
              <TableCell><Button size="icon" variant="ghost" onClick={() => handleEdit(m)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
