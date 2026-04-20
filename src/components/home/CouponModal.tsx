import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface PopupCoupon {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_until: string | null;
  target_audience: string;
}

export function CouponModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useState<PopupCoupon | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    checkAndShowCoupon();
  }, [user]);

  const checkAndShowCoupon = async () => {
    // Verifica se já mostrou cupom hoje
    const lastShown = localStorage.getItem('last_coupon_shown');
    const today = new Date().toDateString();
    
    if (lastShown === today) return;

    // Busca cupom ativo
    const { data: coupons } = await supabase
      .from('popup_coupons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!coupons || coupons.length === 0) return;

    const activeCoupon = coupons[0];

    // Verifica se o cupom é válido
    if (activeCoupon.valid_until) {
      const validUntil = new Date(activeCoupon.valid_until);
      if (validUntil < new Date()) return;
    }

    // Verifica público-alvo
    if (activeCoupon.target_audience === 'new_users' && user) {
      // Verifica se é usuário novo (cadastrado há menos de 7 dias)
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        const createdAt = new Date(profile.created_at);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation > 7) return;
      }
    }

    if (activeCoupon.target_audience === 'special_date' && activeCoupon.special_date) {
      const specialDate = new Date(activeCoupon.special_date);
      const today = new Date();
      if (specialDate.toDateString() !== today.toDateString()) return;
    }

    // Incrementa contador de visualizações
    await supabase
      .from('popup_coupons')
      .update({ display_count: activeCoupon.display_count + 1 })
      .eq('id', activeCoupon.id);

    setCoupon(activeCoupon);
    setIsOpen(true);
    localStorage.setItem('last_coupon_shown', today);
  };

  const handleCopyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code);
      toast.success('Código copiado!');
    }
  };

  const getDiscountText = () => {
    if (!coupon) return '';
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)} OFF`;
  };

  if (!coupon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Gift className="h-12 w-12 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{coupon.title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {coupon.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-8 py-4 rounded-lg border-2 border-dashed border-primary">
            <p className="text-3xl font-bold text-center text-primary">
              {getDiscountText()}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-muted px-4 py-3 rounded-lg border text-center">
              <code className="text-lg font-mono font-bold">{coupon.code}</code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="h-12 w-12"
            >
              <Copy className="h-5 w-5" />
            </Button>
          </div>

          {coupon.valid_until && (
            <p className="text-sm text-muted-foreground">
              Válido até {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
            </p>
          )}

          <Button className="w-full" onClick={() => setIsOpen(false)}>
            Aproveitar Oferta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
