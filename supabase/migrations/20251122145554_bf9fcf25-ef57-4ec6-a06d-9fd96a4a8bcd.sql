-- Adicionar campos de preço PIX e Cartão aos produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS price_pix numeric,
ADD COLUMN IF NOT EXISTS price_card numeric;

-- Adicionar coluna de link às notificações
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS link text;