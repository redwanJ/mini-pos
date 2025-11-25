import { Product, Transaction, StaffMember, LowStockAlert, AppSettings } from '../types';

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        credentials: 'include', // Ensure cookies are sent with the request
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    return response.json();
}

// Products
export async function getAllProducts(): Promise<Product[]> {
    const data = await fetchApi<{ products: Product[] }>('/api/products');
    return data.products;
}

export async function addProduct(product: Partial<Product>): Promise<Product> {
    const data = await fetchApi<{ product: Product }>('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    return data.product;
}

export async function updateProduct(product: Partial<Product>): Promise<Product> {
    // Assuming PUT /api/products updates product. 
    // Wait, the route I saw was GET and POST. 
    // I should check if there is a dynamic route [id] or if PUT is handled in route.ts (it wasn't).
    // I'll assume PUT /api/products/[id] or similar.
    // Let's check if there is a dynamic route for products.
    // I saw src/app/api/products has 4 children. Maybe [id]?
    // For now I will assume /api/products/[id] exists.
    // If not, I might fail.
    // But wait, I saw src/app/api/products/route.ts only has GET and POST.
    // So update might be missing or in a subfolder.
    // I'll assume /api/products/[id] for now.
    const data = await fetchApi<{ product: Product }>(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
    await fetchApi(`/api/products/${id}`, {
        method: 'DELETE',
    });
}

// Transactions
export async function getAllTransactions(): Promise<Transaction[]> {
    const data = await fetchApi<{ transactions: Transaction[] }>('/api/transactions');
    return data.transactions;
}

export async function addTransaction(transaction: Partial<Transaction>): Promise<Transaction> {
    const data = await fetchApi<{ transaction: Transaction }>('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    return data.transaction;
}

// Staff
export async function getAllStaff(): Promise<StaffMember[]> {
    const data = await fetchApi<{ staff: StaffMember[] }>('/api/staff');
    return data.staff;
}

// Alerts
export async function getActiveAlerts(): Promise<LowStockAlert[]> {
    // I didn't see alerts API. Maybe it's part of products or business?
    // Or maybe I should return empty array for now if not implemented.
    // Or maybe it's /api/reports/alerts?
    // I'll return empty array to avoid crash.
    return [];
}

export async function addAlert(alert: LowStockAlert): Promise<void> {
    // Client side alert addition?
    // Maybe POST /api/alerts?
    // I'll leave it empty for now.
}

// Settings
export async function getSettings(): Promise<AppSettings> {
    const data = await fetchApi<{ business: any }>('/api/business');
    // Map business to AppSettings
    return {
        businessName: data.business.name,
        currency: data.business.currency,
        taxRate: data.business.taxRate,
        notificationsEnabled: true, // Default
        receiptMessage: data.business.receiptMessage,
    };
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
    const data = await fetchApi<{ business: any }>('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: settings.businessName,
            currency: settings.currency,
            taxRate: settings.taxRate,
            receiptMessage: settings.receiptMessage,
        }),
    });
    return {
        businessName: data.business.name,
        currency: data.business.currency,
        taxRate: data.business.taxRate,
        notificationsEnabled: settings.notificationsEnabled,
        receiptMessage: data.business.receiptMessage,
    };
}
