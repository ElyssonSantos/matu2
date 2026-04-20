import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

interface EncarteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encarte: {
    title: string | null;
    media_url: string;
    media_type: 'image' | 'video';
    link: string | null;
  } | null;
}

export function EncarteModal({ open, onOpenChange, encarte }: EncarteModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    
    if (open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open, onOpenChange]);

  if (!encarte) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 bg-transparent border-none max-w-[900px] max-h-[80vh] w-full overflow-hidden
                   md:max-w-[720px] md:max-h-[80vh]
                   sm:max-w-full sm:h-screen sm:max-h-screen sm:w-screen"
      >
        <div className="relative bg-background rounded-lg overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300
                        sm:rounded-none sm:h-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 bg-background/90 hover:bg-background backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="p-6 sm:p-4 flex flex-col items-center justify-center min-h-[50vh] sm:h-full">
            {encarte.title && (
              <h3 className="text-2xl font-bold mb-6 text-center sm:text-xl sm:mb-4">{encarte.title}</h3>
            )}

            <div className="w-full flex items-center justify-center mb-6 sm:mb-4 max-h-[60vh] sm:max-h-[calc(100vh-200px)]">
              {encarte.media_type === 'video' ? (
                <video
                  src={encarte.media_url}
                  controls
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg sm:max-h-[calc(100vh-200px)]"
                  autoPlay
                />
              ) : (
                <img
                  src={encarte.media_url}
                  alt={encarte.title || 'Encarte'}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg sm:max-h-[calc(100vh-200px)]"
                />
              )}
            </div>

            {encarte.link && (
              <div className="w-full text-center">
                <Button asChild size="lg" className="w-full sm:w-auto shadow-elegant">
                  <a href={encarte.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Acessar conteúdo
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}