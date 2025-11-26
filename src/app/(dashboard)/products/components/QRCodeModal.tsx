'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CenterModal } from '@/components/ui/Modal';
import { formatCurrency, generateQRData } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  qrCode: string;
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currency: string;
}

export function QRCodeModal({ isOpen, onClose, product, currency }: QRCodeModalProps) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const qrRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  function downloadQRCode() {
    if (!product || !qrRef.current) return;

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
        ctx.fillText(product.name, canvas.width / 2, 250);
        ctx.font = '12px monospace';
        ctx.fillText(product.qrCode, canvas.width / 2, 275);
        ctx.font = '14px sans-serif';
        ctx.fillText(formatCurrency(product.salePrice, currency), canvas.width / 2, 300);
      }

      const link = document.createElement('a');
      link.download = `${product.name.replace(/[^a-z0-9]/gi, '_')}_qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <CenterModal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          {product.name}
        </h3>
        <div ref={qrRef} className="bg-white p-4 rounded-lg inline-block">
          <QRCodeSVG value={generateQRData(product.id)} size={200} level="H" />
        </div>
        <p className="text-xs text-gray-500 mt-4 font-mono">{product.qrCode}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {formatCurrency(product.salePrice, currency)}
        </p>
        <div className="flex gap-2 mt-4">
          <button onClick={downloadQRCode} className="flex-1 btn btn-primary">
            <Download className="w-4 h-4 mr-2" />
            {t('printQR')}
          </button>
          <button onClick={onClose} className="flex-1 btn btn-secondary">
            {tCommon('cancel')}
          </button>
        </div>
      </div>
    </CenterModal>
  );
}
