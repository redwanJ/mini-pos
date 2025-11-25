import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { TrendingUp, Package, ShoppingBag, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, getDateRange, calculateProfit, calculateRevenue } from '../utils/helpers';
import { useMemo } from 'react';

const StatCard = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </motion.div>
);

export default function Dashboard() {
  const products = useStore((state) => state.products);
  const transactions = useStore((state) => state.transactions);
  const settings = useStore((state) => state.settings);

  const stats = useMemo(() => {
    const today = getDateRange('daily');
    const todayTransactions = transactions.filter(
      (t) => t.createdAt >= today.start && t.createdAt <= today.end
    );

    const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);
    const totalRevenue = calculateRevenue(todayTransactions);
    const totalProfit = calculateProfit(todayTransactions);

    return {
      totalProducts: products.length,
      lowStock: lowStockProducts.length,
      todaySales: todayTransactions.length,
      todayRevenue: totalRevenue,
      todayProfit: totalProfit,
    };
  }, [products, transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6 pb-32">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="opacity-90">{settings.businessName}</p>
        <p className="text-sm opacity-75 mt-2">{formatDate(Date.now())}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.totalProducts}
          color="from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatCard
          icon={ShoppingBag}
          label="Today's Sales"
          value={stats.todaySales}
          color="from-green-500 to-green-600"
          delay={0.2}
        />
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={formatCurrency(stats.todayRevenue, settings.currency)}
          color="from-purple-500 to-purple-600"
          delay={0.3}
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Profit"
          value={formatCurrency(stats.todayProfit, settings.currency)}
          color="from-pink-500 to-pink-600"
          delay={0.4}
        />
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h3 className="font-bold text-orange-900">Low Stock Alert</h3>
          </div>
          <p className="text-orange-700">
            {stats.lowStock} product{stats.lowStock > 1 ? 's are' : ' is'} running low on stock.
            Check your inventory!
          </p>
        </motion.div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold mb-4 text-gray-900">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.items.length} item{transaction.items.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(transaction.total, settings.currency)}
                  </p>
                  <p className="text-sm text-green-600">
                    +{formatCurrency(transaction.profit, settings.currency)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 text-center shadow-lg"
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first product to the inventory</p>
          <a
            href="/products"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
          >
            Add Product
          </a>
        </motion.div>
      )}
    </div>
  );
}
