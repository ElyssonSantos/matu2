import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  stock: number;
  is_active: boolean;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    usage_instructions: '',
    price: '',
    promotional_price: '',
    price_pix: '',
    price_card: '',
    price_club: '',
    category_id: '',
    stock: '',
    is_featured: false,
    is_bestseller: false,
    is_club_discount: false,
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true);

    if (data) setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
    const productData = {
      name: formData.name,
      slug,
      description: formData.description,
      usage_instructions: formData.usage_instructions,
      price: parseFloat(formData.price),
      promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : null,
      price_pix: formData.price_pix ? parseFloat(formData.price_pix) : null,
      price_card: formData.price_card ? parseFloat(formData.price_card) : null,
      price_club: formData.is_club_discount && formData.price_club ? parseFloat(formData.price_club) : null,
      category_id: formData.category_id || null,
      stock: parseInt(formData.stock),
      is_featured: formData.is_featured,
      is_bestseller: formData.is_bestseller,
      is_club_discount: formData.is_club_discount,
      is_active: formData.is_active,
    };

    // Get current user for audit log
    const { data: { user } } = await supabase.auth.getUser();

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast({
          title: 'Erro ao atualizar produto',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Log audit
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'update_product',
          entity_type: 'product',
          entity_id: editingProduct.id,
          details: { name: formData.name, changes: productData }
        });
      }

      toast({ title: 'Produto atualizado com sucesso!' });
    } else {
      const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();

      if (error) {
        toast({
          title: 'Erro ao criar produto',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Log audit
      if (user && newProduct) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action_type: 'create_product',
          entity_type: 'product',
          entity_id: newProduct.id,
          details: { name: formData.name }
        });
      }

      toast({ title: 'Produto criado com sucesso!' });
    }

    setDialogOpen(false);
    resetForm();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    // Get product name before deleting
    const product = products.find(p => p.id === id);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao deletar produto',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Log audit
    if (user && product) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action_type: 'delete_product',
        entity_type: 'product',
        entity_id: id,
        details: { name: product.name }
      });
    }

    toast({ title: 'Produto deletado com sucesso!' });
    fetchProducts();
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    
    // Fetch full product data
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', product.id)
      .single();
      
    if (data) {
      setFormData({
        name: data.name,
        description: data.description || '',
        usage_instructions: data.usage_instructions || '',
        price: data.price.toString(),
        promotional_price: data.promotional_price?.toString() || '',
        price_pix: data.price_pix?.toString() || '',
        price_card: data.price_card?.toString() || '',
        price_club: data.price_club?.toString() || '',
        category_id: data.category_id || '',
        stock: data.stock.toString(),
        is_featured: data.is_featured || false,
        is_bestseller: data.is_bestseller || false,
        is_club_discount: data.is_club_discount || false,
        is_active: data.is_active,
      });
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      usage_instructions: '',
      price: '',
      promotional_price: '',
      price_pix: '',
      price_card: '',
      price_club: '',
      category_id: '',
      stock: '',
      is_featured: false,
      is_bestseller: false,
      is_club_discount: false,
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
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie os produtos da loja</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage">Modo de Usar</Label>
                <Textarea
                  id="usage"
                  value={formData.usage_instructions}
                  onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo">Preço Promocional</Label>
                  <Input
                    id="promo"
                    type="number"
                    step="0.01"
                    value={formData.promotional_price}
                    onChange={(e) => setFormData({ ...formData, promotional_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_pix">Preço no PIX</Label>
                  <Input
                    id="price_pix"
                    type="number"
                    step="0.01"
                    value={formData.price_pix}
                    onChange={(e) => setFormData({ ...formData, price_pix: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_card">Preço no Cartão</Label>
                  <Input
                    id="price_card"
                    type="number"
                    step="0.01"
                    value={formData.price_card}
                    onChange={(e) => setFormData({ ...formData, price_card: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="club_discount">Desconto para Clube</Label>
                <Switch
                  id="club_discount"
                  checked={formData.is_club_discount}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_club_discount: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_club">Preço Clube</Label>
                <Input
                  id="price_club"
                  type="number"
                  step="0.01"
                  value={formData.price_club}
                  onChange={(e) => setFormData({ ...formData, price_club: e.target.value })}
                  disabled={!formData.is_club_discount}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Produto em Destaque</Label>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="bestseller">Mais Vendido</Label>
                <Switch
                  id="bestseller"
                  checked={formData.is_bestseller}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_bestseller: checked })}
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
                <Button type="submit">
                  {editingProduct ? 'Atualizar' : 'Criar'}
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
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {product.promotional_price ? (
                    <div className="flex flex-col">
                      <span className="line-through text-muted-foreground text-sm">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-primary font-bold">
                        R$ {product.promotional_price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span>R$ {product.price.toFixed(2)}</span>
                  )}
                </TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      product.is_active
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
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