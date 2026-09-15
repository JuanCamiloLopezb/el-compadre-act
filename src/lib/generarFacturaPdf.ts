import PDFDocument from 'pdfkit';

export interface FacturaPdfPayload {
  pedidoId: string;
  fecha: string;
  clienteNombre: string;
  clienteDoc: string;
  clienteTelefono: string;
  direccion: string;
  metodoPago: string;
  items: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  total: number;
}

export function generarFacturaPdfBuffer(datos: FacturaPdfPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // --- ENCABEZADO ---
    doc.rect(0, 0, 600, 15).fill('#073b78'); // Barra decorativa superior

    doc.fillColor('#073b78').fontSize(22).font('Helvetica-Bold').text('EL COMPADRE', 40, 35);
    doc.fillColor('#b88a3b').fontSize(11).font('Helvetica-Bold').text('LICORERÍA EXPRESS', 40, 60);

    doc.fillColor('#4b5563').fontSize(9).font('Helvetica')
      .text('NIT: 901.452.889-1', 40, 75)
      .text('Calle 45E #15B-81, Soledad - Atlántico', 40, 88)
      .text('WhatsApp: +57 324 563 0448', 40, 101);

    // Meta Factura (Lado Derecho)
    doc.fillColor('#073b78').fontSize(14).font('Helvetica-Bold')
      .text('FACTURA ELECTRÓNICA', 360, 35, { align: 'right' });
    
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
      .text(`Nº: EXP-${datos.pedidoId.slice(0, 8).toUpperCase()}`, 360, 55, { align: 'right' });
    doc.fontSize(9).font('Helvetica')
      .text(`Fecha: ${datos.fecha}`, 360, 70, { align: 'right' })
      .text(`Pago: ${datos.metodoPago.toUpperCase()}`, 360, 85, { align: 'right' });

    // Línea separadora
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, 120).lineTo(555, 120).stroke();

    // --- DATOS DEL CLIENTE ---
    doc.rect(40, 130, 515, 65).fill('#f9fafb').stroke('#e5e7eb');
    doc.fillColor('#073b78').fontSize(10).font('Helvetica-Bold').text('DATOS DEL RECEPTOR', 50, 140);

    doc.fillColor('#111827').fontSize(9).font('Helvetica')
      .text(`Cliente: ${datos.clienteNombre}`, 50, 155)
      .text(`Identificación: ${datos.clienteDoc || '222222222222'}`, 50, 168)
      .text(`Dirección de Entrega: ${datos.direccion}`, 280, 155)
      .text(`Teléfono: ${datos.clienteTelefono || 'No registrado'}`, 280, 168);

    // --- TABLA DE ARTÍCULOS ---
    let y = 215;
    doc.rect(40, y, 515, 20).fill('#073b78');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      .text('CANT', 50, y + 5)
      .text('DESCRIPCIÓN', 110, y + 5)
      .text('PRECIO UNIT.', 370, y + 5, { align: 'right', width: 80 })
      .text('SUBTOTAL', 470, y + 5, { align: 'right', width: 75 });

    y += 25;
    doc.font('Helvetica').fontSize(9);

    datos.items.forEach((it, idx) => {
      if (idx % 2 === 1) {
        doc.rect(40, y - 4, 515, 18).fill('#fbfbfb');
      }

      doc.fillColor('#111827')
        .text(`${it.cantidad}`, 50, y)
        .text(it.nombre, 110, y, { width: 250, lineBreak: false })
        .text(`$${it.precioUnitario.toLocaleString('es-CO')}`, 370, y, { align: 'right', width: 80 })
        .font('Helvetica-Bold')
        .text(`$${it.subtotal.toLocaleString('es-CO')}`, 470, y, { align: 'right', width: 75 })
        .font('Helvetica');

      y += 18;
    });

    // Línea final de tabla
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, y + 5).lineTo(555, y + 5).stroke();

    // --- TOTALES ---
    y += 20;
    doc.rect(360, y, 195, 30).fill('#073b78');
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text('TOTAL A PAGAR:', 370, y + 9)
      .text(`$${datos.total.toLocaleString('es-CO')}`, 450, y + 9, { align: 'right', width: 95 });

    // --- PIE LEGAL ---
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
      .text('El exceso de alcohol es perjudicial para la salud. Ley 30 de 1986.', 40, 750, { align: 'center', width: 515 })
      .text('Prohíbase el expendio de bebidas embriagantes a menores de edad. Ley 124 de 1994.', 40, 762, { align: 'center', width: 515 })
      .text('¡Gracias por preferir a El Compadre!', 40, 774, { align: 'center', width: 515 });

    doc.end();
  });
}