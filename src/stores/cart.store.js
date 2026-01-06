import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    // persist is used to store the cart data in the local storage
    (set, get) => ({
      items: [],

      addToCart: (product) => {
        const items = get().items;
        // Use 'id' as standard, fallback to '_id' if present (migration safety)
        const productId = product.id || product._id;
        const existingItem = items.find(
          (item) => (item.id || item._id) === productId
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              (item.id || item._id) === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Ensure we store 'id'
          set({
            items: [...items, { ...product, id: productId, quantity: 1 }],
          });
        }
      },

      addItems: (newItems) => {
        const currentItems = get().items;
        const updatedItems = [...currentItems];

        newItems.forEach((newItem) => {
          const productId = newItem.id || newItem._id;
          const existingIndex = updatedItems.findIndex(
            (item) => (item.id || item._id) === productId
          );

          if (existingIndex > -1) {
            updatedItems[existingIndex].quantity += newItem.quantity;
          } else {
            updatedItems.push({ ...newItem, id: productId });
          }
        });

        set({ items: updatedItems });
      },

      removeFromCart: (productId) => {
        set({
          items: get().items.filter(
            (item) => (item.id || item._id) !== productId
          ),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            (item.id || item._id) === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "golden-zaika-cart", // Updated name
    }
  )
);
