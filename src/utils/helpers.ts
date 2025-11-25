import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import type { Transaction, ReportPeriod } from '../types';

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}-${random}`;
}

export function generateQRData(productId: string): string {
  return `INVPOS:${productId}`;
}

export function parseQRData(qrData: string): string | null {
  if (qrData.startsWith('INVPOS:')) {
    return qrData.replace('INVPOS:', '');
  }
  return null;
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toFixed(2)}`;
}

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'MMM dd, yyyy');
}

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
}

export function getDateRange(period: ReportPeriod, date: Date = new Date()): { start: number; end: number } {
  switch (period) {
    case 'daily':
      return {
        start: startOfDay(date).getTime(),
        end: endOfDay(date).getTime(),
      };
    case 'weekly':
      return {
        start: startOfWeek(date).getTime(),
        end: endOfWeek(date).getTime(),
      };
    case 'monthly':
      return {
        start: startOfMonth(date).getTime(),
        end: endOfMonth(date).getTime(),
      };
  }
}

export function calculateProfit(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.profit, 0);
}

export function calculateRevenue(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.total, 0);
}

export function getTopProducts(
  transactions: Transaction[],
  limit: number = 10
): Array<{ productId: string; productName: string; quantitySold: number; revenue: number }> {
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  transactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      const existing = productMap.get(item.product.id);
      const itemRevenue = item.product.salePrice * item.quantity;

      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += itemRevenue;
      } else {
        productMap.set(item.product.id, {
          name: item.product.name,
          quantity: item.quantity,
          revenue: itemRevenue,
        });
      }
    });
  });

  return Array.from(productMap.entries())
    .map(([id, data]) => ({
      productId: id,
      productName: data.name,
      quantitySold: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
