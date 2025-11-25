import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Product, Transaction, StaffMember, LowStockAlert, AppSettings } from '../types';

interface InventoryDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-name': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': number };
  };
  staff: {
    key: string;
    value: StaffMember;
  };
  alerts: {
    key: string;
    value: LowStockAlert;
    indexes: { 'by-dismissed': number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'inventory-pos-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<InventoryDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<InventoryDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<InventoryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('by-name', 'name');
      }

      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
        transactionStore.createIndex('by-date', 'createdAt');
      }

      // Staff store
      if (!db.objectStoreNames.contains('staff')) {
        db.createObjectStore('staff', { keyPath: 'id' });
      }

      // Alerts store
      if (!db.objectStoreNames.contains('alerts')) {
        const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
        alertStore.createIndex('by-dismissed', 'dismissed');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });

  // Initialize default settings if not exists
  const existingSettings = await dbInstance.get('settings', 'app-settings');
  if (!existingSettings) {
    await dbInstance.put('settings', {
      businessName: 'My Shop',
      currency: '$',
      taxRate: 0,
      notificationsEnabled: true,
    } as any);
  }

  return dbInstance;
}

export async function getDB(): Promise<IDBPDatabase<InventoryDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// Product operations
export async function addProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.add('products', product);
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.put('products', product);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('products', id);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const db = await getDB();
  return await db.get('products', id);
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  return await db.getAll('products');
}

// Transaction operations
export async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.add('transactions', transaction);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return await db.getAll('transactions');
}

export async function getTransactionsByDateRange(
  startDate: number,
  endDate: number
): Promise<Transaction[]> {
  const db = await getDB();
  const allTransactions = await db.getAll('transactions');
  return allTransactions.filter(
    (t) => t.createdAt >= startDate && t.createdAt <= endDate
  );
}

// Staff operations
export async function addStaff(staff: StaffMember): Promise<void> {
  const db = await getDB();
  await db.add('staff', staff);
}

export async function updateStaff(staff: StaffMember): Promise<void> {
  const db = await getDB();
  await db.put('staff', staff);
}

export async function deleteStaff(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('staff', id);
}

export async function getAllStaff(): Promise<StaffMember[]> {
  const db = await getDB();
  return await db.getAll('staff');
}

// Alert operations
export async function addAlert(alert: LowStockAlert): Promise<void> {
  const db = await getDB();
  await db.add('alerts', alert);
}

export async function dismissAlert(id: string): Promise<void> {
  const db = await getDB();
  const alert = await db.get('alerts', id);
  if (alert) {
    alert.dismissed = true;
    await db.put('alerts', alert);
  }
}

export async function getActiveAlerts(): Promise<LowStockAlert[]> {
  const db = await getDB();
  const allAlerts = await db.getAll('alerts');
  return allAlerts.filter((a) => !a.dismissed);
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'app-settings' as any);
  return settings || {
    businessName: 'My Shop',
    currency: '$',
    taxRate: 0,
    notificationsEnabled: true,
  };
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings as any);
}

// Backup and restore
export async function exportData(): Promise<string> {
  const db = await getDB();
  const data = {
    products: await db.getAll('products'),
    transactions: await db.getAll('transactions'),
    staff: await db.getAll('staff'),
    alerts: await db.getAll('alerts'),
    settings: await db.get('settings', 'app-settings' as any),
    exportDate: Date.now(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
  const db = await getDB();
  const data = JSON.parse(jsonData);

  // Clear existing data
  await db.clear('products');
  await db.clear('transactions');
  await db.clear('staff');
  await db.clear('alerts');

  // Import new data
  if (data.products) {
    for (const product of data.products) {
      await db.add('products', product);
    }
  }
  if (data.transactions) {
    for (const transaction of data.transactions) {
      await db.add('transactions', transaction);
    }
  }
  if (data.staff) {
    for (const staff of data.staff) {
      await db.add('staff', staff);
    }
  }
  if (data.alerts) {
    for (const alert of data.alerts) {
      await db.add('alerts', alert);
    }
  }
  if (data.settings) {
    await db.put('settings', data.settings);
  }
}
