import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { useStore } from '../store/useStore';
import {
  ShoppingCart,
  Camera,
  X,
  Plus,
  Minus,
  Trash2,
  Check,
  Receipt,
  Search,
} from 'lucide-react';
import { parseQRData, formatCurrency, generateId, formatDateTime } from '../utils/helpers';
import type { Transaction } from '../types';

export default function POS() {
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, addTransaction, settings, currentStaff } = useStore();
  const [isScanning, setIsScanning] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const subtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const profit = cart.reduce(
    (sum, item) => sum + (item.product.salePrice - item.product.costPrice) * item.quantity,
    0
  );

  const startScanner = async () => {
    try {
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());

      const scanner = new Html5Qrcode('pos-qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // Ignore scanning errors
        }
      );

      setIsScanning(true);
    } catch (error: any) {
      console.error('Failed to start scanner:', error);
      let errorMessage = 'Failed to access camera. ';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please check permissions and try again.';
      }

      alert(errorMessage);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Failed to stop scanner:', error);
      }
    }
    setIsScanning(false);
  };

  const handleScan = async (qrData: string) => {
    const productId = parseQRData(qrData);
    if (!productId) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      alert('Product out of stock');
      return;
    }

    addToCart(product, 1);
    await stopScanner();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Check stock availability
    for (const item of cart) {
      if (item.product.stock < item.quantity) {
        alert(`Insufficient stock for ${item.product.name}`);
        return;
      }
    }

    const transaction: Transaction = {
      id: generateId('txn-'),
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      profit,
      staffId: currentStaff?.id,
      staffName: currentStaff?.name,
      createdAt: Date.now(),
    };

    await addTransaction(transaction);
    setShowReceipt(transaction);
    clearCart();
    setDiscount(0);
  };

  const handlePrintReceipt = () => {
    if (!showReceipt) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${showReceipt.id}</title>
            <style>
              body {
                font-family: monospace;
                max-width: 300px;
                margin: 20px auto;
                padding: 20px;
              }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
              .items { margin: 20px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .totals { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; }
              .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .final-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${settings.businessName}</h2>
              <p>${formatDateTime(showReceipt.createdAt)}</p>
              <p>Transaction: ${showReceipt.id}</p>
              ${showReceipt.staffName ? `<p>Staff: ${showReceipt.staffName}</p>` : ''}
            </div>
            <div class="items">
              ${showReceipt.items.map(item => `
                <div class="item">
                  <div>${item.product.name} x${item.quantity}</div>
                  <div>${formatCurrency(item.product.salePrice * item.quantity, settings.currency)}</div>
                </div>
              `).join('')}
            </div>
            <div class="totals">
              <div class="total-row">
                <div>Subtotal:</div>
                <div>${formatCurrency(showReceipt.subtotal, settings.currency)}</div>
              </div>
              ${showReceipt.discount > 0 ? `
                <div class="total-row">
                  <div>Discount:</div>
                  <div>-${formatCurrency(showReceipt.discount, settings.currency)}</div>
                </div>
              ` : ''}
              <div class="total-row final-total">
                <div>TOTAL:</div>
                <div>${formatCurrency(showReceipt.total, settings.currency)}</div>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
              ${settings.receiptMessage ? `<p>${settings.receiptMessage}</p>` : ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, []);

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-gray-900"
        >
          Point of Sale
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={isScanning ? stopScanner : startScanner}
          className={`px-4 py-2 rounded-xl font-medium shadow-lg flex items-center gap-2 ${
            isScanning
              ? 'bg-red-500 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {isScanning ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          {isScanning ? 'Stop' : 'Scan'}
        </motion.button>
      </div>

      {/* Scanner */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg"
          >
            <div id="pos-qr-reader" className="w-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products by name, code, or category..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg"
        />

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10"
          >
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  if (product.stock <= 0) {
                    alert('Product out of stock');
                    return;
                  }
                  addToCart(product, 1);
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="w-full px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.category && <span className="text-purple-600">{product.category} • </span>}
                      Stock: {product.stock} • {formatCurrency(product.salePrice, settings.currency)}
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-purple-500" />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Cart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart ({cart.length})
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 text-sm font-medium hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Cart is empty</p>
            <p className="text-sm text-gray-500 mt-2">Scan products to add them</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.product.salePrice, settings.currency)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => {
                        if (item.quantity < item.product.stock) {
                          updateCartQuantity(item.product.id, item.quantity + 1);
                        } else {
                          alert('Insufficient stock');
                        }
                      }}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.product.salePrice * item.quantity, settings.currency)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Checkout */}
      {cart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Checkout</h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, settings.currency)}</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-gray-600">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-gray-600 min-w-[80px] text-right">
                -{formatCurrency(discountAmount, settings.currency)}
              </span>
            </div>

            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(total, settings.currency)}</span>
            </div>

            <div className="flex justify-between text-sm text-green-600">
              <span>Profit</span>
              <span>{formatCurrency(profit, settings.currency)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" />
            Complete Sale
          </button>
        </motion.div>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-6 h-6" />
                  Receipt
                </h2>
                <button
                  onClick={() => setShowReceipt(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {settings.businessName}
                  </h3>
                  <p className="text-gray-600">{formatDateTime(showReceipt.createdAt)}</p>
                  <p className="text-sm text-gray-500 mt-1">ID: {showReceipt.id}</p>
                </div>

                <div className="space-y-2 mb-4">
                  {showReceipt.items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.product.salePrice * item.quantity, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(showReceipt.subtotal, settings.currency)}</span>
                  </div>
                  {showReceipt.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(showReceipt.discount, settings.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total</span>
                    <span>{formatCurrency(showReceipt.total, settings.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReceipt(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
