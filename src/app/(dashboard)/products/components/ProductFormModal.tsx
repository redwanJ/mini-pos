'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { AlertMessage } from '@/components/ui/AlertMessage';
import { CategoryDropdown } from './CategoryDropdown';

interface Product {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  qrCode: string;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onSuccess: () => void;
  onCategoriesRefresh: () => void;
}

interface FormData {
  name: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  lowStockThreshold: string;
  categoryId: string;
  newCategory: string;
}

export function ProductFormModal({
  isOpen,
  onClose,
  product,
  categories,
  onSuccess,
  onCategoriesRefresh,
}: ProductFormModalProps) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    costPrice: '',
    salePrice: '',
    stock: '0',
    lowStockThreshold: '5',
    categoryId: '',
    newCategory: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
        lowStockThreshold: product.lowStockThreshold.toString(),
        categoryId: product.category?.id || '',
        newCategory: '',
      });
    } else {
      setFormData({
        name: '',
        costPrice: '',
        salePrice: '',
        stock: '0',
        lowStockThreshold: '5',
        categoryId: '',
        newCategory: '',
      });
    }
    setFormError(null);
  }, [product, isOpen]);

  async function handleSave() {
    if (!formData.name.trim()) {
      setFormError(t('name') + ' is required');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

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

      onSuccess();
      onCategoriesRefresh();
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <button
      onClick={handleSave}
      disabled={saving}
      className="w-full btn btn-primary py-3 text-base"
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? t('editProduct') : t('addProduct')}
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="label">{t('name')}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              className="input"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">{t('salePrice')}</label>
            <input
              type="number"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t('lowStockThreshold')}</label>
            <input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({ ...formData, lowStockThreshold: e.target.value })
              }
              className="input"
            />
          </div>
        </div>

        <CategoryDropdown
          categories={categories}
          selectedCategoryId={formData.categoryId}
          newCategoryName={formData.newCategory}
          onSelectCategory={(id) => setFormData({ ...formData, categoryId: id })}
          onNewCategory={(name) => setFormData({ ...formData, newCategory: name })}
        />

        {formError && <AlertMessage type="error" message={formError} />}
      </div>
    </Modal>
  );
}
