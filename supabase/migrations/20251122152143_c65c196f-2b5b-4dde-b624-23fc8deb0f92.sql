-- Criar tabela para cupons automáticos em pop-up
CREATE TABLE IF NOT EXISTS public.popup_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  valid_until TIMESTAMPTZ,
  target_audience TEXT NOT NULL DEFAULT 'new_users' CHECK (target_audience IN ('new_users', 'all_users', 'special_date')),
  special_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para popup_coupons
ALTER TABLE public.popup_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active popup coupons"
  ON public.popup_coupons
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage popup coupons"
  ON public.popup_coupons
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_popup_coupons_updated_at
  BEFORE UPDATE ON public.popup_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Adicionar campos de cor na tabela rotating_messages
ALTER TABLE public.rotating_messages 
  ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#FF1493';