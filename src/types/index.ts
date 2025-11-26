// Telegram WebApp type declarations
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        addToHomeScreen: () => void;
        checkHomeScreenStatus: (callback: (status: string) => void) => void;
        platform?: string;
      };
    };
  }
}

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  qrCode: string;
  category?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  profit: number;
  staffId?: string;
  staffName?: string;
  createdAt: number;
  paymentMethod?: 'cash' | 'card' | 'mobile' | 'other';
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'owner' | 'staff';
  telegramId?: number;
  createdAt: number;
  permissions: {
    canAddProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canViewReports: boolean;
    canManageStaff: boolean;
  };
}

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  createdAt: number;
  dismissed: boolean;
}

export interface AppSettings {
  businessName: string;
  currency: string;
  taxRate: number;
  receiptMessage?: string;
  notificationsEnabled: boolean;
  currentStaffId?: string;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface SalesReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}
