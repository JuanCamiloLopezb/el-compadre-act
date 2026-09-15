'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { imprimirFactura } from '../../lib/imprimirFactura';
import { LogOut, Receipt, CheckCircle, Clock, Truck, ShieldAlert } from 'lucide-react';

export default function CajeroPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [repartidores, setRepartidores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return window.location.replace('/login');

      // Validar rol
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol, nombre')
        .eq('id', session.user.id)
        .single();

      if (perfil?.rol !== 'cajero' && perfil?.rol !== 'admin') {
        alert('Acceso restringido solo para personal de caja.');
        return window.location.replace('/');
      }

      setUsuario({ ...session.user, ...perfil });
      await Promise.all([cargarPedidos(), cargarRepartidores()]);
      setLoading(false);
    }
    init();
  }, []);

  const cargarPedidos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, detalle_pedidos(*, productos(nombre))')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    setPedidos(data || []);
  };

  const cargarRepartidores = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre')
      .eq('rol', 'repartidor');
    setRepartidores(data || []);
  };

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else cargarPedidos();
  };

  const asignarRepartidor = async (pedidoId: string, repartidorId: string) => {
    const valor = repartidorId.trim() !== '' ? repartidorId : null;
    const { error } = await supabase.from('pedidos').update({ repartidor_id: valor }).eq('id', pedidoId);
    if (error) alert('Error asignando repartidor: ' + error.message);
    else cargarPedidos();
  };

  const handleImprimir = (pedido: any) => {
    // Parseo de observaciones por si vienen campos como "Cliente: ... | Doc: ..."
    let docCliente = '';
    let nombreCliente = '';
    if (pedido.comentarios) {
      const matchDoc = pedido.comentarios.match(/Doc:\s*([^|]+)/i);
      if (matchDoc) docCliente = matchDoc[1].trim();

      const matchNom = pedido.comentarios.match(/Cliente:\s*([^|]+)/i);
      if (matchNom) nombreCliente = matchNom[1].trim();
    }

    const itemsFactura = (pedido.detalle_pedidos || []).map((det: any) => ({
      nombre: det.productos?.nombre || 'Artículo de licor',
      cantidad: det.cantidad || 1,
      precioUnitario: Number(det.precio_unitario) || 0,
      subtotal: (Number(det.precio_unitario) || 0) * (det.cantidad || 1),
    }));

    imprimirFactura({
      pedidoId: pedido.id,
      fecha: new Date(pedido.created_at || Date.now()).toLocaleString('es-CO'),
      cliente: {
        nombre: nombreCliente || 'Cliente Mostrador / Domicilio',
        documento: docCliente,
        telefono: pedido.telefono,
        direccion: pedido.direccion,
        observaciones: pedido.comentarios,
      },
      cajeroNombre: usuario?.nombre || usuario?.email?.split('@')[0],
      metodoPago: pedido.metodo_pago || 'Efectivo',
      items: itemsFactura,
      total: Number(pedido.total) || 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center font-bold text-[#073b78] gap-3">
        <Receipt className="w-8 h-8 animate-pulse text-[#b88a3b]" />
        <span>Accediendo al módulo de caja...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans pb-12">
      {/* HEADER CAJERO */}
      <header className="bg-[#073b78] text-white p-4 shadow-md sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#b88a3b] p-2 rounded text-white">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Módulo de Caja</h1>
            <p className="text-[11px] text-blue-200 mt-1">Operador: {usuario?.nombre || usuario?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={cargarPedidos} variant="outline" size="sm" className="bg-white/10 text-white border-white/20 text-xs">
            Refrescar
          </Button>
          <Button 
            onClick={() => supabase.auth.signOut().then(() => window.location.replace('/'))}
            variant="ghost" 
            size="sm" 
            className="text-red-300 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-1" /> Salir
          </Button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-zinc-800">Órdenes Activas ({pedidos.length})</h2>
          <span className="text-xs text-zinc-500">Gestión de pagos y despachos</span>
        </div>

        {pedidos.length === 0 ? (
          <Card className="p-12 text-center text-zinc-400 bg-white">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="font-bold">No hay pedidos pendientes en cola.</p>
          </Card>
        ) : (
          pedidos.map((p) => (
            <Card key={p.id} className="p-5 bg-white shadow-sm border-l-4 border-l-[#073b78] space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold bg-blue-50 text-[#073b78] px-2.5 py-1 rounded text-sm">
                    #{p.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(p.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-green-700">
                    ${p.total?.toLocaleString('es-CO')}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded uppercase ${
                    p.estado === 'PAGADO' || p.estado === 'PEDIDO ENTREGADO' ? 'bg-green-100 text-green-800' :
                    p.estado === 'CANCELADO' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.estado}
                  </span>
                </div>
              </div>

              {/* DETALLES DE LA ORDEN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 bg-zinc-50 p-3 rounded border">
                  <p className="font-bold text-zinc-700 border-b pb-1">Cliente & Entrega</p>
                  <p><strong>Dirección:</strong> {p.direccion}</p>
                  <p><strong>Teléfono:</strong> {p.telefono}</p>
                  <p><strong>Método de Pago:</strong> <span className="font-bold text-[#073b78]">{p.metodo_pago}</span></p>
                  {p.comentarios && (
                    <p className="mt-1 bg-amber-50 p-1.5 rounded border border-amber-200 text-zinc-700 italic">
                      "{p.comentarios}"
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 bg-zinc-50 p-3 rounded border">
                  <p className="font-bold text-zinc-700 border-b pb-1">Artículos</p>
                  <ul className="space-y-1">
                    {p.detalle_pedidos?.map((item: any) => (
                      <li key={item.id} className="flex justify-between">
                        <span><strong>{item.cantidad}x</strong> {item.productos?.nombre}</span>
                        <span className="text-zinc-500">${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN RÁPIDA PARA CAJA */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                {/* Asignación de Repartidor */}
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-500" />
                  <select
                    value={p.repartidor_id || ''}
                    onChange={(e) => asignarRepartidor(p.id, e.target.value)}
                    className="border text-xs p-1.5 rounded bg-zinc-50 font-medium outline-none"
                  >
                    <option value="">Sin Domiciliario</option>
                    {repartidores.map(r => (
                      <option key={r.id} value={r.id}>Moto: {r.nombre}</option>
                    ))}
                  </select>
                </div>

            

                {/* Acciones de cambio de estado */}
                <div className="flex flex-wrap gap-2">
                  {p.estado === 'PENDIENTE DE PAGO' && (
                    <Button 
                      onClick={() => actualizarEstado(p.id, 'PAGADO')} 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmar Pago Recibido
                    </Button>
                  )}

                  {p.estado === 'PAGADO' && (
                    <Button 
                      onClick={() => actualizarEstado(p.id, 'PEDIDO EN PREPARACION')} 
                      size="sm" 
                      className="bg-[#073b78] hover:bg-[#052d5e] text-white text-xs"
                    >
                      Mandar a Preparación
                    </Button>
                  )}

                  {p.estado === 'PEDIDO EN PREPARACION' && (
                    <Button 
                      onClick={() => actualizarEstado(p.id, 'PEDIDO DESPACHADO')} 
                      size="sm" 
                      className="bg-[#b88a3b] hover:bg-[#a37a34] text-white text-xs"
                    >
                      Marcar como Despachado
                    </Button>
                  )}

                  {p.estado !== 'CANCELADO' && p.estado !== 'PEDIDO ENTREGADO' && (
                    <Button 
                      onClick={() => {
                        if (confirm('¿Deseas cancelar esta orden?')) actualizarEstado(p.id, 'CANCELADO');
                      }} 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:bg-red-50 text-xs"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
              <Button
  type="button"
  onClick={() => handleImprimir(p)}
  variant="outline"
  size="sm"
  className="border-[#073b78] text-[#073b78] hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
>
  <Printer className="w-3.5 h-3.5" /> Emitir Factura
</Button>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}