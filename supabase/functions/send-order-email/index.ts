import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, type } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, profiles(full_name, id)')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Fetch order items
    const { data: items, error: itemsError } = await supabaseClient
      .from('order_items')
      .select('*, products(name, price)')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    let emailContent = '';
    let subject = '';
    let toEmail = '';

    if (type === 'new_order') {
      // Email for admins/managers when new order is created
      subject = `Novo Pedido #${orderId.substring(0, 8)} - Sua Loja`;
      toEmail = 'admin@amazonabeauty.com'; // Replace with actual admin email
      
      emailContent = `
        <h1>Novo Pedido Recebido!</h1>
        <p><strong>Pedido:</strong> #${orderId.substring(0, 8)}</p>
        <p><strong>Cliente:</strong> ${order.profiles?.full_name || 'Cliente'}</p>
        <p><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <h2>Itens:</h2>
        <ul>
          ${items.map(item => `
            <li>${item.products.name} - ${item.quantity}x - R$ ${item.price.toFixed(2)}</li>
          `).join('')}
        </ul>
        <p><a href="${Deno.env.get('SUPABASE_URL')}/admin/pedidos">Ver no Painel Administrativo</a></p>
      `;
    } else if (type === 'status_update') {
      // Email for customer when order status changes
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      subject = `Atualização do Pedido #${orderId.substring(0, 8)} - Sua Loja`;
      toEmail = profile?.id || ''; // In production, you'd fetch the user's email from auth.users
      
      emailContent = `
        <h1>Seu Pedido Foi Atualizado!</h1>
        <p>Olá ${order.profiles?.full_name || 'Cliente'},</p>
        <p>Seu pedido #${orderId.substring(0, 8)} foi atualizado.</p>
        <p><strong>Novo Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>
        <p><strong>Data:</strong> ${new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
        <p><a href="${Deno.env.get('SUPABASE_URL')}/pedido/${orderId}">Acompanhar Pedido</a></p>
        <p>Obrigado por comprar na Sua Loja!</p>
      `;
    }

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sua Loja <onboarding@resend.dev>',
        to: [toEmail],
        subject: subject,
        html: emailContent,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
