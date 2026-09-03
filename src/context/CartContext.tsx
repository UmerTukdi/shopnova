'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface CartProduct {
  _id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp: number;
  stock: number;
  category: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface RawCartItem {
  product?: CartProduct;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const GUEST_CART_KEY = 'shopnova_guest_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper for localStorage guest cart
  const getGuestCart = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveGuestCart = (guestItems: CartItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestItems));
    } catch (e) {
      console.error('Error saving guest cart:', e);
    }
  };

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems(getGuestCart());
      return;
    }

    try {
      setLoading(true);

      const guestItems = getGuestCart();
      if (guestItems.length > 0) {
        const syncRes = await fetch('/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: guestItems.map((gi) => ({
              productId: gi.product._id,
              quantity: gi.quantity,
            })),
          }),
        });
        const syncData = await syncRes.json();
        if (syncData.success) {
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }

      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success && data.cart) {
        const validItems = ((data.cart.items || []) as RawCartItem[]).filter(
          (item): item is CartItem => Boolean(item.product && item.product._id)
        );
        setItems(validItems);
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setItems(getGuestCart());
      return;
    }

    const loadCart = async () => {
      try {
        setLoading(true);
        const guestItems = getGuestCart();
        if (guestItems.length > 0) {
          const syncRes = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: guestItems.map((gi) => ({
                productId: gi.product._id,
                quantity: gi.quantity,
              })),
            }),
          });
          const syncData = await syncRes.json();
          if (syncData.success) {
            localStorage.removeItem(GUEST_CART_KEY);
          }
        }

        const res = await fetch('/api/cart');
        const data = await res.json();
        if (data.success && data.cart && active) {
          const validItems = ((data.cart.items || []) as RawCartItem[]).filter(
            (item): item is CartItem => Boolean(item.product && item.product._id)
          );
          setItems(validItems);
        }
      } catch (err) {
        console.error('Cart load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCart();

    return () => {
      active = false;
    };
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (!data.success || !data.product) {
          return { success: false, error: 'Product not found' };
        }
        const product = data.product;
        if (product.stock < 1) {
          return { success: false, error: 'Product is out of stock' };
        }

        const currentGuest = getGuestCart();
        const existingIdx = currentGuest.findIndex((ci) => ci.product._id === productId);

        let updatedGuest: CartItem[];
        if (existingIdx > -1) {
          const newQty = Math.min(product.stock, currentGuest[existingIdx].quantity + quantity);
          updatedGuest = currentGuest.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: newQty } : item
          );
        } else {
          updatedGuest = [
            ...currentGuest,
            {
              product: {
                _id: product._id,
                name: product.name,
                slug: product.slug,
                image: product.image,
                price: product.price,
                mrp: product.mrp || product.originalPrice || product.price,
                stock: product.stock,
                category: product.category,
              },
              quantity: Math.min(product.stock, quantity),
            },
          ];
        }

        saveGuestCart(updatedGuest);
        setItems(updatedGuest);
        return { success: true };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add guest item';
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();

      if (data.success && data.cart) {
        const validItems = ((data.cart.items || []) as RawCartItem[]).filter(
          (item): item is CartItem => Boolean(item.product && item.product._id)
        );
        setItems(validItems);
        return { success: true };
      }
      return { success: false, error: data.error || data.message || 'Failed to add item' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Server error';
      return { success: false, error: errorMsg };
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) {
      const currentGuest = getGuestCart();
      if (quantity <= 0) {
        const updated = currentGuest.filter((ci) => ci.product._id !== productId);
        saveGuestCart(updated);
        setItems(updated);
      } else {
        const updated = currentGuest.map((ci) =>
          ci.product._id === productId
            ? { ...ci, quantity: Math.min(ci.product.stock, quantity) }
            : ci
        );
        saveGuestCart(updated);
        setItems(updated);
      }
      return { success: true };
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();

      if (data.success && data.cart) {
        const validItems = ((data.cart.items || []) as RawCartItem[]).filter(
          (item): item is CartItem => Boolean(item.product && item.product._id)
        );
        setItems(validItems);
        return { success: true };
      }
      return { success: false, error: data.error || data.message || 'Failed to update quantity' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Server error';
      return { success: false, error: errorMsg };
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) {
      const updated = getGuestCart().filter((ci) => ci.product._id !== productId);
      saveGuestCart(updated);
      setItems(updated);
      return;
    }

    try {
      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.cart) {
        const validItems = ((data.cart.items || []) as RawCartItem[]).filter(
          (item): item is CartItem => Boolean(item.product && item.product._id)
        );
        setItems(validItems);
      }
    } catch (err) {
      console.error('Remove item error:', err);
    }
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem(GUEST_CART_KEY);
      setItems([]);
      return;
    }

    try {
      const res = await fetch('/api/cart?clearAll=true', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setItems([]);
      }
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0);
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shipping + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shipping,
        tax,
        grandTotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
