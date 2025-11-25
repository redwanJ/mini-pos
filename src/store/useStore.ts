import { create } from 'zustand';
import type { Product, CartItem, Transaction, StaffMember, LowStockAlert, AppSettings } from '../types';
import {
  getAllProducts,
  addProduct as dbAddProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  getAllTransactions,
  addTransaction as dbAddTransaction,
  getAllStaff,
  getActiveAlerts,
  getSettings,
  updateSettings as dbUpdateSettings,
  addAlert,
} from '../lib/db';

interface AppState {
  // Products
  products: Product[];
  loadProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Transactions
  transactions: Transaction[];
  loadTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;

  // Staff
  staff: StaffMember[];
  loadStaff: () => Promise<void>;
  currentStaff?: StaffMember;
  setCurrentStaff: (staff: StaffMember) => void;

  // Alerts
  alerts: LowStockAlert[];
  loadAlerts: () => Promise<void>;
  checkLowStock: (product: Product) => Promise<void>;

  // Settings
  settings: AppSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Products
  products: [],
  loadProducts: async () => {
    const products = await getAllProducts();
    set({ products });
  },
  addProduct: async (product) => {
    await dbAddProduct(product);
    await get().loadProducts();
    await get().checkLowStock(product);
  },
  updateProduct: async (product) => {
    await dbUpdateProduct(product);
    await get().loadProducts();
    await get().checkLowStock(product);
  },
  deleteProduct: async (id) => {
    await dbDeleteProduct(id);
    await get().loadProducts();
  },

  // Cart
  cart: [],
  addToCart: (product, quantity) => {
    const cart = get().cart;
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({ cart: [...cart, { product, quantity }] });
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.product.id !== productId) });
  },
  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
    } else {
      set({
        cart: get().cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      });
    }
  },
  clearCart: () => {
    set({ cart: [] });
  },

  // Transactions
  transactions: [],
  loadTransactions: async () => {
    const transactions = await getAllTransactions();
    set({ transactions });
  },
  addTransaction: async (transaction) => {
    await dbAddTransaction(transaction);
    await get().loadTransactions();

    // Update product stock
    for (const item of transaction.items) {
      const product = get().products.find((p) => p.id === item.product.id);
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock - item.quantity,
          updatedAt: Date.now(),
        };
        await get().updateProduct(updatedProduct);
      }
    }
  },

  // Staff
  staff: [],
  loadStaff: async () => {
    const staff = await getAllStaff();
    set({ staff });
  },
  currentStaff: undefined,
  setCurrentStaff: (staff) => {
    set({ currentStaff: staff });
  },

  // Alerts
  alerts: [],
  loadAlerts: async () => {
    const alerts = await getActiveAlerts();
    set({ alerts });
  },
  checkLowStock: async (product) => {
    if (product.stock <= product.lowStockThreshold) {
      const existingAlert = get().alerts.find(
        (a) => a.productId === product.id && !a.dismissed
      );
      if (!existingAlert) {
        const alert: LowStockAlert = {
          id: `alert-${Date.now()}-${Math.random()}`,
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          threshold: product.lowStockThreshold,
          createdAt: Date.now(),
          dismissed: false,
        };
        await addAlert(alert);
        await get().loadAlerts();
      }
    }
  },

  // Settings
  settings: {
    businessName: 'My Shop',
    currency: '$',
    taxRate: 0,
    notificationsEnabled: true,
  },
  loadSettings: async () => {
    const settings = await getSettings();
    set({ settings });
  },
  updateSettings: async (settings) => {
    await dbUpdateSettings(settings);
    set({ settings });
  },
}));
