-- Drop old notifications table if exists
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create new notifications table with target and read_by arrays
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  target text[] NOT NULL,
  read_by text[] DEFAULT '{}',
  order_id text,
  type text DEFAULT 'info'
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view notifications targeted to them or to ALL
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (
  'ALL' = ANY(target) OR 
  auth.uid()::text = ANY(target)
);

-- Policy: Admins and managers can create notifications
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Policy: Users can update read_by for their own notifications
CREATE POLICY "Users can mark notifications as read"
ON public.notifications
FOR UPDATE
USING (
  'ALL' = ANY(target) OR 
  auth.uid()::text = ANY(target)
);

-- Index for performance
CREATE INDEX idx_notifications_target ON public.notifications USING GIN(target);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;