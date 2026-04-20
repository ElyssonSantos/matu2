-- Criar tabela para mensagens rotativas
CREATE TABLE IF NOT EXISTS public.rotating_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  link text,
  scroll_speed integer DEFAULT 30,
  color text DEFAULT '#FF69B4',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS para rotating_messages
ALTER TABLE public.rotating_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rotating messages"
  ON public.rotating_messages
  FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can manage rotating messages"
  ON public.rotating_messages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER update_rotating_messages_updated_at
  BEFORE UPDATE ON public.rotating_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();