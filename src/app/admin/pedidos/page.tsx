'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DetallePedido {
  id: string;
  cantidad: number;
  precio_unitario: number;
  productos: { nombre: string } | null;
}

interface Pedido {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  direccion: string;
  telefono: string;
  comentarios: string;
  fecha_confirmado?: string;
  fecha_preparacion?: string;
  fecha_despachado?: string;
  fecha_entregado?: string;
  detalle_pedidos: DetallePedido[];
}

const ESTADOS = [
  'PEDIDO CONFIRMADO',
  'PEDIDO EN PREPARACIÓN',
  'PEDIDO DESPACHADO',
  'PEDIDO ENTREGADO'
];

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        detalle_pedidos (
          id,
          cantidad,
          precio_unitario,
          productos ( nombre )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando pedidos:', error);
    } else {
      setPedidos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();

    // Suscripción en tiempo real para nuevos pedidos
    const channel = supabase
      .channel('cambios-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchPedidos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cambiarEstado = async (pedidoId: string, nuevoEstado: string) => {
    const ahora = new Date().toISOString();
    let updateData: any = { estado: nuevoEstado };

    // Guardar la hora exacta según el estado
    if (nuevoEstado === 'PEDIDO CONFIRMADO') updateData.fecha_confirmado = ahora;
    if (nuevoEstado === 'PEDIDO EN PREPARACIÓN') updateData.fecha_preparacion = ahora;
    if (nuevoEstado === 'PEDIDO DESPACHADO') updateData.fecha_despachado = ahora;
    if (nuevoEstado === 'PEDIDO ENTREGADO') updateData.fecha_entregado = ahora;

    const { error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedidoId);

    if (error) {
      alert('Error al actualizar el estado del pedido');
    } else {
      fetchPedidos();
    }
  };

  const formatearHora = (fechaIso?: string) => {
    if (!fechaIso) return null;
    return new Date(fechaIso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="p-10 font-bold text-center text-zinc-800">Cargando monitor de pedidos... 🛵</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">🛵 Despacho de Pedidos</h1>
            <p className="text-zinc-500">Monitor en vivo para controlar la logística de la licorería.</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Volver al Inventario</Button>
          </Link>
        </div>

        {/* Lista de Pedidos */}
        <div className="grid grid-cols-1 gap-6">
          {pedidos.length === 0 ? (
            <Card className="p-12 text-center text-zinc-500 font-medium">
              No hay pedidos registrados en este momento.
            </Card>
          ) : (
            pedidos.map((pedido) => (
              <Card key={pedido.id} className="shadow-sm border-zinc-200 overflow-hidden">
                <CardHeader className="bg-zinc-100 border-b border-zinc-200 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-black text-zinc-900">
                      Pedido #{pedido.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Recibido: {new Date(pedido.created_at).toLocaleString('es-CO')}
                    </CardDescription>
                  </div>
                  <span className="text-xl font-black text-green-600">
                    ${pedido.total.toLocaleString('es-CO')}
                  </span>
                </CardHeader>

                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Columna 1: Datos del Cliente y Envío */}
                  <div className="space-y-3 border-r md:border-zinc-200 pr-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Datos de Entrega</h4>
                    <div>
                      <p className="text-xs text-zinc-500">Teléfono:</p>
                      <p className="font-bold text-sm">{pedido.telefono || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Dirección:</p>
                      <p className="font-bold text-sm">{pedido.direccion || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Comentarios / Notas:</p>
                      <p className="text-xs italic bg-amber-50 text-amber-900 p-2 rounded-md border border-amber-200 mt-1">
                        {pedido.comentarios || 'Sin observaciones.'}
                      </p>
                    </div>
                  </div>

                  {/* Columna 2: Productos Solicitados */}
                  <div className="space-y-3 border-r md:border-zinc-200 pr-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Productos</h4>
                    <ul className="space-y-2 text-xs">
                      {pedido.detalle_pedidos?.map((item) => (
                        <li key={item.id} className="flex justify-between border-b border-zinc-100 pb-1">
                          <span className="font-semibold">{item.cantidad}x {item.productos?.nombre || 'Producto'}</span>
                          <span className="text-zinc-500">${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Columna 3: Control de Estado y Tiempos */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Estado del Pedido</h4>
                      <select
                        value={pedido.estado}
                        onChange={(e) => cambiarEstado(pedido.id, e.target.value)}
                        className="w-full font-bold text-sm p-2.5 rounded-lg border border-zinc-300 bg-white focus:ring-2 focus:ring-black"
                      >
                        {ESTADOS.map((est) => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                    </div>

                    {/* Historial de Horas */}
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-[11px] space-y-1">
                      <p className="font-bold text-zinc-700 border-b pb-1 mb-1">Línea de tiempo:</p>
                      <div className="flex justify-between">
                        <span>Confirmado:</span>
                        <span className="font-bold">{formatearHora(pedido.fecha_confirmado) || '--:--'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>En preparación:</span>
                        <span className="font-bold">{formatearHora(pedido.fecha_preparacion) || '--:--'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Despachado:</span>
                        <span className="font-bold">{formatearHora(pedido.fecha_despachado) || '--:--'}</span>
                      </div>
                      <div className="flex justify-between text-green-700 font-bold">
                        <span>Entregado:</span>
                        <span>{formatearHora(pedido.fecha_entregado) || '--:--'}</span>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </main>
  );
}