import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Printer, RefreshCw, ChevronDown, Download } from 'lucide-react';
import dayjs from 'dayjs';

interface Sale {
  id: number;
  subtotal: number;
  discount: number;
  total: number;
  date_created: string;
  payment_method: string;
  items_summary: string;
  status: 'Completed' | 'Returned' | 'Cancelled';
}

interface Settings {
  store_name: string;
  store_phone: string;
  store_address: string;
  receipt_footer: string;
  store_logo: string;
}

const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

export default function Transactions() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({ store_name: 'Restaurant', store_phone: '', store_address: '', receipt_footer: 'Thank you!', store_logo: '' });

  useEffect(() => {
    loadSales();
    loadSettings();
    // Refresh every 10s so new sales appear quickly
    const interval = setInterval(loadSales, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await window.api.getSales();
      setSales((res?.success && res.data) ? res.data as any : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadSettings = async () => {
    try {
      const res = await window.api.getSettings();
      if (res?.success && res.data) setSettings(res.data);
    } catch { }
  };

  const handleStatusUpdate = async (saleId: number, newStatus: string) => {
    try {
      const res = await window.api.updateSaleStatus(saleId, newStatus);
      if (res.success) {
        loadSales();
      } else {
        alert('Failed to update status: ' + res.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      String(s.id).includes(searchTerm) ||
      (s.payment_method || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.items_summary || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredSales.reduce((sum, s) => sum + s.total, 0);

  const reprintReceipt = async (sale: Sale) => {
    const res = await window.api.getSaleItems(sale.id);
    const items = (res?.success && res.data) ? res.data : [];
    const itemsHtml = items.map((item: any) => `
      <div class="item">
        <span>${item.product_name} x${item.quantity}</span>
        <span>${fmtPKR(item.price * item.quantity)}</span>
      </div>
    `).join('');

    const html = `
      ${settings.store_logo ? `<img src="${settings.store_logo}" style="max-height:48px;display:block;margin:0 auto 6px"/>` : ''}
      <h2>${settings.store_name}</h2>
      ${settings.store_address ? `<p class="center">${settings.store_address}</p>` : ''}
      ${settings.store_phone ? `<p class="center">Tel: ${settings.store_phone}</p>` : ''}
      <div class="divider"></div>
      <div class="divider"></div>
      <p class="center">Receipt #${sale.id}</p>
      <p class="center" style="font-size:10px">${dayjs(sale.date_created).format('DD MMM YYYY hh:mm A')}</p>
      <div class="divider"></div>
      ${itemsHtml}
      <div class="divider"></div>
      <div class="total-row" style="font-weight:normal;font-size:11px"><span>Subtotal</span><span>${fmtPKR(sale.subtotal || sale.total)}</span></div>
      ${(sale.discount || 0) > 0 ? `<div class="total-row" style="font-weight:normal;font-size:11px;color:red"><span>Discount</span><span>-${fmtPKR(sale.discount)}</span></div>` : ''}
      <div class="total-row"><span>Total</span><span>${fmtPKR(sale.total)}</span></div>
      <div class="total-row" style="font-weight:normal;font-size:10px;margin-top:2px">
        <span>Payment</span><span>${(sale.payment_method === 'online' ? 'ONLINE PAYMENT' : (sale.payment_method || 'cash').toUpperCase())}</span>
      </div>
      <div class="footer">${settings.receipt_footer}</div>
    `;
    await window.api.printInvoice(html);
  };

  const saveReceiptPdf = async (sale: Sale) => {
    const res = await window.api.getSaleItems(sale.id);
    const items = res?.success && res.data ? res.data : [];
    const itemsHtml = items
      .map(
        (item: any) => `
      <div class="item">
        <span>${item.product_name} x${item.quantity}</span>
        <span>${fmtPKR(item.price * item.quantity)}</span>
      </div>
    `
      )
      .join('');

    const html = `
      ${settings.store_logo ? `<img src="${settings.store_logo}" style="max-height:48px;display:block;margin:0 auto 6px"/>` : ''}
      <h2>${settings.store_name}</h2>
      ${settings.store_address ? `<p class="center">${settings.store_address}</p>` : ''}
      ${settings.store_phone ? `<p class="center">Tel: ${settings.store_phone}</p>` : ''}
      <div class="divider"></div>
      <p class="center">Receipt #${sale.id}</p>
      <p class="center" style="font-size:10px">${dayjs(sale.date_created).format('DD MMM YYYY hh:mm A')}</p>
      <div class="divider"></div>
      ${itemsHtml}
      <div class="divider"></div>
      <div class="total-row" style="font-weight:normal;font-size:11px"><span>Subtotal</span><span>${fmtPKR(sale.subtotal || sale.total)}</span></div>
      ${(sale.discount || 0) > 0 ? `<div class="total-row" style="font-weight:normal;font-size:11px;color:red"><span>Discount</span><span>-${fmtPKR(sale.discount)}</span></div>` : ''}
      <div class="total-row"><span>Total</span><span>${fmtPKR(sale.total)}</span></div>
      <div class="total-row" style="font-weight:normal;font-size:10px;margin-top:2px">
        <span>Payment</span><span>${sale.payment_method === 'online' ? 'ONLINE PAYMENT' : (sale.payment_method || 'cash').toUpperCase()}</span>
      </div>
      <div class="footer">${settings.receipt_footer}</div>
    `;
    await window.api.saveInvoicePdf(html);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-500 text-sm">Complete history of all sales</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-gray-400">Showing total</p>
            <p className="text-lg font-bold text-blue-600">{fmtPKR(totalAmount)}</p>
          </div>
          <button onClick={loadSales} className="p-2 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg bg-white transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by ID, payment method, or items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Sale #</th>
              <th className="px-6 py-4 text-left">Date & Time</th>
              <th className="px-6 py-4 text-left">Items</th>
              <th className="px-6 py-4 text-left">Payment</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Subtotal</th>
              <th className="px-6 py-4 text-right">Discount</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && sales.length === 0 ? (
              <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                <RefreshCw size={24} className="mx-auto mb-2 animate-spin opacity-40" />Loading...
              </td></tr>
            ) : filteredSales.length === 0 ? (
              <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                <CreditCard size={40} className="mx-auto mb-3 opacity-20" />
                No transactions yet. Make a sale to see it here.
              </td></tr>
            ) : filteredSales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">#{s.id}</td>
                <td className="px-6 py-4">
                  <p className="text-gray-700">{dayjs(s.date_created).format('DD MMM YYYY')}</p>
                  <p className="text-xs text-gray-400">{dayjs(s.date_created).format('hh:mm A')}</p>
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-xs">
                  <p className="truncate text-xs">{s.items_summary || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${s.payment_method === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {s.payment_method === 'online' ? 'Online' : s.payment_method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="relative inline-block text-left group">
                    <select
                      value={s.status || 'Completed'}
                      onChange={(e) => handleStatusUpdate(s.id, e.target.value)}
                      className={`appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer text-xs font-bold ${s.status === 'Returned' ? 'text-orange-600' :
                          s.status === 'Cancelled' ? 'text-red-600' : 'text-green-600'
                        }`}
                    >
                      <option value="Completed">Completed</option>
                      <option value="Returned">Returned</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-gray-500">{fmtPKR(s.subtotal || s.total)}</td>
                <td className="px-6 py-4 text-right text-red-500">{s.discount > 0 ? `-${fmtPKR(s.discount)}` : '—'}</td>
                <td className="px-6 py-4 text-right font-bold text-gray-800">{fmtPKR(s.total)}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => reprintReceipt(s)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => saveReceiptPdf(s)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Save PDF">
                      {/* download icon */}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
