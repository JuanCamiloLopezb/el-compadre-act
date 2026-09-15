'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  User,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Home,
  Briefcase,
  MapPinned,
  CreditCard,
  CalendarDays,
  X,
  Check,
  Loader2
} from 'lucide-react';

import Link from 'next/link';

interface Direccion {
  id: string;
  etiqueta: string;
  ciudad: string;
  direccion: string;
  datos_adicionales?: string;
  es_predeterminada: boolean;
}

interface DetallePedido {
  id: string;
  cantidad: number;
  precio_unitario: number;
  productos?: {
    nombre: string;
  };
}

interface Pedido {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  direccion: string;
  metodo_pago?: string;
  detalle_pedidos?: DetallePedido[];
}

const ESTADOS_TIMELINE = [
  {
    clave: 'PENDIENTE DE PAGO',
    etiqueta: 'Pendiente',
    icono: Clock
  },
  {
    clave: 'PAGADO',
    etiqueta: 'Pagado',
    icono: CheckCircle2
  },
  {
    clave: 'PEDIDO EN PREPARACION',
    etiqueta: 'En Preparación',
    icono: Package
  },
  {
    clave: 'PEDIDO DESPACHADO',
    etiqueta: 'En Camino',
    icono: Truck
  },
  {
    clave: 'PEDIDO ENTREGADO',
    etiqueta: 'Entregado',
    icono: ShoppingBag
  }
];

export default function PerfilPage() {
  const [tab, setTab] = useState<'pedidos' | 'direcciones'>('pedidos');

  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Direcciones
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [modalNuevaDir, setModalNuevaDir] = useState(false);

  const [etiquetaDir, setEtiquetaDir] = useState('Casa');
  const [ciudadDir, setCiudadDir] = useState('Barranquilla');
  const [textoDir, setTextoDir] = useState('');
  const [datosAdicDir, setDatosAdicDir] = useState('');

  // Pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Interactividad
  const [pedidoAbierto, setPedidoAbierto] = useState<string | null>(null);
  const [guardandoDireccion, setGuardandoDireccion] = useState(false);
  const [direccionEliminando, setDireccionEliminando] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/';
      return;
    }

    setUsuario(user);

    // 1. Cargar Direcciones
    const { data: dirs } = await supabase
      .from('direcciones')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    setDirecciones(dirs || []);

    // 2. Cargar Pedidos
    const { data: peds } = await supabase
      .from('pedidos')
      .select('*, detalle_pedidos(*, productos(nombre))')
      .or(`usuario_id.eq.${user.id},usuario_id.is.null`)
      .order('created_at', { ascending: false });

    setPedidos(peds || []);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAgregarDireccion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario) return;

    setGuardandoDireccion(true);

    await supabase.from('direcciones').insert([
      {
        usuario_id: usuario.id,
        etiqueta: etiquetaDir,
        ciudad: ciudadDir,
        direccion: textoDir,
        datos_adicionales: datosAdicDir,
        es_predeterminada: direcciones.length === 0
      }
    ]);

    setTextoDir('');
    setDatosAdicDir('');
    setEtiquetaDir('Casa');
    setCiudadDir('Barranquilla');
    setModalNuevaDir(false);

    await cargarDatos();

    setGuardandoDireccion(false);
  };

  const eliminarDireccion = async (id: string) => {
    setDireccionEliminando(id);

    await supabase
      .from('direcciones')
      .delete()
      .eq('id', id);

    await cargarDatos();

    setDireccionEliminando(null);
  };

  const getPasoActual = (estadoActual: string) => {
    const idx = ESTADOS_TIMELINE.findIndex(
      (e) => e.clave === estadoActual
    );

    return idx === -1 ? 0 : idx;
  };

  const getIconoDireccion = (etiqueta: string) => {
    const nombre = etiqueta.toLowerCase();

    if (nombre.includes('trabajo')) {
      return Briefcase;
    }

    if (nombre.includes('casa')) {
      return Home;
    }

    return MapPinned;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center font-bold text-[#073b78] text-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#d8c38f]/30 border-t-[#073b78] animate-spin" />
          <span>Cargando perfil en El Compadre... 🍺</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 pb-20 font-sans">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <header className="bg-[#073b78] text-white shadow-md">

        <div className="max-w-6xl mx-auto px-6 md:px-8 py-5 flex justify-between items-center gap-4">

          {/* PERFIL */}

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">

              <User className="w-6 h-6 text-[#073b78]" />

            </div>

            <div>

              <p className="text-[10px] text-[#d8c38f] uppercase tracking-[0.2em] font-bold">
                El Compadre
              </p>

              <h1 className="font-serif text-xl font-bold">
                Mi Cuenta
              </h1>

              <p className="text-xs text-blue-200 truncate max-w-[220px]">
                {usuario.email}
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* VOLVER A LA TIENDA */}
          {/* ================================================= */}

          <Link
            href="/"
            className="shrink-0"
          >
            <Button
              type="button"
              className="
                !bg-transparent
                !text-white
                !border
                !border-white/40
                hover:!bg-white
                hover:!text-[#073b78]
                hover:!border-white
                focus-visible:!ring-2
                focus-visible:!ring-[#d8c38f]
                focus-visible:!ring-offset-2
                focus-visible:!ring-offset-[#073b78]
                text-xs
                font-bold
                gap-2
                transition-all
                duration-200
                shadow-none
              "
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />

              <span className="hidden sm:inline">
                Volver a la Tienda
              </span>

              <span className="sm:hidden">
                Tienda
              </span>

            </Button>
          </Link>

        </div>

        {/* LINEA DORADA */}

        <div className="h-1 bg-[#b88a3b]" />

      </header>


      {/* ===================================================== */}
      {/* CONTENIDO */}
      {/* ===================================================== */}

      <div className="max-w-6xl mx-auto p-5 md:p-10 space-y-8">


        {/* ===================================================== */}
        {/* ENCABEZADO */}
        {/* ===================================================== */}

        <div className="space-y-2">

          <p className="text-[#b88a3b] text-[10px] tracking-[0.3em] uppercase font-bold">
            TU ESPACIO PERSONAL
          </p>

          <h2 className="font-serif text-3xl md:text-4xl text-[#202020]">
            Bienvenido, <span className="text-[#073b78]">Compadre</span>
          </h2>

          <p className="text-sm text-zinc-500">
            Administra tus pedidos y tus direcciones de entrega.
          </p>

        </div>


        {/* ===================================================== */}
        {/* NAVEGACIÓN */}
        {/* ===================================================== */}

        <div className="bg-white border border-zinc-200 shadow-sm">

          <div className="flex overflow-x-auto">

            {/* PEDIDOS */}

            <button
              onClick={() => setTab('pedidos')}
              className={`relative flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                tab === 'pedidos'
                  ? 'text-[#073b78] bg-[#fafaf8]'
                  : 'text-zinc-400 hover:text-[#073b78] hover:bg-zinc-50'
              }`}
            >

              <Package className="w-4 h-4" />

              Mis Pedidos

              <span
                className={`min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[9px] ${
                  tab === 'pedidos'
                    ? 'bg-[#073b78] text-white'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {pedidos.length}
              </span>

              {tab === 'pedidos' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b88a3b]" />
              )}

            </button>


            {/* DIRECCIONES */}

            <button
              onClick={() => setTab('direcciones')}
              className={`relative flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                tab === 'direcciones'
                  ? 'text-[#073b78] bg-[#fafaf8]'
                  : 'text-zinc-400 hover:text-[#073b78] hover:bg-zinc-50'
              }`}
            >

              <MapPin className="w-4 h-4" />

              Direcciones

              <span
                className={`min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[9px] ${
                  tab === 'direcciones'
                    ? 'bg-[#073b78] text-white'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {direcciones.length}
              </span>

              {tab === 'direcciones' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b88a3b]" />
              )}

            </button>

          </div>

        </div>


        {/* ===================================================== */}
        {/* PEDIDOS */}
        {/* ===================================================== */}

        {tab === 'pedidos' && (

          <div className="space-y-5">

            {pedidos.length === 0 ? (

              <Card className="bg-white border-zinc-200 text-center py-14 px-6 shadow-sm">

                <div className="w-16 h-16 mx-auto mb-5 bg-[#faf6ed] rounded-full flex items-center justify-center">

                  <Package className="w-7 h-7 text-[#b88a3b]" />

                </div>

                <h3 className="font-serif text-xl font-bold text-zinc-800">
                  Aún no tienes pedidos registrados
                </h3>

                <p className="text-xs text-zinc-500 mt-2 mb-6 max-w-md mx-auto">
                  Tus compras a domicilio aparecerán aquí con seguimiento en tiempo real.
                </p>

                <Link href="/">

                  <Button className="bg-[#073b78] hover:bg-[#052d5e] text-white font-bold text-xs uppercase px-7 transition-all">
                    Ir al Catálogo
                  </Button>

                </Link>

              </Card>

            ) : (

              pedidos.map((pedido) => {

                const pasoActual = getPasoActual(pedido.estado);

                const abierto = pedidoAbierto === pedido.id;

                return (

                  <Card
                    key={pedido.id}
                    className={`bg-white border-zinc-200 overflow-hidden transition-all duration-300 ${
                      abierto
                        ? 'shadow-lg border-[#b88a3b]/40'
                        : 'shadow-sm hover:shadow-md'
                    }`}
                  >

                    {/* CABECERA PEDIDO */}

                    <CardHeader
                      className={`p-5 cursor-pointer transition-colors ${
                        abierto
                          ? 'bg-[#faf6ed]'
                          : 'bg-white hover:bg-zinc-50'
                      }`}
                      onClick={() =>
                        setPedidoAbierto(
                          abierto ? null : pedido.id
                        )
                      }
                    >

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

                        <div className="flex items-center gap-3">

                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              abierto
                                ? 'bg-[#073b78] text-white'
                                : 'bg-[#faf6ed] text-[#073b78]'
                            }`}
                          >

                            <Package className="w-5 h-5" />

                          </div>

                          <div>

                            <CardTitle className="text-sm font-bold text-[#073b78]">
                              Pedido #{pedido.id.slice(0, 8)}
                            </CardTitle>

                            <CardDescription className="text-[11px] flex items-center gap-1 mt-1">

                              <CalendarDays className="w-3 h-3" />

                              {new Date(
                                pedido.created_at
                              ).toLocaleString('es-CO')}

                            </CardDescription>

                          </div>

                        </div>


                        <div className="flex items-center justify-between sm:justify-end gap-5">

                          <div className="text-right">

                            <span className="font-serif font-black text-lg text-[#073b78]">
                              ${pedido.total.toLocaleString('es-CO')}
                            </span>

                            <p className="text-[10px] text-zinc-400 uppercase font-bold flex items-center justify-end gap-1">

                              <CreditCard className="w-3 h-3" />

                              {pedido.metodo_pago || 'Efectivo'}

                            </p>

                          </div>


                          <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center">

                            {abierto ? (
                              <ChevronUp className="w-4 h-4 text-[#073b78]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-400" />
                            )}

                          </div>

                        </div>

                      </div>

                    </CardHeader>


                    {/* CONTENIDO */}

                    {abierto && (

                      <CardContent className="p-5 md:p-6 space-y-7 text-xs animate-in fade-in slide-in-from-top-2 duration-200">


                        {/* ESTADO */}

                        <div className="py-3">

                          <div className="flex items-center justify-between mb-5">

                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                              Estado del Envío
                            </p>

                            <span className="text-[10px] font-bold uppercase text-[#073b78] bg-blue-50 px-3 py-1 rounded-full">
                              {ESTADOS_TIMELINE[pasoActual]?.etiqueta}
                            </span>

                          </div>


                          <div className="relative flex items-center justify-between">

                            <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-200 -translate-y-1/2 z-0 rounded-full" />

                            <div
                              className="absolute top-1/2 left-0 h-1 bg-[#073b78] -translate-y-1/2 z-0 transition-all duration-700 rounded-full"
                              style={{
                                width: `${
                                  (pasoActual /
                                    (ESTADOS_TIMELINE.length - 1)) *
                                  100
                                }%`
                              }}
                            />


                            {ESTADOS_TIMELINE.map(
                              (item, idx) => {

                                const Icono = item.icono;

                                const completado =
                                  idx <= pasoActual;

                                const esActual =
                                  idx === pasoActual;

                                return (

                                  <div
                                    key={item.clave}
                                    className="relative z-10 flex flex-col items-center"
                                  >

                                    <div
                                      className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                        completado
                                          ? 'bg-[#073b78] border-[#073b78] text-white shadow-md'
                                          : 'bg-white border-zinc-300 text-zinc-400'
                                      } ${
                                        esActual
                                          ? 'ring-4 ring-[#d8c38f]/30 scale-110'
                                          : ''
                                      }`}
                                    >

                                      <Icono className="w-4 h-4 md:w-5 md:h-5" />

                                    </div>

                                    <span
                                      className={`text-[9px] md:text-[10px] font-bold mt-2 whitespace-nowrap ${
                                        completado
                                          ? 'text-[#073b78]'
                                          : 'text-zinc-400'
                                      }`}
                                    >
                                      {item.etiqueta}
                                    </span>

                                  </div>

                                );

                              }
                            )}

                          </div>

                        </div>


                        {/* DIRECCIÓN */}

                        <div className="border-t pt-5 border-zinc-100">

                          <div className="flex items-start gap-3">

                            <div className="w-9 h-9 rounded-full bg-[#faf6ed] flex items-center justify-center shrink-0">

                              <MapPin className="w-4 h-4 text-[#b88a3b]" />

                            </div>

                            <div>

                              <p className="font-bold text-zinc-800 mb-1">
                                Dirección de Entrega
                              </p>

                              <p className="text-zinc-600">
                                {pedido.direccion}
                              </p>

                            </div>

                          </div>

                        </div>


                        {/* PRODUCTOS */}

                        {pedido.detalle_pedidos &&
                          pedido.detalle_pedidos.length > 0 && (

                            <div className="border-t pt-5 border-zinc-100">

                              <p className="text-[10px] text-zinc-400 font-bold uppercase mb-3 tracking-wider">
                                Detalle de Productos
                              </p>

                              <div className="border border-zinc-200 overflow-hidden">

                                {pedido.detalle_pedidos.map(
                                  (item, index) => (

                                    <div
                                      key={item.id}
                                      className={`flex justify-between items-center px-4 py-3 ${
                                        index % 2 === 0
                                          ? 'bg-[#fafaf8]'
                                          : 'bg-white'
                                      }`}
                                    >

                                      <div>

                                        <span className="font-bold text-[#073b78]">
                                          {item.cantidad}x
                                        </span>

                                        <span className="ml-2 text-zinc-700">
                                          {item.productos?.nombre ||
                                            'Producto'}
                                        </span>

                                      </div>

                                      <span className="font-bold text-zinc-700">

                                        $
                                        {(
                                          item.precio_unitario *
                                          item.cantidad
                                        ).toLocaleString('es-CO')}

                                      </span>

                                    </div>

                                  )
                                )}

                              </div>

                            </div>

                          )}

                      </CardContent>

                    )}

                  </Card>

                );

              })

            )}

          </div>

        )}


        {/* ===================================================== */}
        {/* DIRECCIONES */}
        {/* ===================================================== */}

        {tab === 'direcciones' && (

          <div className="space-y-6">

            {/* CABECERA */}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

              <div>

                <p className="text-[#b88a3b] text-[10px] tracking-[0.25em] uppercase font-bold mb-1">
                  ENTREGA
                </p>

                <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#073b78]">
                  Mis Direcciones
                </h2>

                <p className="text-xs text-zinc-500 mt-1">
                  Guarda tus ubicaciones frecuentes para realizar compras rápidamente.
                </p>

              </div>


              <Button
                onClick={() =>
                  setModalNuevaDir(!modalNuevaDir)
                }
                className={`text-white text-xs font-bold gap-2 cursor-pointer transition-all ${
                  modalNuevaDir
                    ? 'bg-zinc-700 hover:bg-zinc-800'
                    : 'bg-[#073b78] hover:bg-[#052d5e]'
                }`}
              >

                {modalNuevaDir ? (
                  <>
                    <X className="w-4 h-4" />
                    Cerrar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Nueva Dirección
                  </>
                )}

              </Button>

            </div>


            {/* FORMULARIO */}

            {modalNuevaDir && (

              <Card className="bg-white border-[#d8c38f] shadow-md overflow-hidden">

                <div className="h-1 bg-[#b88a3b]" />

                <CardHeader className="pb-2">

                  <CardTitle className="font-serif text-xl text-[#073b78]">
                    Agregar una dirección
                  </CardTitle>

                  <CardDescription className="text-xs">
                    Completa los datos para guardar una nueva ubicación.
                  </CardDescription>

                </CardHeader>

                <CardContent>

                  <form
                    onSubmit={handleAgregarDireccion}
                    className="space-y-5 text-xs"
                  >

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div>

                        <label className="font-bold text-zinc-700 block mb-1.5">
                          Nombre / Etiqueta
                        </label>

                        <Input
                          placeholder="Ej: Casa, Trabajo, Finca"
                          required
                          value={etiquetaDir}
                          onChange={(e) =>
                            setEtiquetaDir(e.target.value)
                          }
                          className="focus-visible:ring-[#073b78]"
                        />

                      </div>


                      <div>

                        <label className="font-bold text-zinc-700 block mb-1.5">
                          Ciudad
                        </label>

                        <select
                          value={ciudadDir}
                          onChange={(e) =>
                            setCiudadDir(e.target.value)
                          }
                          className="w-full border border-zinc-300 p-2.5 rounded-md text-xs bg-white font-medium outline-none focus:border-[#073b78] focus:ring-1 focus:ring-[#073b78]"
                        >

                          <option value="Barranquilla">
                            Barranquilla
                          </option>

                          <option value="Soledad">
                            Soledad
                          </option>

                          <option value="Cartagena">
                            Cartagena
                          </option>

                        </select>

                      </div>

                    </div>


                    <div>

                      <label className="font-bold text-zinc-700 block mb-1.5">
                        Dirección Exacta
                      </label>

                      <Input
                        placeholder="Ej: Cra 53 # 82-12"
                        required
                        value={textoDir}
                        onChange={(e) =>
                          setTextoDir(e.target.value)
                        }
                        className="focus-visible:ring-[#073b78]"
                      />

                    </div>


                    <div>

                      <label className="font-bold text-zinc-700 block mb-1.5">
                        Datos Adicionales
                      </label>

                      <Input
                        placeholder="Ej: Apto 402 Torre B"
                        value={datosAdicDir}
                        onChange={(e) =>
                          setDatosAdicDir(e.target.value)
                        }
                        className="focus-visible:ring-[#073b78]"
                      />

                    </div>


                    <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setModalNuevaDir(false)
                        }
                        className="text-xs"
                      >
                        Cancelar
                      </Button>

                      <Button
                        type="submit"
                        disabled={guardandoDireccion}
                        className="bg-[#073b78] hover:bg-[#052d5e] text-white text-xs gap-2"
                      >

                        {guardandoDireccion ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Guardar Dirección
                          </>
                        )}

                      </Button>

                    </div>

                  </form>

                </CardContent>

              </Card>

            )}


            {/* LISTA DIRECCIONES */}

            {direcciones.length === 0 ? (

              <Card className="bg-white border-zinc-200 shadow-sm text-center py-12 px-6">

                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#faf6ed] flex items-center justify-center">

                  <MapPin className="w-6 h-6 text-[#b88a3b]" />

                </div>

                <h3 className="font-serif text-lg font-bold text-zinc-800">
                  No tienes direcciones guardadas
                </h3>

                <p className="text-xs text-zinc-500 mt-1">
                  Agrega una dirección para agilizar tus próximos pedidos.
                </p>

              </Card>

            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {direcciones.map((d) => {

                  const IconoDireccion =
                    getIconoDireccion(d.etiqueta);

                  return (

                    <Card
                      key={d.id}
                      className="bg-white border-zinc-200 shadow-sm hover:shadow-md hover:border-[#d8c38f] transition-all duration-300 overflow-hidden group"
                    >

                      <CardContent className="p-5">

                        <div className="flex justify-between items-start gap-4">

                          <div className="flex gap-3">

                            <div className="w-10 h-10 rounded-full bg-[#faf6ed] flex items-center justify-center shrink-0 group-hover:bg-[#073b78] transition-colors">

                              <IconoDireccion className="w-5 h-5 text-[#b88a3b] group-hover:text-white transition-colors" />

                            </div>


                            <div className="space-y-1">

                              <div className="flex items-center gap-2 flex-wrap">

                                <span className="font-bold text-[#073b78] text-sm">
                                  {d.etiqueta}
                                </span>

                                <span className="bg-zinc-100 text-zinc-600 text-[10px] px-2 py-0.5 font-semibold rounded-full">
                                  {d.ciudad}
                                </span>

                                {d.es_predeterminada && (

                                  <span className="bg-[#073b78] text-white text-[9px] px-2 py-0.5 font-bold rounded-full uppercase">
                                    Principal
                                  </span>

                                )}

                              </div>


                              <p className="font-bold text-zinc-900 text-sm">
                                {d.direccion}
                              </p>


                              {d.datos_adicionales && (

                                <p className="text-xs text-zinc-500">
                                  {d.datos_adicionales}
                                </p>

                              )}

                            </div>

                          </div>


                          <button
                            onClick={() =>
                              eliminarDireccion(d.id)
                            }
                            disabled={
                              direccionEliminando === d.id
                            }
                            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full cursor-pointer transition-all disabled:opacity-50"
                            title="Eliminar dirección"
                          >

                            {direccionEliminando === d.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}

                          </button>

                        </div>

                      </CardContent>

                    </Card>

                  );

                })}

              </div>

            )}

          </div>

        )}

      </div>

    </div>
  );
}