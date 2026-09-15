'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
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
  fecha_confirmado?: string;
  fecha_preparacion?: string;
  fecha_despachado?: string;
  fecha_entregado?: string;
  detalle_pedidos: DetallePedido[];
}

const PASOS_ESTADO = [
  { clave: 'PEDIDO CONFIRMADO', titulo: 'Confirmado', icono: '📝' },
  { clave: 'PEDIDO EN PREPARACIÓN', titulo: 'En Cava', icono: '🍾' },
  { clave: 'PEDIDO DESPACHADO', titulo: 'En Camino', icono: '🛵' },
  { clave: 'PEDIDO ENTREGADO', titulo: 'Entregado', icono: '🎉' },
];

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMisPedidos = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

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
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setPedidos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMisPedidos();

    // Actualizaciones en tiempo real cuando el admin cambia el estado
    const channel = supabase
      .channel('mis-pedidos-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => {
        fetchMisPedidos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatearHora = (fechaIso?: string) => {
    if (!fechaIso) return null;
    return new Date(fechaIso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  const obtenerIndiceEstado = (estadoActual: string) => {
    return PASOS_ESTADO.findIndex(p => p.clave === estadoActual);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-zinc-800">Cargando tus compras... 📦</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
          <div>
            <h1 className="text-3xl font-black">📦 Mis Pedidos</h1>
            <p className="text-xs text-zinc-500">Rastrea tus domicilios en tiempo real y revisa tus compras pasadas.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="font-bold">Volver a la Tienda</Button>
          </Link>
        </div>

        {/* Lista de Pedidos */}
        {pedidos.length === 0 ? (
          <Card className="p-12 text-center text-zinc-500 font-medium bg-white">
            Aún no has realizado pedidos en Los Compadres 🍾<br />
            <Link href="/" className="inline-block mt-4">
              <Button className="font-bold bg-zinc-900 text-white">Explorar Catálogo</Button>
            </Link>
          </Card>
        ) : (
          pedidos.map((pedido) => {
            const pasoActualIndex = obtenerIndiceEstado(pedido.estado);
            const esActivo = pedido.estado !== 'PEDIDO ENTREGADO';

            return (
              <Card key={pedido.id} className="shadow-sm border-zinc-200 overflow-hidden bg-white">
                <CardHeader className="bg-zinc-100/70 border-b border-zinc-200 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-black text-zinc-900 flex items-center gap-2">
                      <span>Pedido #{pedido.id.slice(0, 8)}</span>
                      {esActivo && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                          En Progreso
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(pedido.created_at).toLocaleString('es-CO')}
                    </CardDescription>
                  </div>
                  <span className="text-lg font-black text-green-600">
                    ${pedido.total.toLocaleString('es-CO')}
                  </span>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  
                  {/* --- LÍNEA DE TIEMPO DEL ESTADO (Solo para pedidos en curso) --- */}
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Estado del Envío</h4>
                    
                    <div className="grid grid-cols-4 gap-2 relative">
                      {PASOS_ESTADO.map((paso, index) => {
                        const estaCompletado = index <= pasoActualIndex;
                        const esActual = index === pasoActualIndex;

                        return (
                          <div key={paso.clave} className="flex flex-col items-center text-center space-y-1.5 z-10">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                                esActual
                                  ? 'bg-zinc-900 text-white ring-4 ring-zinc-200 scale-110'
                                  : estaCompletado
                                  ? 'bg-green-600 text-white'
                                  : 'bg-zinc-200 text-zinc-400'
                              }`}
                            >
                              {paso.icono}
                            </div>
                            
                            <span className={`text-[11px] font-bold ${estaCompletado ? 'text-zinc-900' : 'text-zinc-400'}`}>
                              {paso.titulo}
                            </span>

                            {/* Muestra la hora de actualización si ya pasó por ahí */}
                            <span className="text-[10px] text-zinc-400 font-medium min-h-[14px]">
                              {index === 0 && formatearHora(pedido.fecha_confirmado)}
                              {index === 1 && formatearHora(pedido.fecha_preparacion)}
                              {index === 2 && formatearHora(pedido.fecha_despachado)}
                              {index === 3 && formatearHora(pedido.fecha_entregado)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumen de Productos y Dirección */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <h4 className="font-bold text-zinc-700 mb-2">Productos Solicitados:</h4>
                      <ul className="space-y-1.5 border-l-2 border-zinc-200 pl-3">
                        {pedido.detalle_pedidos?.map((item) => (
                          <li key={item.id} className="flex justify-between text-zinc-600">
                            <span>{item.cantidad}x {item.productos?.nombre || 'Producto'}</span>
                            <span className="font-semibold text-zinc-900">${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 space-y-1">
                      <h4 className="font-bold text-zinc-700">Dirección de Entrega:</h4>
                      <p className="text-zinc-600">{pedido.direccion || 'Entrega en tienda'}</p>
                      <p className="text-zinc-500 text-[11px]">Teléfono: {pedido.telefono}</p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })
        )}

      </div>
    </main>
  );
}