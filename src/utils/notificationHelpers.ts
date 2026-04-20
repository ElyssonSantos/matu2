import { supabase } from '@/integrations/supabase/client';

/**
 * Send a global notification to all users
 */
export async function enviarNotificacaoGlobal(
  titulo: string,
  mensagem: string,
  orderId?: string,
  link?: string
) {
  await supabase.from('notifications').insert({
    title: titulo,
    message: mensagem,
    target: ['ALL'],
    order_id: orderId || null,
    link: link || null,
  });
}

/**
 * Send notification to a specific user
 */
export async function enviarNotificacaoParaUsuario(
  userId: string,
  titulo: string,
  mensagem: string,
  orderId?: string,
  link?: string
) {
  await supabase.from('notifications').insert({
    title: titulo,
    message: mensagem,
    target: [userId],
    order_id: orderId || null,
    link: link || null,
  });
}
