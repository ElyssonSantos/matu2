import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

export default function SiteSettings() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'footer')
      .single();

    if (data) {
      setSettings(data.setting_value as unknown as FooterSettings);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setLoading(true);
    const { error } = await supabase
      .from('site_settings')
      .update({ setting_value: settings as any })
      .eq('setting_key', 'footer');

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Configurações do rodapé atualizadas!',
      });
    }
    setLoading(false);
  };

  if (!settings) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Rodapé</h1>
        <p className="text-muted-foreground">Configure as informações exibidas no rodapé do site.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Endereço</label>
            <Textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Telefone</label>
            <Input
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.hours}
            onChange={(e) => setSettings({ ...settings, hours: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.payment_methods}
            onChange={(e) => setSettings({ ...settings, payment_methods: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Instagram</label>
            <Input
              value={settings.social_links.instagram}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, instagram: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">WhatsApp</label>
            <Input
              value={settings.social_links.whatsapp}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, whatsapp: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Google Maps</label>
            <Input
              value={settings.social_links.maps}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, maps: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Textos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Copyright</label>
            <Input
              value={settings.copyright}
              onChange={(e) => setSettings({ ...settings, copyright: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Texto do Desenvolvedor</label>
            <Input
              value={settings.developer.text}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  developer: { ...settings.developer, text: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Link do Desenvolvedor</label>
            <Input
              value={settings.developer.link}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  developer: { ...settings.developer, link: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
