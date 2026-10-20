import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

function readCart(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user, isLoading } = useAuth();
  const storageKey = `agri-tech-cart:${user?._id || 'guest'}`;
  const [items, setItems] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    if (isLoading) return;
    setItems(readCart(storageKey));
    setLoadedKey(storageKey);
  }, [isLoading, storageKey]);

  useEffect(() => {
    if (!isLoading && loadedKey === storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
        // Keep the in-memory cart usable when browser storage is unavailable.
      }
    }
  }, [items, isLoading, loadedKey, storageKey]);

  const addItem = useCallback((resource, qty = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.resourceId === resource._id);
      if (existing) {
        return current.map((item) => (item.resourceId === resource._id
          ? { ...item, ...resourceSnapshot(resource), qty: item.qty + qty }
          : item));
      }
      return [...current, { ...resourceSnapshot(resource), qty }];
    });
  }, []);

  const setQuantity = useCallback((resourceId, qty) => {
    if (!Number.isInteger(qty) || qty < 1) return;
    setItems((current) => current.map((item) => (item.resourceId === resourceId ? { ...item, qty } : item)));
  }, []);

  const removeItem = useCallback((resourceId) => {
    setItems((current) => current.filter((item) => item.resourceId !== resourceId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const estimatedTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const value = useMemo(() => ({
    items, itemCount, estimatedTotal, addItem, setQuantity, removeItem, clearCart,
  }), [items, itemCount, estimatedTotal, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function resourceSnapshot(resource) {
  return {
    resourceId: resource._id,
    name: resource.name,
    price: resource.price,
    unit: resource.unit,
    stock: resource.stock,
    imageUrl: resource.imageUrl || '',
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
