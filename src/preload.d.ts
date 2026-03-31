export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
}

export interface Settings {
  id: number;
  store_name: string;
  store_phone: string;
  store_address: string;
  store_logo: string;
  receipt_footer: string;
  pos_password?: string;
  updated_at: string;
}

export interface SaleItem {
  product_id?: number;
  product_name: string;
  quantity: number;
  price: number;
  is_custom?: boolean;
}

export interface SaleData {
  customer_id?: number;
  items: SaleItem[];
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  payment_method: string;
  notes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface POSApi {
  // Products
  getProducts: () => Promise<ApiResponse<Product[]>>;
  addProduct: (product: Product) => Promise<ApiResponse<Product>>;
  updateProduct: (id: number, product: Product) => Promise<ApiResponse<Product>>;
  deleteProduct: (id: number) => Promise<ApiResponse<void>>;

  // Settings
  getSettings: () => Promise<ApiResponse<Settings>>;
  updateSettings: (settings: Partial<Settings>) => Promise<ApiResponse<Settings>>;

  // Sales
  createSale: (saleData: SaleData) => Promise<ApiResponse<{ saleId: number }>>;
  getSales: () => Promise<ApiResponse<any[]>>;
  getSaleItems: (saleId: number) => Promise<ApiResponse<any[]>>;
  updateSaleStatus: (saleId: number, status: string) => Promise<ApiResponse<void>>;

  // Data Management
  exportData: () => Promise<ApiResponse<any>>;
  importData: (data: any) => Promise<ApiResponse<void>>;
  deleteAllData: () => Promise<ApiResponse<void>>;

  // Dashboard
  getDashboardStats: () => Promise<ApiResponse<any>>;

  // Reports
  getReport: (period: 'today' | 'week' | 'month') => Promise<ApiResponse<any>>;

  // Auth
  verifyPassword: (password: string) => Promise<boolean | ApiResponse<{ isValid: boolean }>>;

  // Printing
  printInvoice: (htmlContent: string) => Promise<ApiResponse<void>>;
  saveInvoicePdf: (htmlContent: string) => Promise<ApiResponse<{ success: boolean; filePath?: string }>>;
  
  // Assets
  getLogo: () => Promise<ApiResponse<string>>;
}

declare global {
  interface Window {
    api: POSApi;
  }
}
