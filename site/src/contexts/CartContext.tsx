import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  id: string;
  type: 'standard' | 'premium';
  name: string;
  basePrice: number;
  hours: number;
  quantity: number;
  totalPrice: number;
}

interface CartContextType {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, change: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const addToCart = (newItem: CartItem) => {
    const existingItem = cartItems.find(item => item.hours === newItem.hours);

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === existingItem.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: item.basePrice * (item.quantity + 1) }
          : item
      ));
    } else {
      setCartItems([...cartItems, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity === 0) {
          return null;
        }
        return { 
          ...item, 
          quantity: newQuantity,
          totalPrice: item.basePrice * newQuantity
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    setCartItems,
    getTotalItems,
    getTotalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};