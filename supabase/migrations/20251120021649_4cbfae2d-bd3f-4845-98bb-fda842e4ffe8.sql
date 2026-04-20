-- Disable email confirmation requirement
-- Update auth configuration to skip email confirmation

-- Create system_notifications table
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage system notifications
CREATE POLICY "Admins can manage system notifications"
ON public.system_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Everyone can view active system notifications
CREATE POLICY "Everyone can view active system notifications"
ON public.system_notifications
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;