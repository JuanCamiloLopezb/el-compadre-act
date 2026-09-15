'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  RefreshCw, 
  ArrowLeft, 
  Receipt 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

function ContenidoPedidoConfirmado() {
  const searchParams = useSearchParams();
  const refPayco = searchParams.get('ref_payco');
  const pedidoId = searchParams.get('id');

  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<{
    aprobado: boolean;
    pedidoId?: string;
    referencia?: string;
    metodo?: string;
    valor?: number;
    fecha?: string;
    motivo?: string;
  } | null>(null);

  useEffect(() => {
    // 1. Caso ePayco
    if (refPayco) {
      setDatos({
        aprobado: true,
        pedidoId: refPayco.slice(0, 8).toUpperCase(),
        referencia: refPayco,
        metodo: 'ePayco (Transferencia/Tarjeta)',
        valor: 0,
        fecha: new Date().toLocaleString('es-CO'),
      });

      setCargando(false);
      useCartStore.getState().clearCart();

      fetch(`/api/epayco/verificar?ref_payco=${refPayco}`).catch((err) =>
        console.error('Error silencioso:', err)
      );
    } 
    // 2. Caso Efectivo / Pedido Local
    else if (pedidoId) {
      supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single()
        .then(({ data: pedido }) => {
          if (pedido) {
            setDatos({
              aprobado: true,
              pedidoId: pedido.id.slice(0, 8).toUpperCase(),
              referencia: `PED-${pedido.id.slice(0, 8).toUpperCase()}`,
              metodo: pedido.metodo_pago,
              valor: pedido.total,
              fecha: new Date(pedido.created_at).toLocaleString('es-CO'),
            });
            useCartStore.getState().clearCart();
          }
          setCargando(false);
        })
        .catch(() => {
          setCargando(false);
        });
    } else {
      setCargando(false);
    }
  }, [refPayco, pedidoId]);

  if (cargando) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <RefreshCw className="w-10 h-10 text-[#073b78] animate-spin" />
        <div>
          <h2 className="text-base font-bold text-zinc-800">Verificando tu transacción...</h2>
          <p className="text-xs text-zinc-400 mt-1">Cargando...</p>
        </div>
      </div>
    );
  }

  if (datos && !datos.aprobado) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card className="bg-white border-red-200 shadow-md overflow-hidden rounded-2xl">
          <div className="p-6 text-center text-white bg-red-600">
            <XCircle className="w-16 h-16 mx-auto mb-2 text-white" />
            <h1 className="text-xl font-bold">Transacción Rechazada</h1>
            <p className="text-xs text-red-100 mt-1">El pago no pudo ser aprobado.</p>
          </div>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 font-medium">Motivo:</span>
                <span className="font-bold text-red-700 text-right">{datos.motivo || 'Rechazo bancario'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 font-medium">Referencia:</span>
                <span className="font-mono font-bold text-zinc-800">{datos.referencia}</span>
              </div>
            </div>
            <div className="pt-2 space-y-2">
              <Link href="/checkout" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-11 flex items-center justify-center gap-2 cursor-pointer shadow">
                  <ArrowLeft className="w-4 h-4" /> Intentar Nuevamente
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <Card className="bg-white border-zinc-200 shadow-md overflow-hidden rounded-2xl">
        <div className="p-6 text-center text-white bg-emerald-600">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-2 text-white" />
          <h1 className="text-xl font-bold">¡Pedido Confirmado!</h1>
          <p className="text-xs text-emerald-100 mt-1">
            Tu pago fue procesado correctamente.
          </p>
        </div>
        <CardContent className="p-6 space-y-4 text-xs">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <span className="text-[11px] font-bold text-[#073b78] uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
              <Receipt className="w-4 h-4" /> Número de Orden
            </span>
            <span className="text-2xl font-black text-[#073b78] font-mono tracking-tight block">
              #{datos?.pedidoId}
            </span>
          </div>
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium">Método de Pago:</span>
              <span className="font-semibold text-zinc-800">{datos?.metodo}</span>
            </div>
            {Boolean(datos?.valor && datos.valor > 0) && (
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-sm font-black">
                <span className="text-zinc-800">Total Pagado:</span>
                <span className="text-emerald-700">${Number(datos?.valor).toLocaleString('es-CO')} COP</span>
              </div>
            )}
          </div>
          <Link href="/" className="block pt-2">
            <Button className="w-full bg-[#073b78] hover:bg-[#052d5e] text-white font-bold text-xs h-11 flex items-center justify-center gap-2 cursor-pointer shadow">
              <ShoppingBag className="w-4 h-4" /> Volver a la Tienda
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 font-sans">
      <header className="bg-[#073b78] text-white py-4 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-serif text-lg font-bold">
            El Compadre Licorería Express
          </Link>
        </div>
      </header>
      <main className="py-10">
        <Suspense fallback={<div className="text-center p-6 text-xs font-bold text-zinc-500">Cargando confirmación...</div>}>
          <ContenidoPedidoConfirmado />
        </Suspense>
      </main>
    </div>
  );
}