import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  message: string;
  link: string | null;
  text_color: string | null;
  bg_color: string | null;
  scroll_speed: number | null;
}

export function RotatingMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (messages.length === 0 || !containerRef.current || !messageRef.current) return;

    const msg = messages[currentIndex];
    const speed = msg.scroll_speed || 30;
    const containerWidth = containerRef.current.offsetWidth;
    const messageWidth = messageRef.current.offsetWidth;
    const totalDistance = containerWidth + messageWidth;
    const duration = (totalDistance / speed) * 1000; // Convert speed to ms

    messageRef.current.style.animation = 'none';
    messageRef.current.offsetHeight; // Trigger reflow
    messageRef.current.style.animation = `scroll-message ${duration}ms linear`;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('rotating_messages')
      .select('id, message, link, text_color, bg_color, scroll_speed')
      .eq('is_active', true)
      .order('display_order');
    if (data) setMessages(data);
  };

  if (messages.length === 0) return null;

  const msg = messages[currentIndex];
  const MessageTag = msg.link ? 'a' : 'div';

  return (
    <div 
      ref={containerRef}
      className="w-full py-3 overflow-hidden relative"
      style={{ 
        background: msg.bg_color 
          ? `linear-gradient(135deg, ${msg.bg_color}15, ${msg.bg_color}08)` 
          : 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.08))',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(236, 72, 153, 0.1)',
      }}
    >
      <div 
        ref={messageRef}
        className="inline-block whitespace-nowrap will-change-transform"
        style={{ 
          transform: 'translateX(100%)',
        }}
      >
        <MessageTag
          {...(msg.link ? { href: msg.link, target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-block font-medium px-4 hover:underline transition-colors"
          style={{ color: msg.text_color || '#FFFFFF' }}
        >
          {msg.message}
        </MessageTag>
      </div>
    </div>
  );
}
