import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializamos un cliente de Supabase administrativo con Service Role (o la ANON key si las RLS lo permiten)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    // ePayco envía los datos de confirmación por medio de x-www-form-urlencoded o JSON
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);

    // Extraer campos clave que ePayco envía en su Webhook/Confirmación
    const x_cod_response = params.get('x_cod_response') || params.get('x_cod_transaction_state');
    const x_id_invoice = params.get('x_id_invoice'); // Corresponde al ID de nuestro pedido o ref
    const x_ref_payco = params.get('x_ref_payco');

    console.log(`[ePayco Webhook] Recibida confirmación para Invoice: ${x_id_invoice}, Estado: ${x_cod_response}`);

    // x_cod_response: 1 = Aprobada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida
    if (x_cod_response === '1') {
      
      // 1. Verificar si el pedido existe y no ha sido procesado previamente
      const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .select('*, detalle_pedidos(*)')
        .eq('id', x_id_invoice)
        .single();

      if (errPedido || !pedido) {
        console.error('[ePayco Webhook] Pedido no encontrado:', x_id_invoice);
        return NextResponse.json({ message: 'Pedido no encontrado' }, { status: 404 });
      }

      // Evitamos procesar doble si ya estaba confirmado
      if (pedido.estado !== 'PEDIDO CONFIRMADO') {
        
        // 2. Actualizar estado del pedido a CONFIRMADO y guardar la hora exacta
        const ahora = new Date().toISOString();
        await supabase
          .from('pedidos')
          .update({
            estado: 'PEDIDO CONFIRMADO',
            fecha_confirmado: ahora,
          })
          .eq('id', x_id_invoice);

        // 3. Descontar el stock de cada producto comprado
        if (pedido.detalle_pedidos && pedido.detalle_pedidos.length > 0) {
          for (const item of pedido.detalle_pedidos) {
            await supabase.rpc('descontar_stock', {
              p_producto_id: item.producto_id,
              p_cantidad: item.cantidad
            });
          }
        }

        console.log(`[ePayco Webhook] Pedido ${x_id_invoice} actualizado a CONFIRMADO y stock descontado.`);
      }

    } else if (x_cod_response === '2' || x_cod_response === '4') {
      // Si el pago fue rechazado o fallido, podemos marcarlo como CANCELADO
      await supabase
        .from('pedidos')
        .update({ estado: 'CANCELADO' })
        .eq('id', x_id_invoice);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('[ePayco Webhook Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}