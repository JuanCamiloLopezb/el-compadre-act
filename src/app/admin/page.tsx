'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShoppingBag, 
  Package, 
  Ticket, 
  Users, 
  LogOut, 
  Shield, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  Camera, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Award,
  CreditCard,
  BarChart3,
  Eye,
  EyeOff,
  Flame
} from 'lucide-react';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'pedidos' | 'productos' | 'cupones' | 'personal'>('dashboard');

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [cupones, setCupones] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);

  // Formularios
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false);
  const [productoEditandoId, setProductoEditandoId] = useState<string | null>(null);
  const [mostrarFormCupon, setMostrarFormCupon] = useState(false);

  // Estados Formulario Producto
  const [prodNombre, setProdNombre] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodCategoria, setProdCategoria] = useState('Whisky');
  const [prodImagen, setProdImagen] = useState('');
  const [prodActivo, setProdActivo] = useState(true);
  const [prodEnOferta, setProdEnOferta] = useState(false);
  const [prodPrecioOferta, setProdPrecioOferta] = useState('');

  // Estados Formulario Cupón
  const [cupCodigo, setCupCodigo] = useState('');
  const [cupTipo, setCupTipo] = useState('porcentaje');
  const [cupValor, setCupValor] = useState('');
  const [cupLimite, setCupLimite] = useState('');
  const [cupExpiracion, setCupExpiracion] = useState('');

  useEffect(() => {
    async function inicializarAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return window.location.replace('/');

      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single();
      const esAdmin = session.user.email === 'juancamilo.lopez.0510@gmail.com' || perfil?.rol === 'admin';

      if (!esAdmin) return window.location.replace('/');

      setUsuario(session.user);
      await Promise.all([cargarPedidos(), cargarProductos(), cargarCupones(), cargarPersonal()]);
      setLoading(false);
    }
    inicializarAdmin();
  }, []);

  const cargarPedidos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, detalle_pedidos(*, productos(nombre))')
      .order('created_at', { ascending: false });
    if (error) console.error('Error pedidos:', error.message);
    setPedidos(data || []);
  };

  const cargarProductos = async () => {
    let { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (error) {
      const fallback = await supabase.from('productos').select('*');
      data = fallback.data;
    }
    setProductos(data || []);
  };

  const cargarCupones = async () => {
    const { data, error } = await supabase.from('cupones').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error cupones:', error.message);
    setCupones(data || []);
  };

  const cargarPersonal = async () => {
    const { data, error } = await supabase.from('perfiles').select('*');
    if (error) console.error('Error personal:', error.message);
    setPersonal(data || []);
  };

  // --- CÁLCULO DE DASHBOARD ---
  const stats = useMemo(() => {
    const pedidosValidos = pedidos.filter(p => p.estado !== 'CANCELADO');
    const ingresosTotales = pedidosValidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const ticketPromedio = pedidosValidos.length > 0 ? Math.round(ingresosTotales / pedidosValidos.length) : 0;
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const ventasHoy = pedidosValidos
      .filter(p => new Date(p.created_at) >= hoyInicio)
      .reduce((acc, p) => acc + (Number(p.total) || 0), 0);

    const conteoProductos: Record<string, { nombre: string; cantidad: number; totalRecaudado: number }> = {};
    pedidosValidos.forEach(p => {
      p.detalle_pedidos?.forEach((det: any) => {
        const nombre = det.productos?.nombre || 'Producto';
        const cant = Number(det.cantidad) || 0;
        const subtotal = (Number(det.precio_unitario) || 0) * cant;
        if (!conteoProductos[nombre]) conteoProductos[nombre] = { nombre, cantidad: 0, totalRecaudado: 0 };
        conteoProductos[nombre].cantidad += cant;
        conteoProductos[nombre].totalRecaudado += subtotal;
      });
    });
    const productosMasVendidos = Object.values(conteoProductos).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    const ultimos7Dias: { fecha: string; dia: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const strFecha = d.toISOString().split('T')[0];
      const nombreDia = d.toLocaleDateString('es-CO', { weekday: 'short' });
      const totalDia = pedidosValidos
        .filter(p => p.created_at && p.created_at.startsWith(strFecha))
        .reduce((acc, p) => acc + (Number(p.total) || 0), 0);
      ultimos7Dias.push({ fecha: strFecha, dia: nombreDia, total: totalDia });
    }
    const maxVentaDia = Math.max(...ultimos7Dias.map(d => d.total), 1);

    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const añoActual = new Date().getFullYear();
    const ventasPorMes = mesesNombres.map((mes, idx) => {
      const totalMes = pedidosValidos
        .filter(p => {
          if (!p.created_at) return false;
          const fecha = new Date(p.created_at);
          return fecha.getFullYear() === añoActual && fecha.getMonth() === idx;
        })
        .reduce((acc, p) => acc + (Number(p.total) || 0), 0);
      return { mes, total: totalMes };
    });

    const totalEfectivo = pedidosValidos.filter(p => (p.metodo_pago || '').toLowerCase().includes('efectivo')).length;
    const totalDigital = pedidosValidos.length - totalEfectivo;

    return { 
      ingresosTotales, 
      totalPedidos: pedidos.length, 
      pedidosExitosos: pedidosValidos.length, 
      ticketPromedio, 
      ventasHoy, 
      productosMasVendidos, 
      ultimos7Dias, 
      maxVentaDia, 
      ventasPorMes, 
      totalEfectivo, 
      totalDigital 
    };
  }, [pedidos]);

  // --- ACCIONES DE PRODUCTOS ---
  const abrirFormularioCrearProducto = () => {
    setProductoEditandoId(null);
    setProdNombre(''); setProdDesc(''); setProdPrecio(''); setProdStock(''); setProdImagen('');
    setProdActivo(true); setProdEnOferta(false); setProdPrecioOferta('');
    setMostrarFormProducto(true);
  };

  const prepararEdicionProducto = (p: any) => {
    setProductoEditandoId(p.id);
    setProdNombre(p.nombre || '');
    setProdDesc(p.descripcion || '');
    setProdPrecio(p.precio ? p.precio.toString() : '');
    setProdStock(p.stock !== undefined ? p.stock.toString() : '0');
    setProdCategoria(p.categoria || 'Whisky');
    setProdImagen(p.imagen_url || '');
    setProdActivo(p.activo !== false);
    setProdEnOferta(p.en_oferta || false);
    setProdPrecioOferta(p.precio_oferta ? p.precio_oferta.toString() : '');
    setMostrarFormProducto(true);
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const datosProducto = {
      nombre: prodNombre,
      descripcion: prodDesc,
      precio: parseFloat(prodPrecio) || 0,
      stock: parseInt(prodStock) || 0,
      categoria: prodCategoria,
      imagen_url: prodImagen,
      activo: prodActivo,
      en_oferta: prodEnOferta,
      precio_oferta: prodEnOferta ? parseFloat(prodPrecioOferta) || 0 : 0
    };

    if (productoEditandoId) {
      const { error } = await supabase.from('productos').update(datosProducto).eq('id', productoEditandoId);
      if (error) alert('Error al actualizar: ' + error.message);
      else alert('¡Producto actualizado exitosamente!');
    } else {
      const { error } = await supabase.from('productos').insert([datosProducto]);
      if (error) alert('Error al crear: ' + error.message);
      else alert('¡Producto creado exitosamente!');
    }

    setMostrarFormProducto(false);
    cargarProductos();
  };

  const toggleDisponibilidadProducto = async (id: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    const { error } = await supabase.from('productos').update({ activo: nuevoEstado }).eq('id', id);
    if (error) alert('Error al cambiar disponibilidad: ' + error.message);
    else cargarProductos();
  };

  const handleEliminarProducto = async (id: string) => {
    if (!window.confirm('¿Deseas dar de baja este producto del catálogo?')) return;
    
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) {
      // Si falla por Foreign Key en pedidos anteriores, lo desactiva en vez de romper la BD
      await supabase.from('productos').update({ activo: false }).eq('id', id);
      alert('El producto ya tiene pedidos registrados. Se ha marcado como "No disponible / Oculto" para conservar el historial contable.');
    } else {
      alert('Producto eliminado exitosamente.');
    }
    cargarProductos();
  };

  // --- ACCIONES DE PEDIDOS Y CUPONES ---
  const cambiarEstadoPedido = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else cargarPedidos();
  };

  const asignarRepartidor = async (pedidoId: string, repartidorId: string) => {
    // Si viene vacío o "Sin Repartidor", mandamos explícitamente null
    const valorRepartidor = repartidorId && repartidorId.trim() !== '' ? repartidorId : null;

    const { error } = await supabase
      .from('pedidos')
      .update({ repartidor_id: valorRepartidor })
      .eq('id', pedidoId);

    if (error) {
      alert('Error asignando repartidor: ' + error.message);
    } else {
      cargarPedidos();
    }
  };

  const cambiarRolPersonal = async (id: string, nuevoRol: string) => {
    if (!window.confirm(`¿Cambiar rol a ${nuevoRol.toUpperCase()}?`)) return;
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else cargarPersonal();
  };

  const handleCrearCupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('cupones').insert([{
      codigo: cupCodigo.toUpperCase().trim(),
      tipo: cupTipo,
      valor: parseFloat(cupValor),
      limite_uso: parseInt(cupLimite) || 100,
      fecha_expiracion: cupExpiracion || null,
      activo: true
    }]);
    if (error) alert('Error creando cupón: ' + error.message);
    else {
      alert('Cupón creado exitosamente');
      setMostrarFormCupon(false);
      setCupCodigo(''); setCupValor(''); setCupLimite(''); setCupExpiracion('');
      cargarCupones();
    }
  };

  const handleEliminarCupon = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cupón permanentemente?')) return;
    const { error } = await supabase.from('cupones').delete().eq('id', id);
    if (error) alert('Error eliminando cupón: ' + error.message);
    else cargarCupones();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center font-bold text-[#073b78] gap-3">
        <Shield className="w-10 h-10 animate-pulse text-[#b88a3b]" />
        <span>Validando panel administrativo...</span>
      </div>
    );
  }

  const repartidores = personal.filter(p => p.rol === 'repartidor');

  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 font-sans flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#073b78] text-white min-h-screen p-4 flex flex-col shadow-xl sticky top-0">
        <div className="mb-8 px-2">
          <div className="bg-[#b88a3b] text-white font-serif font-black px-3 py-1 text-xl rounded inline-block mb-2">ADM</div>
          <h1 className="font-bold text-sm">Panel de Control</h1>
          <p className="text-[10px] text-blue-200 truncate">{usuario?.email}</p>
        </div>

        <nav className="flex-1 space-y-2 text-sm font-medium">
          <button onClick={() => setVistaActiva('dashboard')} className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${vistaActiva === 'dashboard' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}>
            <BarChart3 className="w-5 h-5 text-[#d8c38f]" /> Dashboard
          </button>
          <button onClick={() => setVistaActiva('pedidos')} className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${vistaActiva === 'pedidos' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}>
            <ShoppingBag className="w-5 h-5" /> Pedidos ({pedidos.length})
          </button>
          <button onClick={() => setVistaActiva('productos')} className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${vistaActiva === 'productos' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}>
            <Package className="w-5 h-5" /> Productos ({productos.length})
          </button>
          <button onClick={() => setVistaActiva('cupones')} className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${vistaActiva === 'cupones' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}>
            <Ticket className="w-5 h-5" /> Cupones ({cupones.length})
          </button>
          <button onClick={() => setVistaActiva('personal')} className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${vistaActiva === 'personal' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}>
            <Users className="w-5 h-5" /> Personal y Roles
          </button>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => window.location.replace('/'))} className="flex items-center gap-3 p-3 text-red-300 hover:bg-white/10 rounded mt-auto">
          <LogOut className="w-5 h-5" /> Salir
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        
        {/* ========================================================
            --- VISTA 1: DASHBOARD ---
        ======================================================== */}
        {vistaActiva === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-[#073b78]">Dashboard de Métricas</h2>
              <p className="text-xs text-zinc-500 mt-1">Monitorea el rendimiento comercial en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="p-5 bg-white shadow-sm border-l-4 border-l-green-600">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Ingresos Totales</p>
                <h3 className="text-2xl font-black text-zinc-900 mt-1">${stats.ingresosTotales.toLocaleString('es-CO')}</h3>
                <p className="text-[10px] text-green-600 font-bold mt-1">Ventas efectivas</p>
              </Card>

              <Card className="p-5 bg-white shadow-sm border-l-4 border-l-[#073b78]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Ventas de Hoy</p>
                <h3 className="text-2xl font-black text-[#073b78] mt-1">${stats.ventasHoy.toLocaleString('es-CO')}</h3>
                <p className="text-[10px] text-blue-600 font-bold mt-1">Corte de hoy</p>
              </Card>

              <Card className="p-5 bg-white shadow-sm border-l-4 border-l-[#b88a3b]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Ticket Promedio</p>
                <h3 className="text-2xl font-black text-zinc-900 mt-1">${stats.ticketPromedio.toLocaleString('es-CO')}</h3>
                <p className="text-[10px] text-amber-700 font-bold mt-1">Por cada orden</p>
              </Card>

              <Card className="p-5 bg-white shadow-sm border-l-4 border-l-purple-600">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Pedidos</p>
                <h3 className="text-2xl font-black text-zinc-900 mt-1">{stats.totalPedidos}</h3>
                <p className="text-[10px] text-purple-700 font-bold mt-1">{stats.pedidosExitosos} válidos / {stats.totalPedidos - stats.pedidosExitosos} cancelados</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-7 p-6 bg-white shadow-sm">
                <h4 className="font-bold text-base text-zinc-900 mb-1">Ventas Diarias (Últimos 7 días)</h4>
                <p className="text-xs text-zinc-400 mb-6">Facturación día a día</p>
                <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-zinc-100">
                  {stats.ultimos7Dias.map((item, idx) => {
                    const altura = Math.max(8, Math.round((item.total / stats.maxVentaDia) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ${(item.total / 1000).toFixed(0)}k
                        </span>
                        <div 
                          className="w-full bg-[#073b78] rounded-t-md hover:bg-[#b88a3b] transition-all cursor-pointer"
                          style={{ height: `${altura}%` }}
                          title={`${item.fecha}: $${item.total.toLocaleString('es-CO')}`}
                        />
                        <span className="text-[11px] font-bold uppercase text-zinc-600">{item.dia}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="lg:col-span-5 p-6 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-[#b88a3b]" />
                    <h4 className="font-bold text-base text-zinc-900">Top Productos Más Vendidos</h4>
                  </div>

                  {stats.productosMasVendidos.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-8">Aún no hay suficientes ventas registradas.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.productosMasVendidos.map((prod, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#073b78] text-white flex items-center justify-center font-bold text-[10px]">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-bold text-zinc-800 line-clamp-1">{prod.nombre}</p>
                              <p className="text-[10px] text-zinc-400">{prod.cantidad} unidades vendidas</p>
                            </div>
                          </div>
                          <span className="font-black text-[#073b78] whitespace-nowrap">
                            ${prod.totalRecaudado.toLocaleString('es-CO')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================
            --- VISTA 2: PEDIDOS (CON DETALLE COMPLETO RECUPERADO) ---
        ======================================================== */}
        {vistaActiva === 'pedidos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-2xl font-bold text-[#073b78]">Historial de Pedidos ({pedidos.length})</h2>
              <Button onClick={cargarPedidos} className="bg-white border text-xs text-zinc-600">Actualizar Lista</Button>
            </div>
            
            <div className="space-y-4">
              {pedidos.length === 0 ? (
                <Card className="p-12 text-center text-zinc-500 shadow-sm"><p>No hay pedidos registrados.</p></Card>
              ) : (
                pedidos.map((pedido) => (
                  <Card key={pedido.id} className="p-5 border-l-4 border-l-[#073b78] bg-white shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-3 gap-3">
                      <div>
                        <span className="font-mono font-bold text-[#073b78] bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          ID: #{pedido.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-zinc-400 ml-3">
                          {new Date(pedido.created_at).toLocaleString('es-CO')}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <span className="font-serif text-xl font-black text-green-700">
                          ${pedido.total.toLocaleString('es-CO')}
                        </span>
                        
                        {/* ASIGNACIÓN DE MOTORIZADO */}
                        <select
                          value={pedido.repartidor_id || ''}
                          onChange={(e) => asignarRepartidor(pedido.id, e.target.value)}
                          className="border p-2 rounded text-xs bg-zinc-50 font-medium outline-none"
                        >
                          <option value="">Sin Repartidor</option>
                          {repartidores.map(r => (
                            <option key={r.id} value={r.id}>Moto: {r.nombre || 'Sin nombre'}</option>
                          ))}
                        </select>

                        {/* SELECTOR DE ESTADO */}
                        <select
                          value={pedido.estado}
                          onChange={(e) => cambiarEstadoPedido(pedido.id, e.target.value)}
                          className={`font-bold text-xs p-2 rounded outline-none cursor-pointer border-2 transition-colors ${
                            pedido.estado === 'PEDIDO ENTREGADO' ? 'border-green-600 text-green-700 bg-green-50' : 
                            pedido.estado === 'CANCELADO' ? 'border-red-500 text-red-600 bg-red-50' :
                            'border-[#073b78] text-[#073b78] bg-blue-50'
                          }`}
                        >
                          <option value="PENDIENTE DE PAGO">PENDIENTE DE PAGO</option>
                          <option value="PAGADO">PAGADO</option>
                          <option value="PEDIDO EN PREPARACION">EN PREPARACIÓN</option>
                          <option value="PEDIDO DESPACHADO">DESPACHADO</option>
                          <option value="PEDIDO ENTREGADO">ENTREGADO</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </select>
                      </div>
                    </div>

                    {/* DETALLES DEL CLIENTE Y PRODUCTOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-50 p-3 rounded border border-zinc-100 space-y-1">
                        <p className="font-bold text-zinc-800 border-b pb-1 mb-2">Datos del Comprador y Envío</p>
                        <p><strong>Dirección:</strong> {pedido.direccion}</p>
                        <p><strong>Teléfono:</strong> {pedido.telefono}</p>
                        <p><strong>Método de Pago:</strong> {pedido.metodo_pago}</p>
                        
                        {/* OBSERVACIONES DEL CLIENTE */}
                        {pedido.comentarios && (
                          <div className="mt-2 text-zinc-700 bg-amber-50 p-2 rounded border border-amber-200">
                            <strong>Observaciones del cliente:</strong>
                            <p className="italic mt-0.5">"{pedido.comentarios}"</p>
                          </div>
                        )}

                        {/* EVIDENCIA FOTOGRÁFICA DE ENTREGA */}
                        {pedido.foto_entrega && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="font-bold text-green-800 flex items-center gap-1.5 mb-2">
                              <Camera className="w-4 h-4"/> Evidencia de Entrega:
                            </p>
                            <img 
                              src={pedido.foto_entrega} 
                              alt="Prueba de entrega" 
                              className="w-24 h-24 object-cover rounded shadow-sm cursor-pointer hover:opacity-80 border border-green-300" 
                              onClick={() => window.open(pedido.foto_entrega, '_blank')} 
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-zinc-50 p-3 rounded border border-zinc-100">
                        <p className="font-bold text-zinc-800 border-b pb-1 mb-2">Productos en este Pedido</p>
                        <ul className="space-y-1.5">
                          {pedido.detalle_pedidos?.map((item: any) => (
                            <li key={item.id} className="flex justify-between items-center py-0.5 border-b border-zinc-100 last:border-0">
                              <span><strong className="text-[#073b78]">{item.cantidad}x</strong> {item.productos?.nombre || 'Producto'}</span>
                              <span className="font-medium text-zinc-600">${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            --- VISTA 3: PRODUCTOS (GESTIÓN COMPLETA) ---
        ======================================================== */}
        {vistaActiva === 'productos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#073b78]">Gestión de Productos ({productos.length})</h2>
                <p className="text-xs text-zinc-500">Controla catálogo, existencias, disponibilidad y promociones.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={cargarProductos} variant="outline" className="text-xs">Actualizar</Button>
                <Button onClick={abrirFormularioCrearProducto} className="bg-[#b88a3b] hover:bg-[#a37a34] text-white gap-2 text-xs font-bold">
                  <Plus className="w-4 h-4" /> Nuevo Producto
                </Button>
              </div>
            </div>

            {mostrarFormProducto && (
              <Card className="p-6 bg-white shadow-lg border-t-4 border-t-[#073b78]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-zinc-900">{productoEditandoId ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
                  <button onClick={() => setMostrarFormProducto(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleGuardarProducto} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Nombre del Producto *</label>
                    <Input required value={prodNombre} onChange={e => setProdNombre(e.target.value)} placeholder="Ej: Whisky Old Parr 750ml" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Categoría *</label>
                    <select value={prodCategoria} onChange={e => setProdCategoria(e.target.value)} className="w-full border rounded p-2 text-xs bg-white outline-none">
                      <option value="Whisky">Whisky</option>
                      <option value="Ron">Ron</option>
                      <option value="Aguardiente">Aguardiente</option>
                      <option value="Cervezas">Cervezas</option>
                      <option value="Tequila">Tequila</option>
                      <option value="Vinos">Vinos</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Precio Regular ($ COP) *</label>
                    <Input type="number" required value={prodPrecio} onChange={e => setProdPrecio(e.target.value)} placeholder="Ej: 120000" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Stock (Unidades disponibles) *</label>
                    <Input type="number" required value={prodStock} onChange={e => setProdStock(e.target.value)} placeholder="Ej: 15" />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-zinc-700">URL de la Imagen</label>
                    <Input value={prodImagen} onChange={e => setProdImagen(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-zinc-700">Descripción</label>
                    <Input value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Descripción breve del producto..." />
                  </div>

                  <div className="md:col-span-2 bg-zinc-50 p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-800">Estado de Disponibilidad</p>
                      <p className="text-[11px] text-zinc-500">Si lo desactivas, aparecerá como "Agotado / No disponible" en el catálogo.</p>
                    </div>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={prodActivo} 
                        onChange={e => setProdActivo(e.target.checked)} 
                        className="w-4 h-4 rounded text-[#073b78]" 
                      />
                      <span className={prodActivo ? 'text-green-700' : 'text-red-600'}>
                        {prodActivo ? 'Disponible' : 'No disponible'}
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2 bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                    <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={prodEnOferta} 
                        onChange={e => setProdEnOferta(e.target.checked)} 
                        className="w-4 h-4 text-[#073b78] rounded" 
                      />
                      <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> Marcar producto en Oferta (Aparecerá en el menú Ofertas)</span>
                    </label>

                    {prodEnOferta && (
                      <div className="space-y-1 pl-6">
                        <label className="font-bold text-zinc-700">Precio Especial de Oferta ($ COP) *</label>
                        <Input 
                          type="number" 
                          required={prodEnOferta} 
                          value={prodPrecioOferta} 
                          onChange={e => setProdPrecioOferta(e.target.value)} 
                          placeholder="Ej: 95000" 
                          className="bg-white" 
                        />
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="md:col-span-2 bg-[#073b78] hover:bg-[#052d5e] text-white font-bold py-3 mt-2">
                    {productoEditandoId ? 'Guardar Cambios' : 'Crear Producto'}
                  </Button>
                </form>
              </Card>
            )}

            {/* GRILLA DE PRODUCTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {productos.map(p => (
                <Card key={p.id} className={`p-4 flex flex-col justify-between relative bg-white shadow-sm border transition-all ${!p.activo ? 'opacity-70 bg-zinc-50 border-dashed border-red-300' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-blue-50 text-[#073b78] px-2 py-0.5 rounded font-bold uppercase">
                      {p.categoria || 'Licor'}
                    </span>
                    <div className="flex gap-1">
                      {p.en_oferta && (
                        <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                          <Flame className="w-3 h-3"/> Oferta
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.activo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.activo !== false ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center my-2">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-16 h-16 object-cover rounded-lg border border-zinc-200 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0 text-zinc-300">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 line-clamp-1">{p.nombre}</h4>
                      <div className="mt-1">
                        {p.en_oferta ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-red-600">${p.precio_oferta?.toLocaleString('es-CO')}</span>
                            <span className="text-xs text-zinc-400 line-through">${p.precio?.toLocaleString('es-CO')}</span>
                          </div>
                        ) : (
                          <span className="text-base font-black text-[#073b78]">${p.precio?.toLocaleString('es-CO')}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Stock: <strong className={p.stock > 0 ? 'text-green-700' : 'text-red-600'}>{p.stock} un.</strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 justify-between items-center">
                    <Button 
                      onClick={() => toggleDisponibilidadProducto(p.id, p.activo !== false)}
                      variant="ghost" 
                      size="sm" 
                      className={`text-[11px] h-7 px-2 font-bold ${p.activo !== false ? 'text-amber-700 hover:bg-amber-50' : 'text-green-700 hover:bg-green-50'}`}
                    >
                      {p.activo !== false ? <><EyeOff className="w-3.5 h-3.5 mr-1"/> Marcar Agotado</> : <><Eye className="w-3.5 h-3.5 mr-1"/> Habilitar</>}
                    </Button>

                    <div className="flex gap-1">
                      <Button onClick={() => prepararEdicionProducto(p)} variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1 border-blue-200 text-[#073b78] hover:bg-blue-50">
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button onClick={() => handleEliminarProducto(p.id)} variant="outline" size="sm" className="h-7 px-2 text-[11px] text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            --- VISTA 4: CUPONES (CON DETALLE COMPLETO RECUPERADO) ---
        ======================================================== */}
        {vistaActiva === 'cupones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#073b78]">Cupones de Descuento ({cupones.length})</h2>
                <p className="text-xs text-zinc-500">Crea códigos promocionales en porcentaje o valor fijo.</p>
              </div>
              <Button onClick={() => setMostrarFormCupon(!mostrarFormCupon)} className="bg-[#b88a3b] hover:bg-[#a37a34] text-white gap-2 text-xs font-bold">
                {mostrarFormCupon ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                {mostrarFormCupon ? 'Cancelar' : 'Nuevo Cupón'}
              </Button>
            </div>

            {mostrarFormCupon && (
              <Card className="p-6 bg-white shadow-md border-t-4 border-t-[#073b78]">
                <h3 className="font-bold text-lg mb-4">Configurar Código de Descuento</h3>
                <form onSubmit={handleCrearCupon} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Código (Ej: PROMOCOMPADRE)</label>
                    <Input required value={cupCodigo} onChange={e => setCupCodigo(e.target.value.toUpperCase())} className="uppercase font-mono" placeholder="EJ: AMIGOS10" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Tipo de Descuento</label>
                    <select value={cupTipo} onChange={e => setCupTipo(e.target.value)} className="w-full border rounded p-2 text-sm bg-white outline-none">
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="fijo">Valor Fijo ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Valor ({cupTipo === 'porcentaje' ? '%' : '$ COP'})</label>
                    <Input type="number" required value={cupValor} onChange={e => setCupValor(e.target.value)} placeholder={cupTipo === 'porcentaje' ? 'Ej: 15' : 'Ej: 10000'} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Límite Máximo de Usos</label>
                    <Input type="number" placeholder="Ej: 100" value={cupLimite} onChange={e => setCupLimite(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-700">Fecha de Expiración (Opcional)</label>
                    <Input type="date" value={cupExpiracion} onChange={e => setCupExpiracion(e.target.value)} />
                  </div>
                  <Button type="submit" className="md:col-span-2 bg-[#073b78] hover:bg-[#052d5e] text-white font-bold py-3 mt-2">
                    Crear y Activar Cupón
                  </Button>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cupones.length === 0 ? (
                <Card className="col-span-full p-8 text-center text-zinc-400">No hay cupones configurados.</Card>
              ) : (
                cupones.map(c => (
                  <Card key={c.id} className="p-5 border-dashed border-2 border-[#b88a3b]/40 relative bg-white shadow-sm">
                    <button 
                      onClick={() => handleEliminarCupon(c.id)} 
                      className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 transition-colors"
                      title="Eliminar Cupón"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                    <div className="flex justify-between items-start mb-2 pr-6">
                      <span className="font-mono text-xl font-black tracking-widest text-[#073b78]">{c.codigo}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${c.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1 text-zinc-600 mt-3">
                      <p><strong>Descuento:</strong> {c.tipo === 'porcentaje' ? `${c.valor}%` : `$${c.valor.toLocaleString('es-CO')}`}</p>
                      <p><strong>Usos realizados:</strong> <strong className="text-[#073b78]">{c.usos_actuales || 0} / {c.limite_uso}</strong></p>
                      {c.fecha_expiracion && (
                        <p><strong>Vence:</strong> {new Date(c.fecha_expiracion).toLocaleDateString('es-CO')}</p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            --- VISTA 5: PERSONAL Y ROLES ---
        ======================================================== */}
        {vistaActiva === 'personal' && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-[#073b78]">Gestión de Personal ({personal.length})</h2>
            <Card className="bg-blue-50/50 p-4 border border-blue-100 text-xs text-blue-800 shadow-sm">
              <strong>💡 ¿Cómo registrar personal?</strong> El cajero o domiciliario debe registrarse en la tienda. Luego búscalo aquí y asígnale el rol correspondiente.
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personal.map(p => (
                <Card key={p.id} className="p-4 flex flex-col justify-between bg-white shadow-sm">
                  <div>
                    <p className="font-bold text-zinc-800 text-base">{p.nombre || 'Usuario sin nombre'}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">ID: {p.id.slice(0, 10)}...</p>
                    <p className="text-xs text-zinc-500 mt-1">Tel: {p.telefono || 'Sin teléfono'}</p>
                  </div>
                  <select 
                    value={p.rol || 'cliente'} 
                    onChange={e => cambiarRolPersonal(p.id, e.target.value)} 
                    className={`w-full text-xs font-bold p-2 rounded border mt-4 outline-none cursor-pointer ${
                      p.rol === 'admin' ? 'bg-[#b88a3b] text-white' :
                      p.rol === 'repartidor' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      p.rol === 'cajero' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-zinc-50'
                    }`}
                  >
                    <option value="cliente">Cliente (Comprador)</option>
                    <option value="repartidor">Repartidor (Motorizado)</option>
                    <option value="cajero">Cajero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </Card>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}