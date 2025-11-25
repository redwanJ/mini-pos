import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { initDB, addStaff } from './lib/db';
import { useStore } from './store/useStore';
import { generateId } from './utils/helpers';
import type { StaffMember } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Scanner from './pages/Scanner';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Staff from './pages/Staff';

function App() {
  const { loadProducts, loadTransactions, loadStaff, loadAlerts, loadSettings, setCurrentStaff } = useStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Telegram WebApp
        WebApp.ready();
        WebApp.expand();

        // Set theme colors for Telegram
        WebApp.setHeaderColor('#ffffff');
        WebApp.setBackgroundColor('#f8f5ff');

        await initDB();
        await Promise.all([
          loadProducts(),
          loadTransactions(),
          loadStaff(),
          loadAlerts(),
          loadSettings(),
        ]);

        // Auto-login with Telegram user
        if (WebApp.initDataUnsafe?.user) {
          const telegramUser = WebApp.initDataUnsafe.user;
          await autoLoginTelegramUser(telegramUser);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    const autoLoginTelegramUser = async (telegramUser: any) => {
      try {
        // Wait for staff to be loaded
        const currentStaff = useStore.getState().staff;

        // Check if staff member with this Telegram ID exists
        let existingStaff = currentStaff.find(
          (s) => s.telegramId === telegramUser.id
        );

        if (!existingStaff) {
          // Create new staff member from Telegram user
          const newStaff: StaffMember = {
            id: generateId('staff-'),
            name: `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`,
            role: currentStaff.length === 0 ? 'owner' : 'staff', // First user is owner
            telegramId: telegramUser.id,
            createdAt: Date.now(),
            permissions: {
              canAddProducts: true,
              canEditProducts: true,
              canDeleteProducts: currentStaff.length === 0, // Only owner can delete
              canViewReports: true,
              canManageStaff: currentStaff.length === 0, // Only owner can manage staff
            },
          };

          await addStaff(newStaff);
          await loadStaff();
          existingStaff = newStaff;
        }

        // Set as current staff
        setCurrentStaff(existingStaff);
      } catch (error) {
        console.error('Failed to auto-login Telegram user:', error);
      }
    };

    initialize();
  }, [loadProducts, loadTransactions, loadStaff, loadAlerts, loadSettings, setCurrentStaff]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="pos" element={<POS />} />
          <Route path="reports" element={<Reports />} />
          <Route path="staff" element={<Staff />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
