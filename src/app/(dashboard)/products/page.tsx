'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBusiness } from '@/hooks/useBusiness';
import { useCategories } from '@/hooks/useCategories';
import { ProductList, ProductFormModal, QRCodeModal } from './components';

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

export default function ProductsPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  const { currency } = useBusiness();
  const { categories, refetch: refetchCategories } = useCategories();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showQR, setShowQR] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(search)}`
      );
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

  function openAddModal() {
    setEditingProduct(null);
    setShowFormModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setShowFormModal(true);
  }

  async function handleDelete(product: Product) {
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
  }

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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tCommon('search')}
            className="input pl-12"
          />
        </div>

        <ProductList
          products={products}
          loading={loading}
          currency={currency}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onShowQR={setShowQR}
        />
      </div>

      <ProductFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        product={editingProduct}
        categories={categories}
        onSuccess={fetchProducts}
        onCategoriesRefresh={refetchCategories}
      />

      <QRCodeModal
        isOpen={!!showQR}
        onClose={() => setShowQR(null)}
        product={showQR}
        currency={currency}
      />
    </div>
  );
}
