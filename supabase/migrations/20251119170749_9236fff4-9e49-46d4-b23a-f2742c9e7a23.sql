-- Create encartes (showcase items) table
CREATE TABLE public.encartes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.encartes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active encartes
CREATE POLICY "Anyone can view active encartes"
ON public.encartes
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Only managers and admins can manage encartes
CREATE POLICY "Managers and admins can manage encartes"
ON public.encartes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create order tracking table for detailed status updates
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view tracking for their own orders
CREATE POLICY "Users can view own order tracking"
ON public.order_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_tracking.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Staff can view all tracking
CREATE POLICY "Staff can view all order tracking"
ON public.order_tracking
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'seller'::app_role)
);

-- Admins can manage tracking
CREATE POLICY "Admins can manage order tracking"
ON public.order_tracking
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on encartes
CREATE TRIGGER update_encartes_updated_at
BEFORE UPDATE ON public.encartes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add indexes for performance
CREATE INDEX idx_encartes_display_order ON public.encartes(display_order);
CREATE INDEX idx_encartes_is_active ON public.encartes(is_active);
CREATE INDEX idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX idx_order_tracking_created_at ON public.order_tracking(created_at DESC);

-- Enable realtime for order_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking;