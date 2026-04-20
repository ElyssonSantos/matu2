import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FooterSettings {
  address: string;
  phone: string;
  hours: string;
  payment_methods: string;
  quick_links: { label: string; url: string }[];
  social_links: {
    instagram: string;
    whatsapp: string;
    maps: string;
  };
  copyright: string;
  developer: {
    text: string;
    link: string;
  };
}

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'footer')
      .single();

    if (data) {
      setSettings(data.setting_value as unknown as FooterSettings);
    }
  };

  if (!settings) return null;

  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Endereço e Horário */}
          <div>
            <h3 className="font-bold text-lg mb-4">Matu Cosméticos</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="whitespace-pre-line">{settings.address}</p>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{settings.phone}</p>
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div>
            <h3 className="font-bold text-lg mb-4">Horário de Funcionamento</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="whitespace-pre-line">{settings.hours}</p>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <h3 className="font-bold text-lg mb-4">Formas de Pagamento</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="whitespace-pre-line">{settings.payment_methods}</p>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-bold text-lg mb-4">Links Rápidos</h3>
            <div className="space-y-2 text-sm">
              {settings.quick_links.map((link, index) => (
                <Link
                  key={index}
                  to={link.url}
                  className="block hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex justify-center gap-6 mb-6">
            <a
              href={settings.social_links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Instagram className="h-6 w-6" />
              <span className="text-sm">Instagram</span>
            </a>
            <a
              href={settings.social_links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Phone className="h-6 w-6" />
              <span className="text-sm">WhatsApp</span>
            </a>
            <a
              href={settings.social_links.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <MapPin className="h-6 w-6" />
              <span className="text-sm">Localização</span>
            </a>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{settings.copyright}</p>
            <a
              href={settings.developer.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block"
            >
              {settings.developer.text}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
