'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  QrCode,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  Receipt,
  CreditCard,
  Smartphone,
  Banknote,
  MoreHorizontal,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageHeader } from '@/components/PageHeader';
import { parseQRData, formatCurrency } from '@/lib/utils';

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

const paymentMethods = [
  { id: 'CASH', icon: Banknote, labelKey: 'cash' },
  { id: 'CARD', icon: CreditCard, labelKey: 'card' },
  { id: 'MOBILE', icon: Smartphone, labelKey: 'mobile' },
  { id: 'OTHER', icon: MoreHorizontal, labelKey: 'other' },
];

export default function POSPage() {
  const t = useTranslations('pos');
  const tCommon = useTranslations('common');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('ETB');
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch('/api/business');
        if (response.ok) {
          const data = await response.json();
          setCurrency(data.business?.currency || 'ETB');
        }
      } catch {
        // Ignore
      }
    }
    fetchBusiness();
  }, []);

  const searchProducts = useCallback(async () => {
    if (!search.trim()) {
      setProducts([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(search)}`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch {
      // Ignore
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchProducts]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const handleScan = useCallback(async (decodedText: string) => {
    let productId = parseQRData(decodedText);
    if (!productId) productId = decodedText;

    try {
      const response = await fetch(
        `/api/products/by-qr/${encodeURIComponent(productId)}`
      );
      if (response.ok) {
        const data = await response.json();
        addToCart(data.product);
        setShowScanner(false);
      }
    } catch {
      // Ignore
    }
  }, [addToCart]);

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('pos-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => { }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
    }
  }, [handleScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [showScanner, startScanner, stopScanner]);

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

  const subtotal = cart.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0
  );
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
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

      {/* Cart */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('emptyCart')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('addProducts')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="card p-3 flex items-center gap-3"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(item.salePrice, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Bar */}
      {cart.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('subtotal')}</span>
            <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t('discount')} ({discount}%)</span>
              <span>-{formatCurrency(discountAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>{t('total')}</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="w-full btn btn-primary py-3"
          >
            {t('checkout')}
          </button>
        </div>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 p-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('searchProducts')}
                    className="input pl-10"
                    autoFocus
                  />
                </div>
                <button onClick={() => setShowSearch(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addToCart(product);
                      setShowSearch(false);
                      setSearch('');
                    }}
                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="text-gray-500">
                      {formatCurrency(product.salePrice, currency)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          >
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setShowScanner(false)}
                className="text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <div
                id="pos-scanner"
                className="w-full max-w-md aspect-square rounded-xl overflow-hidden"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4">{t('checkout')}</h2>

              <div className="space-y-4">
                <div>
                  <label className="label">{t('discountPercent')}</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                    }
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="label">{t('paymentMethod')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${paymentMethod === method.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 ring-2 ring-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs">{t(method.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>{t('total')}</span>
                    <span>{formatCurrency(total, currency)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full btn btn-primary py-3"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      t('completeSale')
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4 text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('saleComplete')}</h2>
              <p className="text-2xl font-bold text-green-600 mb-4">
                {formatCurrency(lastTransaction.total, currency)}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 btn btn-primary"
                >
                  {t('newSale')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
