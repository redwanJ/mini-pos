'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Package,
  Loader2,
  AlertCircle,
  QrCode,
  Edit2,
  Trash2,
  X,
  Download,
  ChevronDown,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, generateQRData } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  qrCode: string;
  imageUrl?: string;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showQR, setShowQR] = useState<Product | null>(null);
  const [currency, setCurrency] = useState('ETB');
  const qrRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    salePrice: '',
    stock: '0',
    lowStockThreshold: '5',
    categoryId: '',
    newCategory: '',
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Fetch business currency and categories
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
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch {
        // Ignore
      }
    }
    fetchBusiness();
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      costPrice: '',
      salePrice: '',
      stock: '0',
      lowStockThreshold: '5',
      categoryId: '',
      newCategory: '',
    });
    setShowCategoryDropdown(false);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
      stock: product.stock.toString(),
      lowStockThreshold: product.lowStockThreshold.toString(),
      categoryId: product.category?.id || '',
      newCategory: '',
    });
    setShowCategoryDropdown(false);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError(t('name') + ' is required');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          costPrice: parseFloat(formData.costPrice) || 0,
          salePrice: parseFloat(formData.salePrice) || 0,
          stock: parseInt(formData.stock) || 0,
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
          categoryId: formData.categoryId || null,
          newCategory: formData.newCategory.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save product');
      }

      setShowModal(false);
      fetchProducts();
      // Refresh categories in case a new one was created
      const catResponse = await fetch('/api/categories');
      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCategories(catData.categories || []);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const downloadQRCode = () => {
    if (!showQR || !qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 350;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 20, 200, 200);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(showQR.name, canvas.width / 2, 250);
        ctx.font = '12px monospace';
        ctx.fillText(showQR.qrCode, canvas.width / 2, 275);
        ctx.font = '14px sans-serif';
        ctx.fillText(formatCurrency(showQR.salePrice, currency), canvas.width / 2, 300);
      }

      const link = document.createElement('a');
      link.download = `${showQR.name.replace(/[^a-z0-9]/gi, '_')}_qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: t('outOfStock'), color: 'red' };
    if (product.stock <= product.lowStockThreshold)
      return { label: t('lowStock'), color: 'yellow' };
    return { label: t('inStock'), color: 'green' };
  };

  return (
    <div>
      <PageHeader
        title={t('title')}
        action={
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-1" />
            {t('addProduct')}
          </button>
        }
      />

      <div className="p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tCommon('search')}
            className="input pl-11"
          />
        </div>

        {/* Products List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('noProducts')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('addFirstProduct')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatCurrency(product.salePrice, currency)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            stockStatus.color === 'green'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : stockStatus.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {stockStatus.label}: {product.stock}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowQR(product)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingProduct ? t('editProduct') : t('addProduct')}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
                <div>
                  <label className="label">{t('name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t('namePlaceholder')}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('costPrice')}</label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, costPrice: e.target.value })
                      }
                      className="input"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="label">{t('salePrice')}</label>
                    <input
                      type="number"
                      value={formData.salePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, salePrice: e.target.value })
                      }
                      className="input"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('stock')}</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('lowStockThreshold')}</label>
                    <input
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowStockThreshold: e.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>
                </div>

                {/* Category dropdown */}
                <div>
                  <label className="label">{t('category')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="input flex items-center justify-between text-left"
                    >
                      <span className={formData.categoryId || formData.newCategory ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                        {formData.newCategory
                          ? formData.newCategory
                          : formData.categoryId
                            ? categories.find(c => c.id === formData.categoryId)?.name
                            : t('categoryPlaceholder')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {showCategoryDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, categoryId: '', newCategory: '' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          {t('categoryPlaceholder')}
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, categoryId: cat.id, newCategory: '' });
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            {cat.name}
                          </button>
                        ))}
                        <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                          <input
                            type="text"
                            placeholder={tCommon('add') + ' ' + t('category').toLowerCase() + '...'}
                            value={formData.newCategory}
                            onChange={(e) => setFormData({ ...formData, newCategory: e.target.value, categoryId: '' })}
                            className="input text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {formError}
                  </div>
                )}
              </div>

              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 safe-bottom">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full btn btn-primary py-3"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {tCommon('loading')}
                    </>
                  ) : (
                    tCommon('save')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowQR(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center max-w-xs mx-4"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {showQR.name}
              </h3>
              <div ref={qrRef} className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG
                  value={generateQRData(showQR.id)}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-500 mt-4 font-mono">{showQR.qrCode}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatCurrency(showQR.salePrice, currency)}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 btn btn-primary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('printQR')}
                </button>
                <button
                  onClick={() => setShowQR(null)}
                  className="flex-1 btn btn-secondary"
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
