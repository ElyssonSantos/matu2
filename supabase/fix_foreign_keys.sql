-- ============================================================
-- CORREÇÃO DE FOREIGN KEYS - Amazona Beauty
-- Execute este SQL no Editor SQL do Supabase Dashboard
-- ============================================================

-- 1. Adicionar FK de reviews.user_id -> profiles.id
-- (Necessário para o JOIN: profiles!reviews_user_id_fkey)
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Adicionar FK de audit_logs.user_id -> profiles.id
-- (Necessário para o JOIN: profiles!audit_logs_user_id_fkey)
ALTER TABLE public.audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Garantir que admins podem deletar analytics_events (para o reset de stats)
DROP POLICY IF EXISTS "Admins can delete analytics events" ON public.analytics_events;
CREATE POLICY "Admins can delete analytics events" ON public.analytics_events
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
