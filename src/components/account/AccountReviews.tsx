import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
  };
}

export function AccountReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        product:products (id, name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as any);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('reviews')
      .update({
        rating: editRating,
        comment: editComment,
      })
      .eq('id', editingId);

    if (error) {
      toast.error('Erro ao atualizar avaliação');
    } else {
      toast.success('Avaliação atualizada!');
      setEditingId(null);
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir avaliação');
    } else {
      toast.success('Avaliação excluída!');
      fetchReviews();
    }
  };

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">
            Você ainda não avaliou nenhum produto
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <CardTitle className="text-lg">{review.product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {editingId === review.id ? (
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEditRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= editRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                
                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Seu comentário (opcional)"
                  rows={4}
                />
                
                <div className="flex gap-2">
                  <Button onClick={saveEdit}>Salvar</Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                {review.comment && (
                  <p className="text-muted-foreground">{review.comment}</p>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => startEdit(review)}>
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => deleteReview(review.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
