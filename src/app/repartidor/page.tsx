'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, CheckCircle2, LogOut, Package } from 'lucide-react';

export default function RepartidorPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [subiendoFoto, setSubiendoFoto] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return window.location.replace('/');

      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single();
      if (perfil?.rol !== 'repartidor' && perfil?.rol !== 'admin') {
        return window.location.replace('/');
      }

      setUsuario(session.user);
      await cargarMisRutas(session.user.id);
      setLoading(false);
    }
    init();
  }, []);

  const cargarMisRutas = async (userId: string) => {
    // Solo trae pedidos asignados a este repartidor y que NO estén entregados ni cancelados
    const { data } = await supabase
      .from('pedidos')
      .select('*, detalle_pedidos(*, productos(nombre))')
      .eq('repartidor_id', userId)
      .neq('estado', 'PEDIDO ENTREGADO')
      .neq('estado', 'CANCELADO')
      .order('created_at', { ascending: false });
    
    setPedidos(data || []);
  };

  const handleTomarFoto = async (e: React.ChangeEvent<HTMLInputElement>, pedidoId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSubiendoFoto(pedidoId);
      
      // 1. Subir foto a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${pedidoId}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('entregas').upload(fileName, file);
      
      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage.from('entregas').getPublicUrl(fileName);

      // 3. Actualizar el pedido: Cambiar estado a ENTREGADO y guardar la foto
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ estado: 'PEDIDO ENTREGADO', foto_entrega: publicUrl })
        .eq('id', pedidoId);

      if (updateError) throw updateError;

      alert('¡Entrega registrada con éxito!');
      cargarMisRutas(usuario.id);

    } catch (error: any) {
      alert('Error subiendo foto: ' + error.message);
    } finally {
      setSubiendoFoto(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white">Cargando tus rutas...</div>;

  return (
    <div className="min-h-screen bg-zinc-100 font-sans pb-20">
      <header className="bg-zinc-900 text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="font-black text-lg text-[#d8c38f]">Rutas Activas</h1>
          <p className="text-[10px] text-zinc-400">Repartidor Oficial</p>
        </div>
        <Button onClick={() => supabase.auth.signOut().then(() => window.location.replace('/'))} variant="ghost" size="sm" className="text-red-400 hover:bg-zinc-800">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <main className="p-4 space-y-4 mt-2">
        {pedidos.length === 0 ? (
          <div className="text-center p-10 text-zinc-400">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="font-bold">No tienes rutas pendientes.</p>
            <p className="text-xs">Espera a que te asignen un nuevo pedido.</p>
          </div>
        ) : (
          pedidos.map(pedido => (
            <Card key={pedido.id} className="border-t-4 border-t-zinc-900 shadow-md">
              <div className="bg-zinc-100 p-3 flex justify-between items-center border-b">
                <span className="font-mono font-bold text-zinc-800 text-sm">#{pedido.id.slice(0, 8)}</span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{pedido.estado}</span>
              </div>
              
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-3 items-start">
                  <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-900 text-sm leading-tight">{pedido.direccion}</p>
                    <p className="text-xs text-zinc-600 mt-1">Tel: <strong>{pedido.telefono}</strong></p>
                    {pedido.comentarios && <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded mt-2 border border-blue-100">"{pedido.comentarios}"</p>}
                  </div>
                </div>

                <div className="bg-zinc-50 p-3 rounded border text-xs">
                  <p className="font-bold text-zinc-700 mb-1 flex items-center gap-1"><Package className="w-4 h-4"/> Entregar:</p>
                  <ul className="text-zinc-600 space-y-1">
                    {pedido.detalle_pedidos?.map((i:any) => <li key={i.id}>{i.cantidad}x {i.productos?.nombre}</li>)}
                  </ul>
                  <div className="mt-3 pt-2 border-t flex justify-between items-center">
                    <span className="font-bold text-zinc-800">Cobrar: {pedido.metodo_pago}</span>
                    <span className="font-black text-green-700 text-lg">${pedido.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* BOTÓN PARA SUBIR FOTO */}
                <div className="pt-2">
                  <label className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-lg text-sm transition-colors shadow-sm cursor-pointer ${subiendoFoto === pedido.id ? 'bg-zinc-300 text-zinc-500' : 'bg-[#073b78] hover:bg-[#052d5e] text-white'}`}>
                    <Camera className="w-5 h-5" />
                    {subiendoFoto === pedido.id ? 'Subiendo foto...' : 'Tomar Foto y Finalizar Entrega'}
                    {/* Input invisible que abre la cámara en celulares */}
                    <input type="file" accept="image/*" capture="environment" className="hidden" disabled={subiendoFoto === pedido.id} onChange={(e) => handleTomarFoto(e, pedido.id)} />
                  </label>
                  <p className="text-[10px] text-center text-zinc-400 mt-2">Tomar foto sirve como firma de recibido.</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}