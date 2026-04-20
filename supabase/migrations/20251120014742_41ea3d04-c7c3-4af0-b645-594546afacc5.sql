-- Corrigir constraint de status da tabela orders
-- Remove a constraint antiga
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Adiciona a nova constraint com os valores corretos
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled'));