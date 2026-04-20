import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, MessageCircle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SocialLinks {
  instagram: string;
  whatsapp: string;
  maps: string;
}

export function SocialButtons() {
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'footer')
      .single();

    if (data?.setting_value) {
      const settings = data.setting_value as { social_links?: SocialLinks };
      if (settings.social_links) {
        setSocialLinks(settings.social_links);
      }
    }
  };

  if (!socialLinks) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
      <a
        href={socialLinks.instagram}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-glow bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-110 transition-transform"
        >
          <Instagram className="h-6 w-6" />
        </Button>
      </a>
      
      <a
        href={socialLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-glow bg-green-500 hover:bg-green-600 hover:scale-110 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </a>
      
      <a
        href={socialLinks.maps}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-glow bg-blue-500 hover:bg-blue-600 hover:scale-110 transition-transform"
        >
          <MapPin className="h-6 w-6" />
        </Button>
      </a>
    </div>
  );
}
