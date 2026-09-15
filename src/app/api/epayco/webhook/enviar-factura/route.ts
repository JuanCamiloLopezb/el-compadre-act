export const runtime = 'nodejs'; // <-- OBLIGATORIO para librerías de buffer como pdfkit

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generarFacturaPdfBuffer } from '../../../../../lib/generarFacturaPdf';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("--> Petición recibida en /api/enviar-factura para:", body.emailCliente);

    const { 
      emailCliente, 
      pedidoId, 
      fecha, 
      clienteNombre, 
      clienteDoc, 
      clienteTelefono, 
      direccion, 
      metodoPago, 
      items, 
      total 
    } = body;

    if (!emailCliente || !pedidoId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // Generar el Buffer del PDF
    const pdfBuffer = await generarFacturaPdfBuffer({
      pedidoId,
      fecha: fecha || new Date().toLocaleString('es-CO'),
      clienteNombre: clienteNombre || 'Cliente',
      clienteDoc: clienteDoc || '',
      clienteTelefono: clienteTelefono || '',
      direccion: direccion || 'Entrega a domicilio',
      metodoPago: metodoPago || 'Efectivo',
      items: items || [],
      total: Number(total) || 0,
    });

    const numeroFactura = `EXP-${pedidoId.slice(0, 8).toUpperCase()}`;

    // NOTA IMPORTANTE DE RESEND MODO PRUEBA:
    // Con onboarding@resend.dev, solo puedes enviar a tu correo de registro en Resend
    const destinatario = emailCliente;

    const { data, error } = await resend.emails.send({
      from: 'El Compadre <onboarding@resend.dev>',
      to: [destinatario],
      subject: `¡Muchas gracias por tu compra, ${clienteNombre || 'Compadre'}! 🥂 - Pedido #${pedidoId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <div style="text-align: center; background-color: #073b78; padding: 20px; border-radius: 6px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">¡Muchas gracias por tu compra! 🥂</h1>
            <p style="color: #d8c38f; margin: 5px 0 0 0; font-weight: bold;">EL COMPADRE LICORERÍA EXPRESS</p>
          </div>
          <div style="padding: 20px 0;">
            <p>Hola <strong>${clienteNombre || 'Compadre'}</strong>,</p>
            <p>Tu pedido <strong>#${numeroFactura}</strong> ha sido confirmado y ya se está alistando para entrega.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #073b78; padding: 12px; margin: 15px 0;">
              <p style="margin: 3px 0;"><strong>Dirección:</strong> ${direccion}</p>
              <p style="margin: 3px 0;"><strong>Método de Pago:</strong> ${metodoPago}</p>
              <p style="margin: 3px 0; font-size: 16px; color: #073b78;"><strong>Total:</strong> $${Number(total).toLocaleString('es-CO')} COP</p>
            </div>
            <p>Adjunto encontrarás tu factura en formato PDF.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Factura_${numeroFactura}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Error retornado por Resend:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log("--> Correo enviado exitosamente:", data);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error general en /api/enviar-factura:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}