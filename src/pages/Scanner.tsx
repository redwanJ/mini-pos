import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { useStore } from '../store/useStore';
import { Camera, X, CheckCircle, AlertCircle, Minus, Plus } from 'lucide-react';
import { parseQRData, formatCurrency } from '../utils/helpers';
import type { Product } from '../types';

export default function Scanner() {
  const { products, updateProduct, settings } = useStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [deductQuantity, setDeductQuantity] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());

      const scanner = new Html5Qrcode('qr-reader');
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

      setMessage({ type: 'error', text: errorMessage });
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
    if (!productId) {
      setMessage({ type: 'error', text: 'Invalid QR code' });
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      setMessage({ type: 'error', text: 'Product not found' });
      return;
    }

    await stopScanner();
    setScannedProduct(product);
    setDeductQuantity(1);
  };

  const handleDeductStock = async () => {
    if (!scannedProduct) return;

    if (scannedProduct.stock < deductQuantity) {
      setMessage({ type: 'error', text: 'Insufficient stock' });
      return;
    }

    const updatedProduct = {
      ...scannedProduct,
      stock: scannedProduct.stock - deductQuantity,
      updatedAt: Date.now(),
    };

    await updateProduct(updatedProduct);
    setMessage({ type: 'success', text: `Deducted ${deductQuantity} unit(s) from ${scannedProduct.name}` });
    setScannedProduct(null);
    setDeductQuantity(1);

    setTimeout(() => {
      setMessage(null);
    }, 3000);
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
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold text-gray-900"
      >
        QR Scanner
      </motion.h1>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <p
              className={`font-medium ${
                message.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {message.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner */}
      {!isScanning && !scannedProduct && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 text-center shadow-lg"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
            <Camera className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Scan Product QR Code</h2>
          <p className="text-gray-600 mb-6">
            Point your camera at a product QR code to deduct stock
          </p>
          <button
            onClick={startScanner}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
          >
            Start Scanning
          </button>
        </motion.div>
      )}

      {/* Scanner View */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="relative">
            <div id="qr-reader" className="w-full" />
            <button
              onClick={stopScanner}
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <p className="text-center font-medium">
              Position the QR code within the frame
            </p>
          </div>
        </motion.div>
      )}

      {/* Scanned Product */}
      <AnimatePresence>
        {scannedProduct && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Product Scanned</h2>
              <button
                onClick={() => setScannedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{scannedProduct.name}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                  <p className="text-xl font-bold text-gray-900">{scannedProduct.stock} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(scannedProduct.salePrice, settings.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quantity to Deduct
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDeductQuantity(Math.max(1, deductQuantity - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={scannedProduct.stock}
                  value={deductQuantity}
                  onChange={(e) => setDeductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center text-2xl font-bold py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => setDeductQuantity(Math.min(scannedProduct.stock, deductQuantity + 1))}
                  className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setScannedProduct(null)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeductStock}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
              >
                Deduct Stock
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {!isScanning && !scannedProduct && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6"
        >
          <h3 className="font-bold text-blue-900 mb-3">How to use</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Click "Start Scanning" to activate your camera</li>
            <li>• Point the camera at a product QR code</li>
            <li>• Adjust the quantity to deduct</li>
            <li>• Confirm to update stock automatically</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}
