export interface FacturaDatos {
  pedidoId: string;
  fecha: string;
  cliente: {
    nombre?: string;
    documento?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    observaciones?: string;
  };
  cajeroNombre?: string;
  metodoPago: string;
  items: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  costoEnvio?: number;
  descuento?: number;
  total: number;
}

export function imprimirFactura(datos: FacturaDatos) {
  const ventana = window.open('', '_blank', 'width=380,height=700');
  if (!ventana) {
    alert('Por favor habilita las ventanas emergentes (popups) para imprimir el ticket.');
    return;
  }

  const subtotalProductos = datos.items.reduce((acc, it) => acc + it.subtotal, 0);
  const costoEnvio = datos.costoEnvio || 0;
  const descuento = datos.descuento || 0;

  // Base gravable e Impoconsumo estimado (8% para licores y consumo en Colombia)
  const baseEstimada = Math.round(subtotalProductos / 1.08);
  const impoConsumo = subtotalProductos - baseEstimada;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Ticket #${datos.pedidoId.slice(0, 8).toUpperCase()}</title>
      <style>
        /* Ajuste para impresora térmica de rollo continuo de 80mm / 58mm */
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          width: 76mm;
          margin: 0 auto;
          padding: 8px 4px 20px 4px;
          font-family: 'Courier New', Courier, monospace, 'Lucida Console';
          font-size: 11px;
          line-height: 1.25;
          color: #000;
          background: #fff;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }

        .linea {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .linea-doble {
          border-top: 2px solid #000;
          margin: 6px 0;
        }

        .titulo-comercio {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .subtitulo-comercio {
          font-size: 10px;
        }

        .meta-info {
          font-size: 10px;
          margin-top: 4px;
        }

        .seccion-cliente {
          font-size: 10.5px;
          word-break: break-word;
        }

        /* Tabla de productos en tirilla */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
        }
        th {
          font-size: 10px;
          padding-bottom: 3px;
          border-bottom: 1px dashed #000;
        }
        td {
          padding: 3px 0;
          vertical-align: top;
          font-size: 10.5px;
        }
        .col-cant { width: 14%; }
        .col-desc { width: 56%; }
        .col-total { width: 30%; text-align: right; }

        .totales-tabla {
          width: 100%;
          margin-top: 4px;
        }
        .totales-tabla td {
          padding: 2px 0;
          font-size: 11px;
        }
        .total-destacado td {
          font-size: 14px;
          font-weight: 900;
          padding: 5px 0;
        }

        .footer {
          margin-top: 12px;
          font-size: 9.5px;
          text-align: center;
        }

        @media print {
          body {
            width: 76mm;
            padding: 2mm 1mm;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- ENCABEZADO FISCAL -->
      <div class="text-center">
        <div class="titulo-comercio">EL COMPADRE</div>
        <div class="subtitulo-comercio bold">LICORERÍA EXPRESS</div>
        <div class="subtitulo-comercio">NIT: 901.452.889-1</div>
        <div class="subtitulo-comercio">Calle 45E #15B-81, Soledad - Atl.</div>
        <div class="subtitulo-comercio">Tel / WhatsApp: +57 324 563 0448</div>
        <div class="subtitulo-comercio">Impuesto al Consumo de Licores</div>
      </div>

      <div class="linea"></div>

      <!-- DATOS DE LA VENTA / TICKET -->
      <div class="meta-info">
        <div><strong>TICKET DE VENTA:</strong> #${datos.pedidoId.slice(0, 8).toUpperCase()}</div>
        <div><strong>FECHA:</strong> ${datos.fecha}</div>
        <div><strong>CAJERO(A):</strong> ${datos.cajeroNombre || 'Caja Principal'}</div>
      </div>

      <div class="linea"></div>

      <!-- DATOS DEL COMPRADOR / ENTREGA -->
      <div class="seccion-cliente">
        <div><strong>CLIENTE:</strong> ${datos.cliente.nombre || 'Consumidor Final'}</div>
        <div><strong>C.C./NIT:</strong> ${datos.cliente.documento || '222222222222'}</div>
        <div><strong>TELÉFONO:</strong> ${datos.cliente.telefono || 'Sin teléfono'}</div>
        <div><strong>DIRECCIÓN:</strong> ${datos.cliente.direccion || 'Entrega en Mostrador'}</div>
        <div><strong>MÉTODO PAGO:</strong> <span class="bold uppercase">${datos.metodoPago}</span></div>
        ${datos.cliente.observaciones ? `<div style="margin-top:2px;"><strong>OBS:</strong> <em>${datos.cliente.observaciones}</em></div>` : ''}
      </div>

      <div class="linea"></div>

      <!-- ÍTEMS / PRODUCTOS -->
      <table>
        <thead>
          <tr>
            <th class="col-cant text-left">CANT</th>
            <th class="col-desc text-left">DESCRIPCIÓN</th>
            <th class="col-total text-right">VALOR</th>
          </tr>
        </thead>
        <tbody>
          ${datos.items.map(it => `
            <tr>
              <td class="col-cant bold text-left">${it.cantidad}x</td>
              <td class="col-desc text-left">
                ${it.nombre}
                <div style="font-size: 9px; color: #333;">@ $${it.precioUnitario.toLocaleString('es-CO')}</div>
              </td>
              <td class="col-total bold text-right">$${it.subtotal.toLocaleString('es-CO')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="linea"></div>

      <!-- LIQUIDACIÓN DE TOTALES -->
      <table class="totales-tabla">
        <tr>
          <td class="text-left">SUBTOTAL PRODUCTOS:</td>
          <td class="text-right">$${subtotalProductos.toLocaleString('es-CO')}</td>
        </tr>
        ${impoConsumo > 0 ? `
          <tr>
            <td class="text-left">Impoconsumo Incl. (8%):</td>
            <td class="text-right">$${impoConsumo.toLocaleString('es-CO')}</td>
          </tr>
        ` : ''}
        ${descuento > 0 ? `
          <tr>
            <td class="text-left">DESCUENTO CUPÓN:</td>
            <td class="text-right">-$${descuento.toLocaleString('es-CO')}</td>
          </tr>
        ` : ''}
        ${costoEnvio > 0 ? `
          <tr>
            <td class="text-left">VALOR DOMICILIO:</td>
            <td class="text-right">$${costoEnvio.toLocaleString('es-CO')}</td>
          </tr>
        ` : ''}
      </table>

      <div class="linea-doble"></div>

      <table class="totales-tabla">
        <tr class="total-destacado">
          <td class="text-left">TOTAL A PAGAR:</td>
          <td class="text-right">$${datos.total.toLocaleString('es-CO')}</td>
        </tr>
      </table>

      <div class="linea"></div>

      <!-- PIE LEGAL Y SANITARIO -->
      <div class="footer">
        <div class="bold">¡GRACIAS POR TU COMPRA!</div>
        <div style="margin-top: 4px;">El exceso de alcohol es perjudicial para la salud. Ley 30 de 1986.</div>
        <div>Prohíbase el expendio de bebidas embriagantes a menores de edad.</div>
        <div style="margin-top: 6px;">*** Conserve este comprobante ***</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  ventana.document.open();
  ventana.document.write(htmlContent);
  ventana.document.close();
}