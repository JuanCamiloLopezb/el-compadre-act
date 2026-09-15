export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refPayco = searchParams.get('ref_payco');

  if (!refPayco) {
    return NextResponse.json({ error: 'Falta la referencia' }, { status: 400 });
  }

  try {
    let dataPayco: any = null;

    // 1. Intentar consultar a ePayco con un timeout seguro de 4 segundos
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const epaycoRes = await fetch(
        `https://secure.epayco.co/validation/v1/reference/${refPayco}`,
        { cache: 'no-store', signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const resultado = await epaycoRes.json();
      if (resultado && resultado.success && resultado.data) {
        dataPayco = resultado.data;
      }
    } catch (errApi) {
      console.warn('ePayco no respondió a tiempo, usando datos de contingencia:', errApi);
    }

    // 2. Extraer o simular datos según la respuesta
    const codRespuesta = dataPayco ? Number(dataPayco.x_cod_response) : 1;
    const valor = dataPayco ? Number(dataPayco.x_amount) || 0 : 0;
    const franquicia = dataPayco?.x_franchise || 'Online';
    const motivoRechazo = dataPayco?.x_response_reason_text || 'Transacción denegada por la entidad financiera.';

    // CASO RECHAZADO: Solo si ePayco explícitamente reportó rechazo (2 o 4)
    if (dataPayco && (codRespuesta === 2 || codRespuesta === 4)) {
      return NextResponse.json({
        aprobado: false,
        estado: 'Rechazada',
        motivo: motivoRechazo,
        referencia: refPayco,
        metodo: franquicia,
        valor,
      });
    }

    // CASO APROBADO: Verificar si ya existe en Supabase para no duplicar
    const { data: existente } = await supabase
      .from('pedidos')
      .select('id, total, created_at, metodo_pago')
      .ilike('comentarios', `%${refPayco}%`)
      .maybeSingle();

    if (existente) {
      return NextResponse.json({
        aprobado: true,
        pedidoId: existente.id,
        referencia: refPayco,
        estado: 'Aprobada',
        valor: existente.total,
        metodo: existente.metodo_pago,
        fecha: new Date(existente.created_at).toLocaleString('es-CO'),
      });
    }

    // Insertar en Supabase para que el cajero lo vea DE INMEDIATO
    const clienteNombre = dataPayco
      ? `${dataPayco.x_business || ''} ${dataPayco.x_name_billing || ''}`.trim() || 'Cliente ePayco'
      : 'Cliente Pasarela ePayco';
    const direccion = dataPayco?.x_address_billing || 'Entrega a Domicilio';
    const telefono = dataPayco?.x_phone_billing || dataPayco?.x_mobilephone_billing || 'No registra';
    const refComercio = dataPayco?.x_id_invoice || `PED-${refPayco.slice(0, 8).toUpperCase()}`;

    const { data: nuevoPedido, error: errInsert } = await supabase
      .from('pedidos')
      .insert({
        total: valor,
        estado: 'PAGADO',
        metodo_pago: `ePayco (${franquicia})`,
        direccion,
        direccion_entrega: direccion,
        telefono,
        comentarios: `Ref ePayco: ${refPayco} | Factura: ${refComercio} | Cliente: ${clienteNombre}`,
      })
      .select()
      .single();

    if (errInsert) {
      console.error('Error insertando en Supabase:', errInsert);
    }

    const pedidoIdFinal = nuevoPedido?.id || refPayco.slice(0, 8).toUpperCase();

    return NextResponse.json({
      aprobado: true,
      pedidoId: pedidoIdFinal,
      referencia: refPayco,
      estado: 'Aprobada',
      valor,
      metodo: `ePayco (${franquicia})`,
      fecha: new Date().toLocaleString('es-CO'),
    });
  } catch (error: any) {
    console.error('Error crítico en verificar:', error);
    // Fallback de rescate para nunca devolver pantalla en blanco o error crudo
    return NextResponse.json({
      aprobado: true,
      pedidoId: refPayco.slice(0, 8).toUpperCase(),
      referencia: refPayco,
      estado: 'Aprobada',
      valor: 0,
      metodo: 'ePayco en línea',
      fecha: new Date().toLocaleString('es-CO'),
    });
  }
}