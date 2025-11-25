import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getDateRange,
  calculateProfit,
  calculateRevenue,
  getTopProducts,
  downloadFile,
} from '../utils/helpers';
import type { ReportPeriod } from '../types';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { transactions, settings } = useStore();
  const [period, setPeriod] = useState<ReportPeriod>('daily');

  const reportData = useMemo(() => {
    const range = getDateRange(period);
    const filteredTransactions = transactions.filter(
      (t) => t.createdAt >= range.start && t.createdAt <= range.end
    );

    const revenue = calculateRevenue(filteredTransactions);
    const profit = calculateProfit(filteredTransactions);
    const topProducts = getTopProducts(filteredTransactions, 5);

    return {
      transactions: filteredTransactions,
      revenue,
      profit,
      topProducts,
      range,
    };
  }, [transactions, period]);

  const handleExportExcel = () => {
    const data = reportData.transactions.map((t) => ({
      Date: formatDate(t.createdAt),
      'Transaction ID': t.id,
      Items: t.items.map((i) => `${i.product.name} x${i.quantity}`).join(', '),
      Subtotal: t.subtotal,
      Discount: t.discount,
      Total: t.total,
      Profit: t.profit,
      Staff: t.staffName || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const summaryData = [
      { Metric: 'Total Revenue', Value: reportData.revenue },
      { Metric: 'Total Profit', Value: reportData.profit },
      { Metric: 'Total Transactions', Value: reportData.transactions.length },
    ];
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    XLSX.writeFile(workbook, `report-${period}-${Date.now()}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Items', 'Subtotal', 'Discount', 'Total', 'Profit', 'Staff'];
    const rows = reportData.transactions.map((t) => [
      formatDate(t.createdAt),
      t.id,
      t.items.map((i) => `${i.product.name} x${i.quantity}`).join('; '),
      t.subtotal,
      t.discount,
      t.total,
      t.profit,
      t.staffName || '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    downloadFile(csv, `report-${period}-${Date.now()}.csv`, 'text/csv');
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
          Sales Reports
        </motion.h1>
      </div>

      {/* Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-4 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Period</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`py-2 px-4 rounded-xl font-medium transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <BarChart3 className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Revenue</p>
          <p className="text-2xl font-bold">
            {formatCurrency(reportData.revenue, settings.currency)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Profit</p>
          <p className="text-2xl font-bold">
            {formatCurrency(reportData.profit, settings.currency)}
          </p>
        </motion.div>
      </div>

      {/* Transactions Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-bold text-gray-900 mb-2">Total Transactions</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {reportData.transactions.length}
        </p>
      </motion.div>

      {/* Top Products */}
      {reportData.topProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="font-bold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {reportData.topProducts.map((product, index) => (
              <motion.div
                key={product.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.productName}</p>
                  <p className="text-sm text-gray-600">
                    {product.quantitySold} units sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(product.revenue, settings.currency)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Export Buttons */}
      {reportData.transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="font-bold text-gray-900 mb-4">Export Report</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportExcel}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Excel
            </button>
            <button
              onClick={handleExportCSV}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              CSV
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {reportData.transactions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 text-center shadow-lg"
        >
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions</h3>
          <p className="text-gray-600">
            No sales data for the selected period
          </p>
        </motion.div>
      )}
    </div>
  );
}
