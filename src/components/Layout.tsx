import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  QrCode,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Bell,
} from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/scanner', icon: QrCode, label: 'Scanner' },
  { path: '/pos', icon: ShoppingCart, label: 'POS' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/staff', icon: Users, label: 'Staff' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const alerts = useStore((state) => state.alerts);
  const currentStaff = useStore((state) => state.currentStaff);
  const activeAlertsCount = alerts.filter((a) => !a.dismissed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 py-4 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Smart POS
                </h1>
                <p className="text-xs text-gray-500">
                  {currentStaff ? `${currentStaff.name} (${currentStaff.role})` : 'Inventory Management'}
                </p>
              </div>
            </motion.div>

            {activeAlertsCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <Bell className="w-6 h-6 text-orange-500" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeAlertsCount}
                </span>
              </motion.div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 pb-24">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-2 py-2">
            <div className="grid grid-cols-4 gap-1">
              {navItems.slice(0, 4).map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${isActive
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {navItems.slice(4).map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${isActive
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
