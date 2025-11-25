import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Plus, Search, Edit, Trash2, QrCode, X } from 'lucide-react';
import type { Product } from '../types';
import { generateId, generateQRData, formatCurrency } from '../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showQR, setShowQR] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  const handleShowQR = (product: Product) => {
    setShowQR(product);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-gray-900"
        >
          Products
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddProduct}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </motion.button>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </motion.div>

      {/* Products Grid */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                  {product.category && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {product.category}
                    </span>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Cost</p>
                      <p className="font-medium">{formatCurrency(product.costPrice, settings.currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sale</p>
                      <p className="font-medium">{formatCurrency(product.salePrice, settings.currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Stock</p>
                      <p className={`font-medium ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock} units
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Profit</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(product.salePrice - product.costPrice, settings.currency)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleShowQR(product)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && !searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 text-center"
        >
          <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600">Add your first product to get started</p>
        </motion.div>
      )}

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editingProduct}
            onClose={() => setShowForm(false)}
            onSave={async (product) => {
              if (editingProduct) {
                await updateProduct(product);
              } else {
                await addProduct(product);
              }
              setShowForm(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <QRModal
            product={showQR}
            onClose={() => setShowQR(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const { products } = useStore();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    costPrice: product?.costPrice || 0,
    salePrice: product?.salePrice || 0,
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
    category: product?.category || '',
  });

  // Extract unique categories from existing products
  const existingCategories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => !!c))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productId = product?.id || generateId('prod-');
    const newProduct: Product = {
      id: productId,
      name: formData.name,
      costPrice: Number(formData.costPrice),
      salePrice: Number(formData.salePrice),
      stock: Number(formData.stock),
      lowStockThreshold: Number(formData.lowStockThreshold),
      category: formData.category,
      qrCode: generateQRData(productId),
      createdAt: product?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    onSave(newProduct);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative">
              <input
                type="text"
                list="categories"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Select or type a category"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <datalist id="categories">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            {existingCategories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {existingCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      formData.category === cat
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Low Stock Alert
              </label>
              <input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-3xl sm:rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
            >
              {product ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function QRModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrElement = document.getElementById('product-qr');
      if (qrElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR - ${product.name}</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  font-family: system-ui, -apple-system, sans-serif;
                  margin: 0;
                  padding: 20px;
                }
                h1 { margin: 20px 0; text-align: center; }
                .qr-container { text-align: center; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                ${qrElement.innerHTML}
                <h1>${product.name}</h1>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="product-qr" className="bg-white p-6 rounded-2xl flex items-center justify-center">
          <QRCodeSVG value={product.qrCode} size={200} level="H" />
        </div>

        <div className="mt-6 text-center">
          <h3 className="font-bold text-gray-900 text-lg mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-6">Scan this code to deduct stock</p>

          <button
            onClick={handlePrint}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
          >
            Print QR Code
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
