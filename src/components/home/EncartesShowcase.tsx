import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { EncarteModal } from './EncarteModal';

interface Encarte {
  id: string;
  title: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  link: string | null;
  display_order: number;
}

export function EncartesShowcase() {
  const [encartes, setEncartes] = useState<Encarte[]>([]);
  const [selectedEncarte, setSelectedEncarte] = useState<Encarte | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchEncartes();
  }, []);

  const fetchEncartes = async () => {
    const { data } = await supabase
      .from('encartes')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(4);

    if (data) setEncartes(data as Encarte[]);
  };

  if (encartes.length === 0) return null;

  const handleClick = (encarte: Encarte) => {
    setSelectedEncarte(encarte);
    setModalOpen(true);
  };

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-primary bg-clip-text text-transparent">Confira Nossas Novidades</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {encartes.map((encarte) => (
          <Card
            key={encarte.id}
            className="overflow-hidden cursor-pointer hover:shadow-elegant transition-all group"
            onClick={() => handleClick(encarte)}
          >
            {encarte.media_type === 'image' ? (
              <img
                src={encarte.media_url}
                alt={encarte.title || ''}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <video
                src={encarte.media_url}
                className="w-full h-64 object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            )}
            {encarte.title && (
              <div className="p-4 bg-card">
                <h3 className="font-semibold text-center">{encarte.title}</h3>
              </div>
            )}
          </Card>
        ))}
      </div>
      <EncarteModal open={modalOpen} onOpenChange={setModalOpen} encarte={selectedEncarte} />
    </section>
  );
}
