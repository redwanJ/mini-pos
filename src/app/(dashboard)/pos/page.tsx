'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, QrCode } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBusiness } from '@/hooks/useBusiness';
import {
  CartList,
  CheckoutBar,
  SearchModal,
  ScannerModal,
  CheckoutModal,
  ReceiptModal,
} from './components';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  costPrice: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage() {
  const t = useTranslations('pos');
  const { currency } = useBusiness();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ total: number } | null>(null);

  const addToCart = useCallback((product: Product, incrementIfExists = true) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (!incrementIfExists) return prev;
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item;
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          if (newQuantity > item.stock) return item;
          return { ...item, quantity: newQuantity };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
    setPaymentMethod('CASH');
  }

  const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;

    setLoading(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          discount,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete sale');
      }

      const data = await response.json();
      setLastTransaction(data.transaction);
      setShowCheckout(false);
      setShowReceipt(true);
      clearCart();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title={t('title')}
        subtitle={itemCount > 0 ? t('itemsInCart', { count: itemCount }) : undefined}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4">
        <CartList
          items={cart}
          currency={currency}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
        />
      </div>

      {cart.length > 0 && (
        <CheckoutBar
          subtotal={subtotal}
          discount={discount}
          total={total}
          currency={currency}
          onCheckout={() => setShowCheckout(true)}
        />
      )}

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        currency={currency}
        onSelectProduct={(product) => addToCart(product)}
      />

      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onProductScanned={(product) => addToCart(product, true)}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        discount={discount}
        onDiscountChange={setDiscount}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        total={total}
        currency={currency}
        loading={loading}
        onCheckout={handleCheckout}
      />

      <ReceiptModal
        isOpen={showReceipt && !!lastTransaction}
        onClose={() => setShowReceipt(false)}
        total={lastTransaction?.total || 0}
        currency={currency}
      />
    </div>
  );
}
