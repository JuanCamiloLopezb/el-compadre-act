import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  cantidad: number;
  stock?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: { id: string; nombre: string; precio: number; imagen_url?: string; stock?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existing = currentItems.find((item) => item.id === product.id);

        if (existing) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, cantidad: item.cantidad + 1 }
                : item
            ),
          });
        } else {
          set({
            items: [...currentItems, { ...product, cantidad: 1 }],
          });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, cantidad: quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.cantidad, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + item.precio * item.cantidad, 0),
    }),
    {
      name: 'cart-storage-compadre',
    }
  )
);