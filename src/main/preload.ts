// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is loading...');

const api = {
  // Products
  getProducts: () => ipcRenderer.invoke('get-products'),
  addProduct: (product: any) => ipcRenderer.invoke('add-product', product),
  updateProduct: (id: number, product: any) => ipcRenderer.invoke('update-product', id, product),
  deleteProduct: (id: number) => ipcRenderer.invoke('delete-product', id),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),

  // Sales
  createSale: (saleData: any) => ipcRenderer.invoke('create-sale', saleData),
  getSales: () => ipcRenderer.invoke('get-sales'),
  getSaleItems: (saleId: number) => ipcRenderer.invoke('get-sale-items', saleId),
  updateSaleStatus: (saleId: number, status: string) => ipcRenderer.invoke('update-sale-status', saleId, status),

  // Data
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: (data: any) => ipcRenderer.invoke('import-data', data),
  deleteAllData: () => ipcRenderer.invoke('delete-all-data'),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

  // Reports
  getReport: (period: 'today' | 'week' | 'month') => ipcRenderer.invoke('get-report', period),

  // Auth
  verifyPassword: (password: string) => ipcRenderer.invoke('verify-password', password),

  // Printing
  printInvoice: (htmlContent: string) => ipcRenderer.invoke('print-invoice', htmlContent),
  // In preload.ts — add this line next to printInvoice
  saveInvoicePdf: (html: string) => ipcRenderer.invoke('save-invoice-pdf', html),
};

// Expose the API
contextBridge.exposeInMainWorld('api', api);

console.log('Preload script loaded, API exposed with methods:', Object.keys(api));