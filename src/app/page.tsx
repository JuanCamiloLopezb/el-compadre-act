'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import { CartDrawer } from '../components/CartDrawer';
import AuthModal from '../components/AuthModal';
import { Button } from '@/components/ui/button';

import {
Search,
UserRound,
ChevronDown,
ArrowRight,
Wine,
Beer,
Martini,
GlassWater,
User,
Package,
LogOut,
ShoppingBag,
X
} from 'lucide-react';

import Link from 'next/link';

interface Producto {
id: string;
nombre: string;
descripcion: string;
precio: number;
stock: number;
categoria: string;
subcategoria?: string;
imagen_url?: string;
}

const CATEGORIAS_HERO = [
{ nombre: 'Whisky', icono: GlassWater },
{ nombre: 'Ron', icono: Wine },
{ nombre: 'Aguardiente', icono: Martini },
{ nombre: 'Cervezas', icono: Beer },
{ nombre: 'Snacks', icono: ShoppingBag },
];

const OPCIONES_CATEGORIAS = {
Whisky: [
'Whisky Nacional',
'Whisky Importado',
'Whisky Escocés',
'Whisky Americano',
'Whisky Premium',
],

Ron: [
'Ron Nacional',
'Ron Importado',
'Ron Añejo',
'Ron Premium',
'Ron Blanco',
],

Aguardiente: [
'Aguardiente Antioqueño',
'Aguardiente Néctar',
'Aguardiente Amarillo',
'Aguardiente Premium',
'Todos los aguardientes',
],

Cervezas: [
'Cervezas Nacionales',
'Cervezas Importadas',
'Cervezas Ligeras',
'Cervezas Premium',
'Todas las cervezas',
],
};

export default function Home() {
const [productos, setProductos] = useState<Producto[]>([]);
const [loading, setLoading] = useState(true);
const [esAdmin, setEsAdmin] = useState(false);
const [usuario, setUsuario] = useState<any>(null);
const [authModalOpen, setAuthModalOpen] = useState(false);
const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
const [busqueda, setBusqueda] = useState('');
const [categoriaActiva, setCategoriaActiva] = useState('Todos');
const [menuCategoriaAbierto, setMenuCategoriaAbierto] =
useState<string | null>(null);
const [opcionActiva, setOpcionActiva] =
useState<string | null>(null);
const [productoSeleccionado, setProductoSeleccionado] =
useState<Producto | null>(null);

const { items, addItem, removeItem } = useCartStore();

useEffect(() => {
async function init() {
const { data: prods } = await supabase
.from('productos')
.select('*')
.eq('activo', true)
.order('categoria', { ascending: true });


  setProductos(prods || []);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    setUsuario(user);

    if (user.user_metadata?.rol === 'admin') {
      setEsAdmin(true);
    }
  }

  setLoading(false);
}

init();


}, []);

const handleCerrarSesion = async () => {
await supabase.auth.signOut();
setUsuario(null);
setEsAdmin(false);
window.location.reload();
};

const handleAgregarAlCarrito = (producto: Producto) => {
addItem(producto);
};

const productosFiltrados = productos.filter((p) => {
const coincideCategoria =
categoriaActiva === 'Todos' ||
p.categoria.toLowerCase() === categoriaActiva.toLowerCase();


const coincideBusqueda =
  p.nombre.toLowerCase().includes(busqueda.toLowerCase());

return coincideCategoria && coincideBusqueda;


});

const handleMenuCategoria = (categoria: string) => {
setCategoriaActiva(categoria);


if (menuCategoriaAbierto === categoria) {
  setMenuCategoriaAbierto(null);
} else {
  setMenuCategoriaAbierto(categoria);
}

setOpcionActiva(null);


};

const handleOpcionCategoria = (
categoria: string,
opcion: string
) => {
setCategoriaActiva(categoria);
setOpcionActiva(opcion);
};

return ( <div className="min-h-screen bg-[#fafaf8] text-[#202020] font-sans">


  <div className="bg-[#202020] text-white py-2 text-center text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium">
    ENVÍOS RÁPIDOS • PRODUCTOS SELECCIONADOS • COMPRA SEGURA
  </div>

  <header className="bg-[#073b78] text-white sticky top-0 z-[1000] shadow-md relative">

    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">

      <Link
        href="/"
        className="flex items-center gap-3"
      >
        <img
          src="/image/Logo.jpeg"
          alt="El Compadre"
          className="h-14 w-auto object-contain rounded-full border border-white/20"
        />
      </Link>

      <div className="flex-1 max-w-md relative hidden md:block">

        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-transparent border border-white/30 rounded-none px-4 py-2 text-sm text-white placeholder:text-white/70 outline-none focus:border-white transition-colors"
        />

        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />

      </div>

      <div className="flex items-center gap-4">

        {esAdmin && (
          <Link href="/admin">

            <Button
              variant="ghost"
              size="sm"
              className="text-white text-xs font-bold hover:bg-white/10"
            >
              📦 Admin
            </Button>

          </Link>
        )}

        {usuario ? (

          <div className="relative z-[9999]">

            <button
              onClick={() =>
                setMenuPerfilAbierto(!menuPerfilAbierto)
              }
              className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer flex items-center justify-center"
            >
              <UserRound className="w-5 h-5 text-white" />
            </button>

            {menuPerfilAbierto && (

              <div
                className="
                  absolute
                  right-0
                  top-full
                  mt-2
                  w-48
                  bg-white
                  rounded-lg
                  shadow-2xl
                  border
                  border-zinc-200
                  py-2
                  text-zinc-900
                  text-xs
                  z-[99999]
                "
              >

                <div className="px-4 py-1.5 font-bold text-zinc-400 uppercase text-[10px]">
                  Mi Cuenta
                </div>

                <div className="border-t border-zinc-100 my-1" />

                <Link
                  href="/perfil"
                  onClick={() =>
                    setMenuPerfilAbierto(false)
                  }
                  className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 font-medium text-zinc-700"
                >
                  <User className="w-4 h-4 text-[#073b78]" />
                  Ver Perfil
                </Link>

                <Link
                  href="/perfil"
                  onClick={() =>
                    setMenuPerfilAbierto(false)
                  }
                  className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 font-medium text-zinc-700"
                >
                  <Package className="w-4 h-4 text-[#073b78]" />
                  Mis Pedidos
                </Link>

                <div className="border-t border-zinc-100 my-1" />

                <button
                  onClick={handleCerrarSesion}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>

              </div>

            )}

          </div>

        ) : (

          <button
            onClick={() => setAuthModalOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer"
            title="Iniciar Sesión"
          >
            <UserRound className="w-5 h-5 text-white" />
          </button>

        )}

        <CartDrawer />

      </div>

    </div>

    <nav className="border-t border-white/10 bg-[#073b78] hidden md:block relative z-[9990]">

      <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 h-10 text-[11px] uppercase tracking-[0.15em] text-white/90">

        <button
          onClick={() => {
            setCategoriaActiva('Todos');
            setMenuCategoriaAbierto(null);
            setOpcionActiva(null);
          }}
          className="h-10 hover:text-[#d8c38f] transition-colors cursor-pointer"
        >
          INICIO
        </button>

        {(['Whisky', 'Ron', 'Aguardiente', 'Cervezas'] as const).map(
          (categoria) => (

            <div
              key={categoria}
              className="relative h-10 flex items-center"
            >

              <button
                onClick={() =>
                  handleMenuCategoria(categoria)
                }
                className={`h-10 flex items-center gap-1 transition-colors cursor-pointer ${
                  menuCategoriaAbierto === categoria
                    ? 'text-[#d8c38f]'
                    : 'hover:text-[#d8c38f]'
                }`}
              >

                {categoria.toUpperCase()}

                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    menuCategoriaAbierto === categoria
                      ? 'rotate-180'
                      : ''
                  }`}
                />

              </button>

              {menuCategoriaAbierto === categoria && (

                <div className="absolute top-[40px] left-0 w-72 bg-white text-zinc-700 shadow-2xl border border-zinc-200 normal-case tracking-normal z-[99999]">

                  <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-zinc-200 rotate-45" />

                  <div className="relative bg-white py-4">

                    <div className="px-6 pb-3 text-[10px] uppercase tracking-[0.2em] font-bold text-[#b88a3b]">
                      Explora
                    </div>

                    <div className="px-6 pb-3 font-serif text-xl text-[#202020]">
                      {categoria}
                    </div>

                    {OPCIONES_CATEGORIAS[categoria].map(
                      (opcion) => (

                        <button
                          key={opcion}
                          onClick={() =>
                            handleOpcionCategoria(
                              categoria,
                              opcion
                            )
                          }
                          className={`w-full flex items-center justify-between px-6 py-3.5 text-left text-sm transition-colors cursor-pointer ${
                            opcionActiva === opcion
                              ? 'bg-[#faf6ed] text-[#073b78] font-semibold'
                              : 'hover:bg-[#fafaf8] hover:text-[#073b78]'
                          }`}
                        >

                          <span>
                            {opcion}
                          </span>

                          <ArrowRight className="w-4 h-4 text-zinc-300" />

                        </button>

                      )
                    )}

                  </div>

                </div>

              )}

            </div>

          )
        )}

        <button
          onClick={() => {
            setCategoriaActiva('Todos');
            setMenuCategoriaAbierto(null);
            setOpcionActiva(null);
          }}
          className="h-10 hover:text-[#d8c38f] transition-colors cursor-pointer"
        >
          OFERTAS
        </button>

      </div>

    </nav>

  </header>

  <AuthModal
    open={authModalOpen}
    onOpenChange={setAuthModalOpen}
  />

  <section className="relative min-h-[520px] bg-[#111] overflow-hidden flex items-center">

    <div className="absolute inset-0 z-0">

      <div
        className="w-full h-full bg-cover bg-center opacity-85 scale-105"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(0,0,0,0.85) 0%,
              rgba(0,0,0,0.4) 50%,
              rgba(0,0,0,0.1) 100%
            ),
            url('/hero-bg.jpg')
          `
        }}
      />

    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full">

      <div className="max-w-xl space-y-6">

        <p className="text-[#d8c38f] text-xs font-semibold tracking-[0.3em] uppercase">
          BIENVENIDO A EL COMPADRE
        </p>

        <h1 className="font-serif text-5xl sm:text-6xl text-white leading-[1.05] tracking-tight">
          El sabor de <br />
          <span className="italic font-serif">
            compartir.
          </span>
        </h1>

        <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md">
          Descubre nuestra selección de licores, cervezas y bebidas para acompañar tus mejores momentos.
        </p>

        <button
          onClick={() =>
            document
              .getElementById('catalogo')
              ?.scrollIntoView({
                behavior: 'smooth'
              })
          }
          className="inline-flex items-center gap-3 bg-[#b88a3b] hover:bg-[#a37932] text-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.15em] transition-all shadow-lg cursor-pointer"
        >
          EXPLORAR PRODUCTOS
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

    </div>

  </section>

  <section
    id="catalogo"
    className="py-16 bg-white"
  >

    <div className="max-w-7xl mx-auto px-6 text-center">

      <p className="text-[#b88a3b] text-xs tracking-[0.3em] uppercase font-bold mb-2">
        EXPLORA NUESTRA SELECCIÓN
      </p>

      <h2 className="font-serif text-3xl sm:text-4xl text-[#202020] mb-12">
        Compra por categoría
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {CATEGORIAS_HERO.map((cat) => {

          const Icono = cat.icono;

          return (

            <button
              key={cat.nombre}
              onClick={() =>
                setCategoriaActiva(
                  categoriaActiva === cat.nombre
                    ? 'Todos'
                    : cat.nombre
                )
              }
              className={`p-8 border flex flex-col items-center justify-center gap-4 transition-all group cursor-pointer ${
                categoriaActiva === cat.nombre
                  ? 'border-[#b88a3b] bg-[#faf6ed] shadow-sm'
                  : 'border-zinc-200 bg-[#fafaf8] hover:border-[#b88a3b]'
              }`}
            >

              <Icono
                className={`w-8 h-8 transition-transform ${
                  categoriaActiva === cat.nombre
                    ? 'text-[#b88a3b] scale-110'
                    : 'text-[#073b78] group-hover:scale-110'
                }`}
              />

              <div className="flex items-center gap-1">

                <span
                  className={`font-serif text-lg ${
                    categoriaActiva === cat.nombre
                      ? 'text-[#073b78] font-bold'
                      : 'text-zinc-900'
                  }`}
                >
                  {cat.nombre}
                </span>

              </div>

            </button>

          );

        })}

      </div>

    </div>

  </section>

  <section className="py-12 bg-[#fafaf8] border-t border-zinc-200">

    <div className="max-w-7xl mx-auto px-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {productosFiltrados.map((producto) => {

          const cartItem = items.find(
            (i) => i.id === producto.id
          );

          const cantidad = cartItem
            ? cartItem.cantidad
            : 0;

          return (

            <div
              key={producto.id}
              onClick={() =>
                setProductoSeleccionado(producto)
              }
              className="bg-white border border-zinc-200 p-5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all min-h-[450px] cursor-pointer"
            >

              <div className="h-56 flex items-center justify-center relative mb-5 overflow-hidden">

                {producto.imagen_url ? (

                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-full object-contain"
                  />

                ) : (

                  <span className="text-5xl">
                    🍾
                  </span>

                )}

                <span className="absolute top-2 right-2 text-[10px] bg-zinc-900 text-white px-2 py-0.5 font-bold uppercase">
                  {producto.categoria}
                </span>

              </div>

              <div>

                <h3 className="font-serif text-base text-zinc-900 font-bold line-clamp-1">
                  {producto.nombre}
                </h3>

                <p className="text-[10px] leading-[1.4] text-zinc-500 mt-1 line-clamp-2">
                  {producto.descripcion}
                </p>

                <p className="text-lg font-black text-[#073b78] mt-3 mb-4">
                  ${producto.precio.toLocaleString('es-CO')}
                </p>

                {cantidad === 0 ? (

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgregarAlCarrito(producto);
                    }}
                    className="w-full bg-[#073b78] hover:bg-[#052d5e] text-white text-xs font-bold uppercase py-2.5 tracking-wider transition-colors cursor-pointer"
                  >
                    Agregar
                  </button>

                ) : (

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between border border-zinc-300 p-1"
                  >

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(producto.id);
                      }}
                      className="w-8 h-8 font-bold bg-zinc-100 hover:bg-zinc-200 cursor-pointer"
                    >
                      -
                    </button>

                    <span className="text-sm font-bold">
                      {cantidad}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAgregarAlCarrito(producto);
                      }}
                      className="w-8 h-8 font-bold bg-[#073b78] text-white cursor-pointer"
                    >
                      +
                    </button>

                  </div>

                )}

              </div>

            </div>

          );

        })}

      </div>

    </div>

  </section>

  {productoSeleccionado && (

    <div
      className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setProductoSeleccionado(null)}
    >

      <div
        className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          onClick={() => setProductoSeleccionado(null)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-zinc-700" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">

          <div className="bg-zinc-50 min-h-[350px] flex items-center justify-center p-8">

            {productoSeleccionado.imagen_url ? (

              <img
                src={productoSeleccionado.imagen_url}
                alt={productoSeleccionado.nombre}
                className="max-h-[400px] w-full object-contain"
              />

            ) : (

              <span className="text-8xl">
                🍾
              </span>

            )}

          </div>

          <div className="p-8 flex flex-col justify-center">

            <span className="inline-block w-fit bg-[#202020] text-white text-[10px] px-3 py-1 font-bold uppercase tracking-wider mb-4">
              {productoSeleccionado.categoria}
            </span>

            <h2 className="font-serif text-3xl text-[#202020] font-bold leading-tight mb-4">
              {productoSeleccionado.nombre}
            </h2>

            <div className="border-t border-zinc-200 pt-4 mb-6">

              <p className="text-xs uppercase tracking-[0.2em] text-[#b88a3b] font-bold mb-2">
                Descripción
              </p>

              <p className="text-sm text-zinc-600 leading-relaxed">
                {productoSeleccionado.descripcion}
              </p>

            </div>

            <div className="mb-6">

              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold mb-1">
                Precio
              </p>

              <p className="text-3xl font-black text-[#073b78]">
                ${productoSeleccionado.precio.toLocaleString('es-CO')}
              </p>

            </div>

            {(() => {

              const itemModal = items.find(
                (i) => i.id === productoSeleccionado.id
              );

              const cantidadModal = itemModal
                ? itemModal.cantidad
                : 0;

              if (cantidadModal === 0) {

                return (

                  <button
                    onClick={() =>
                      handleAgregarAlCarrito(
                        productoSeleccionado
                      )
                    }
                    className="w-full bg-[#073b78] hover:bg-[#052d5e] text-white py-3 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Agregar al carrito
                  </button>

                );

              }

              return (

                <div className="flex items-center justify-between border border-zinc-300 p-1">

                  <button
                    onClick={() =>
                      removeItem(
                        productoSeleccionado.id
                      )
                    }
                    className="w-10 h-10 font-bold bg-zinc-100 hover:bg-zinc-200 cursor-pointer"
                  >
                    -
                  </button>

                  <span className="font-bold">
                    {cantidadModal}
                  </span>

                  <button
                    onClick={() =>
                      handleAgregarAlCarrito(
                        productoSeleccionado
                      )
                    }
                    className="w-10 h-10 font-bold bg-[#073b78] text-white cursor-pointer"
                  >
                    +
                  </button>

                </div>

              );

            })()}

          </div>

        </div>

      </div>

    </div>

  )}

</div>


);
}
