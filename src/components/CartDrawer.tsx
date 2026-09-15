'use client';

import { useCartStore } from '../store/useCartStore';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';

import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export function CartDrawer() {
  const {
    items,
    removeItem,
    addItem,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  return (
    <Sheet>

      {/* ===================================================== */}
      {/* BOTÓN DEL CARRITO */}
      {/* ===================================================== */}

      <SheetTrigger
        className="
          relative
          p-2
          hover:bg-white/10
          rounded-full
          transition-colors
          cursor-pointer
          outline-none
          border-0
          bg-transparent
        "
        aria-label="Abrir carrito"
      >
        <ShoppingBag className="w-5 h-5 text-white" />

        {getTotalItems() > 0 && (
          <span
            className="
              absolute
              -top-1
              -right-1
              bg-[#b88a3b]
              text-white
              text-[10px]
              font-bold
              w-5
              h-5
              rounded-full
              flex
              items-center
              justify-center
              border-2
              border-[#073b78]
            "
          >
            {getTotalItems()}
          </span>
        )}
      </SheetTrigger>


      {/* ===================================================== */}
      {/* PANEL DEL CARRITO */}
      {/* ===================================================== */}

      <SheetContent
        side="right"
        className="
          z-[99999]
          bg-white
          text-zinc-900
          w-full
          sm:max-w-md
          flex
          flex-col
          justify-between
          p-0
          border-l
          border-zinc-200
          shadow-2xl
        "
      >

        {/* ================================================= */}
        {/* ENCABEZADO */}
        {/* ================================================= */}

        <SheetHeader
          className="
            px-6
            py-5
            border-b
            border-zinc-200
            bg-white
          "
        >
          <SheetTitle
            className="
              font-serif
              text-xl
              text-[#073b78]
              flex
              items-center
              gap-2
            "
          >
            <ShoppingBag className="w-5 h-5" />

            Tu Carrito de Compras
          </SheetTitle>
        </SheetHeader>


        {/* ================================================= */}
        {/* CONTENIDO */}
        {/* ================================================= */}

        {items.length === 0 ? (

          <div
            className="
              flex-1
              flex
              flex-col
              items-center
              justify-center
              text-center
              p-6
              text-zinc-400
            "
          >
            <ShoppingBag
              className="w-12 h-12 mb-3 stroke-1"
            />

            <p className="font-bold text-zinc-700 text-sm">
              Tu carrito está vacío
            </p>

            <p className="text-xs mt-1">
              Agrega tus licores favoritos para iniciar el pedido.
            </p>
          </div>

        ) : (

          <div
            className="
              flex-1
              overflow-y-auto
              px-6
              py-4
              space-y-4
            "
          >

            {items.map((item) => (

              <div
                key={item.id}
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  border-b
                  pb-4
                  border-zinc-100
                "
              >

                {/* ================================================= */}
                {/* INFORMACIÓN DEL PRODUCTO */}
                {/* ================================================= */}

                <div className="flex-1 min-w-0">

                  <h4
                    className="
                      font-bold
                      text-sm
                      text-zinc-900
                      truncate
                    "
                  >
                    {item.nombre}
                  </h4>

                  <p
                    className="
                      text-xs
                      text-[#073b78]
                      font-black
                      mt-1
                    "
                  >
                    ${item.precio.toLocaleString('es-CO')}
                  </p>

                </div>


                {/* ================================================= */}
                {/* CONTROL DE CANTIDAD */}
                {/* ================================================= */}

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    border
                    border-zinc-200
                    rounded
                    p-1
                    bg-white
                  "
                >

                  {/* RESTAR */}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="
                      w-6
                      h-6
                      bg-zinc-100
                      text-xs
                      font-bold
                      rounded
                      hover:bg-zinc-200
                      cursor-pointer
                      transition-colors
                    "
                    aria-label={`Disminuir cantidad de ${item.nombre}`}
                  >
                    -
                  </button>


                  {/* CANTIDAD */}

                  <span
                    className="
                      text-xs
                      font-bold
                      px-1
                      min-w-[20px]
                      text-center
                    "
                  >
                    {item.cantidad}
                  </span>


                  {/* SUMAR */}

                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    className="
                      w-6
                      h-6
                      bg-[#073b78]
                      text-white
                      text-xs
                      font-bold
                      rounded
                      hover:bg-[#052d5e]
                      cursor-pointer
                      transition-colors
                    "
                    aria-label={`Aumentar cantidad de ${item.nombre}`}
                  >
                    +
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}


        {/* ================================================= */}
        {/* TOTAL Y CHECKOUT */}
        {/* ================================================= */}

        {items.length > 0 && (

          <SheetFooter
            className="
              border-t
              border-zinc-200
              px-6
              py-5
              bg-white
              flex-col
              gap-4
            "
          >

            {/* ================================================= */}
            {/* TOTAL */}
            {/* ================================================= */}

            <div
              className="
                flex
                justify-between
                items-center
                w-full
              "
            >

              <span
                className="
                  text-xs
                  font-bold
                  text-zinc-500
                  uppercase
                "
              >
                Total a pagar:
              </span>

              <span
                className="
                  font-serif
                  text-2xl
                  font-black
                  text-[#073b78]
                "
              >
                ${getTotalPrice().toLocaleString('es-CO')}
              </span>

            </div>


            {/* ================================================= */}
            {/* BOTÓN CHECKOUT */}
            {/* ================================================= */}

            <Link
              href="/checkout"
              className="w-full"
            >
              <Button
                type="button"
                className="
                  w-full
                  bg-[#073b78]
                  hover:bg-[#052d5e]
                  text-white
                  font-bold
                  py-3
                  uppercase
                  tracking-wider
                  text-xs
                  cursor-pointer
                "
              >
                Ir a Finalizar Compra
              </Button>
            </Link>

          </SheetFooter>

        )}

      </SheetContent>

    </Sheet>
  );
}