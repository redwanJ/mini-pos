'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategoryId: string;
  newCategoryName: string;
  onSelectCategory: (categoryId: string) => void;
  onNewCategory: (name: string) => void;
}

export function CategoryDropdown({
  categories,
  selectedCategoryId,
  newCategoryName,
  onSelectCategory,
  onNewCategory,
}: CategoryDropdownProps) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const displayValue = newCategoryName || selectedCategory?.name || t('categoryPlaceholder');

  return (
    <div>
      <label className="label">{t('category')}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input flex items-center justify-between text-left"
        >
          <span
            className={
              selectedCategoryId || newCategoryName
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400'
            }
          >
            {displayValue}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onSelectCategory('');
                onNewCategory('');
                setIsOpen(false);
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
                  onSelectCategory(cat.id);
                  onNewCategory('');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {cat.name}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-600 p-2">
              <input
                type="text"
                placeholder={`${tCommon('add')} ${t('category').toLowerCase()}...`}
                value={newCategoryName}
                onChange={(e) => {
                  onNewCategory(e.target.value);
                  onSelectCategory('');
                }}
                className="input text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
