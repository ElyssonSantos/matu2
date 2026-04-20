import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
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

interface ImagePreview {
  file?: File;
  url: string;
  isExisting?: boolean;
  id?: string;
}

export default function ProductsMultiImage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagesPreviews, setImagesPreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    usage_instructions: '',
    price: '',
    promotional_price: '',
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

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newPreviews: ImagePreview[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      isExisting: false,
    }));

    setImagesPreviews([...imagesPreviews, ...newPreviews]);
  };

  const removeImagePreview = (index: number) => {
    const newPreviews = [...imagesPreviews];
    if (!newPreviews[index].isExisting) {
      URL.revokeObjectURL(newPreviews[index].url);
    }
    newPreviews.splice(index, 1);
    setImagesPreviews(newPreviews);
  };

  const uploadImages = async (productId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const preview of imagesPreviews) {
      if (preview.isExisting) {
        uploadedUrls.push(preview.url);
        continue;
      }

      if (!preview.file) continue;

      const fileExt = preview.file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, preview.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
    const productData = {
      name: formData.name,
      slug,
      description: formData.description,
      usage_instructions: formData.usage_instructions,
      price: parseFloat(formData.price),
      promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : null,
      price_club: formData.is_club_discount && formData.price_club ? parseFloat(formData.price_club) : null,
      category_id: formData.category_id || null,
      stock: parseInt(formData.stock),
      is_featured: formData.is_featured,
      is_bestseller: formData.is_bestseller,
      is_club_discount: formData.is_club_discount,
      is_active: formData.is_active,
    };

    try {
      let productId: string;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Upload images
      if (imagesPreviews.length > 0) {
        const imageUrls = await uploadImages(productId);

        // Delete old images if editing
        if (editingProduct) {
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', productId);
        }

        // Insert new images
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: productId,
          image_url: url,
          display_order: index,
        }));

        await supabase
          .from('product_images')
          .insert(imageRecords);
      }

      toast({
        title: editingProduct ? 'Produto atualizado!' : 'Produto criado!',
      });

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar produto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao deletar produto',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Produto deletado com sucesso!' });
    fetchProducts();
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    
    // Fetch full product data
    const { data: fullProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', product.id)
      .single();

    if (fullProduct) {
      setFormData({
        name: fullProduct.name,
        description: fullProduct.description || '',
        usage_instructions: fullProduct.usage_instructions || '',
        price: fullProduct.price.toString(),
        promotional_price: fullProduct.promotional_price?.toString() || '',
        price_club: fullProduct.price_club?.toString() || '',
        category_id: fullProduct.category_id || '',
        stock: fullProduct.stock.toString(),
        is_featured: fullProduct.is_featured || false,
        is_bestseller: fullProduct.is_bestseller || false,
        is_club_discount: fullProduct.is_club_discount || false,
        is_active: fullProduct.is_active,
      });
    }

    // Fetch existing images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order');

    if (images) {
      setImagesPreviews(images.map(img => ({
        url: img.image_url,
        isExisting: true,
        id: img.id,
      })));
    }

    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setImagesPreviews([]);
    setFormData({
      name: '',
      description: '',
      usage_instructions: '',
      price: '',
      promotional_price: '',
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
          <p className="text-muted-foreground">Gerencie os produtos da loja com múltiplas imagens</p>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="images">Imagens do Produto (múltiplas)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesSelect}
                    disabled={uploading}
                    className="mb-4"
                  />
                  
                  {imagesPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {imagesPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImagePreview(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {imagesPreviews.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Selecione múltiplas imagens</p>
                    </div>
                  )}
                </div>
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
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Criar'}
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