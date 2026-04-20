-- Create site_settings table for editable footer and site content
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read site settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only managers and admins can manage site settings
CREATE POLICY "Managers and admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default footer settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
('footer', '{
  "address": "Rua das Flores, 123\nCentro, Cidade - UF\nCEP: 12345-678",
  "phone": "+55 79 99900-8032",
  "hours": "Segunda a Sexta: 9h às 18h\nSábado: 9h às 14h\nDomingo: Fechado",
  "payment_methods": "💳 Cartões de Crédito\n💵 Dinheiro\n🔑 Pix",
  "quick_links": [
    {"label": "Sobre Nós", "url": "/sobre"},
    {"label": "Termos de Uso", "url": "/termos"},
    {"label": "Política de Privacidade", "url": "/privacidade"},
    {"label": "Fale Conosco", "url": "/contato"}
  ],
  "social_links": {
    "instagram": "https://www.instagram.com/amazonabeauty/",
    "whatsapp": "https://wa.me/5579999008032",
    "maps": "https://maps.app.goo.gl/fEdXarvXXzQ1jrhW6"
  },
  "copyright": "© 2025 Amazona Beauty. Todos os direitos reservados.",
  "developer": {
    "text": "Site desenvolvido por elysson_stts",
    "link": "https://www.instagram.com/elysson_stts/"
  }
}');