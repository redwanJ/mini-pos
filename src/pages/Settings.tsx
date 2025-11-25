import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Save,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { exportData, importData } from '../lib/db';
import { downloadFile } from '../utils/helpers';

export default function Settings() {
  const { settings, updateSettings, loadProducts, loadTransactions, loadStaff, loadAlerts } = useStore();
  const [formData, setFormData] = useState(settings);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      downloadFile(
        data,
        `inventory-backup-${Date.now()}.json`,
        'application/json'
      );
      setMessage({ type: 'success', text: 'Data exported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      await Promise.all([
        loadProducts(),
        loadTransactions(),
        loadStaff(),
        loadAlerts(),
      ]);
      setMessage({ type: 'success', text: 'Data imported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import data. Please check the file format.' });
    }
  };

  const handleClearData = async () => {
    if (
      confirm(
        'Are you sure you want to clear all data? This action cannot be undone. Please export your data first.'
      )
    ) {
      try {
        await importData(JSON.stringify({
          products: [],
          transactions: [],
          staff: [],
          alerts: [],
          settings: formData,
        }));
        await Promise.all([
          loadProducts(),
          loadTransactions(),
          loadStaff(),
          loadAlerts(),
        ]);
        setMessage({ type: 'success', text: 'All data cleared successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to clear data' });
      }
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold text-gray-900"
      >
        Settings
      </motion.h1>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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

      {/* Business Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Business Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Message
            </label>
            <textarea
              value={formData.receiptMessage || ''}
              onChange={(e) => setFormData({ ...formData, receiptMessage: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Thank you for your business!"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.notificationsEnabled}
                onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700 font-medium">
                Enable Low Stock Notifications
              </span>
            </label>
          </div>

          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </motion.div>

      {/* Backup & Restore */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">Backup & Restore</h2>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export All Data
          </button>

          <label className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-5 h-5" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Export your data regularly to prevent data loss.
              All data is stored locally on your device.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-red-50 border-2 border-red-200 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-red-900 mb-4">Danger Zone</h2>
        <p className="text-red-700 mb-4 text-sm">
          This will permanently delete all products, transactions, and staff data.
          This action cannot be undone!
        </p>
        <button
          onClick={handleClearData}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Clear All Data
        </button>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg text-center"
      >
        <h3 className="font-bold text-gray-900 mb-2">Smart Inventory + QR POS</h3>
        <p className="text-sm text-gray-600">Version 1.0.0</p>
        <p className="text-xs text-gray-500 mt-2">
          Built for small businesses with Telegram Mini App
        </p>
      </motion.div>
    </div>
  );
}
