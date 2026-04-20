import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId, user]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles!reviews_user_id_fkey (full_name)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as any);
      if (user) {
        const myReview = data.find((r) => r.user_id === user.id);
        if (myReview) {
          setUserReview(myReview as any);
          setRating(myReview.rating);
          setComment(myReview.comment || '');
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Faça login para avaliar');
      return;
    }
    if (rating === 0) {
      toast.error('Selecione uma nota');
      return;
    }

    setLoading(true);

    try {
      // Use UPSERT to avoid unique constraint errors
      const { error } = await supabase
        .from('reviews')
        .upsert(
          { 
            product_id: productId, 
            user_id: user.id, 
            rating, 
            comment: comment || null 
          },
          {
            onConflict: 'user_id,product_id'
          }
        );

      if (error) {
        console.error('Error saving review:', error);
        toast.error('Erro ao salvar avaliação: ' + error.message);
      } else {
        toast.success(userReview ? 'Avaliação atualizada!' : 'Avaliação enviada!');
        await fetchReviews();
      }
    } catch (error: any) {
      console.error('Error saving review:', error);
      toast.error('Erro ao salvar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) {
        toast.error('Erro ao deletar avaliação');
      } else {
        toast.success('Avaliação removida');
        setUserReview(null);
        setRating(0);
        setComment('');
        await fetchReviews();
      }
    } finally {
      setLoading(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6 my-12">
      <div>
        <h2 className="text-3xl font-bold mb-2">Avaliações dos Clientes</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg">
              {averageRating.toFixed(1)} ({reviews.length}{' '}
              {reviews.length === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        )}
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userReview ? 'Editar Minha Avaliação' : 'Deixe sua Avaliação'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Nota</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="hover:scale-110 transition-transform"
                    type="button"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Comentário (opcional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte sua experiência com o produto..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={loading}>
                {userReview ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
              </Button>
              {userReview && (
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                  Excluir Avaliação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews
          .filter((r) => r.user_id !== user?.id)
          .map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-muted-foreground">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
