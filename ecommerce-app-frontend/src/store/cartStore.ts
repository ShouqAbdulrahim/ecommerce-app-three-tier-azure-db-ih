import { create } from 'zustand';
import { CartItem } from '../types';
import { cartAPI } from '../services/api';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  
  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const response = await cartAPI.getCart();
      set({
        items: response.data.items,
        total: response.data.total,
        itemCount: response.data.itemCount,
      });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  addToCart: async (productId: number, quantity: number) => {
    try {
      set({ isLoading: true });
      await cartAPI.addToCart(productId, quantity);
      await get().fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateQuantity: async (productId: number, quantity: number) => {
    try {
      set({ isLoading: true });
      await cartAPI.updateCartItem(productId, quantity);
      await get().fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  removeFromCart: async (productId: number) => {
    try {
      set({ isLoading: true });
      await cartAPI.removeFromCart(productId);
      await get().fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearCart: async () => {
    try {
      set({ isLoading: true });
      await cartAPI.clearCart();
      set({ items: [], total: 0, itemCount: 0 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
