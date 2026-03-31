import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Printer, RefreshCw, ChevronDown, Download, Receipt } from 'lucide-react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useNotifications } from '../components/NotificationProvider';

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
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadSales();
    loadSettings();
    const interval = setInterval(loadSales, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await window.api.getSales();
      setSales((res?.success && res.data) ? res.data as any : []);
    } catch (err) { 
       console.error(err); 
    } finally { 
       setLoading(false); 
    }
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
        addNotification("Status Updated", `Sale #${saleId} is now ${newStatus}.`, "success");
        loadSales();
      } else {
        addNotification("Update Failed", res.error || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      addNotification("Error", "Critical error updating status", "error");
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
      <p class="center" style="font-weight:bold;font-size:12px;">Receipt #${sale.id}</p>
      <p class="center" style="font-size:10px;margin-top:2px;color:#555;">${dayjs(sale.date_created.replace(' ', 'T') + 'Z').format('DD MMM YYYY hh:mm A')}</p>
      <div class="divider"></div>
      ${itemsHtml}
      <div class="divider"></div>
      <div class="total-row" style="font-weight:normal;font-size:11px"><span>Subtotal</span><span>${fmtPKR(sale.subtotal || sale.total)}</span></div>
      ${(sale.discount || 0) > 0 ? `<div class="total-row" style="font-weight:normal;font-size:11px;color:red"><span>Discount</span><span>-${fmtPKR(sale.discount)}</span></div>` : ''}
      <div class="total-row"><span>Total</span><span>${fmtPKR(sale.total)}</span></div>
      <div class="total-row" style="font-weight:normal;font-size:10px;margin-top:2px">
        <span>Payment</span><span>${(sale.payment_method === 'online' ? 'ONLINE PAYMENT' : (sale.payment_method || 'cash').toUpperCase())}</span>
      </div>
      <div class="divider"></div>
      <div style="text-align: center; margin-top: 6px;">
        <div style="font-size: 11px; font-weight: bold;">${settings.receipt_footer}</div>
        <div style="font-size: 9px; margin-top: 6px; color: #555;">Software made by +923298748232</div>
      </div>
    `;
    await window.api.printInvoice(html);
    addNotification("Printed", "Receipt queued to printer.", "success");
  };

  const saveReceiptPdf = async (sale: Sale) => {
    const res = await window.api.getSaleItems(sale.id);
    const items = res?.success && res.data ? res.data : [];
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
      <p class="center" style="font-weight:bold;font-size:12px;">Receipt #${sale.id}</p>
      <p class="center" style="font-size:10px;margin-top:2px;color:#555;">${dayjs(sale.date_created.replace(' ', 'T') + 'Z').format('DD MMM YYYY hh:mm A')}</p>
      <div class="divider"></div>
      ${itemsHtml}
      <div class="divider"></div>
      <div class="total-row" style="font-weight:normal;font-size:11px"><span>Subtotal</span><span>${fmtPKR(sale.subtotal || sale.total)}</span></div>
      ${(sale.discount || 0) > 0 ? `<div class="total-row" style="font-weight:normal;font-size:11px;color:red"><span>Discount</span><span>-${fmtPKR(sale.discount)}</span></div>` : ''}
      <div class="total-row"><span>Total</span><span>${fmtPKR(sale.total)}</span></div>
      <div class="total-row" style="font-weight:normal;font-size:10px;margin-top:2px">
        <span>Payment</span><span>${sale.payment_method === 'online' ? 'ONLINE PAYMENT' : (sale.payment_method || 'cash').toUpperCase()}</span>
      </div>
      <div class="divider"></div>
      <div style="text-align: center; margin-top: 6px;">
        <div style="font-size: 11px; font-weight: bold;">${settings.receipt_footer}</div>
        <div style="font-size: 9px; margin-top: 6px; color: #555;">Software made by +923298748232</div>
      </div>
    `;
    await window.api.saveInvoicePdf(html);
    addNotification("PDF Saved", "Receipt PDF created successfully.", "success");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1400px]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete history of all point of sale transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 border-primary/20 bg-primary/5 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Filtered Value</p>
            <p className="text-xl font-bold text-primary tabular-nums tracking-tight">{fmtPKR(totalAmount)}</p>
          </Card>
          <Button variant="outline" size="icon" onClick={() => { addNotification("Refreshing", "Fetching latest sales", "info"); loadSales(); }} className="h-12 w-12 rounded-xl border-border bg-card">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <Input
              type="text"
              placeholder="Search by ID, payment method, or item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full md:max-w-md bg-background"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-24">Sale #</TableHead>
                <TableHead className="w-32">Date & Time</TableHead>
                <TableHead className="max-w-[200px]">Items</TableHead>
                <TableHead className="w-24">Method</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right font-bold text-foreground">Total</TableHead>
                <TableHead className="text-right pr-6 w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                       <RefreshCw size={24} className="animate-spin text-primary opacity-50" />
                       <p>Loading transactions...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                       <Receipt size={40} className="opacity-20" />
                       <p>No transactions found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSales.map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell className="font-bold">#{s.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{dayjs(s.date_created.replace(' ', 'T') + 'Z').format('DD MMM YYYY')}</span>
                      <span className="text-xs text-muted-foreground">{dayjs(s.date_created.replace(' ', 'T') + 'Z').format('hh:mm A')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px]">
                    <p className="truncate text-xs leading-relaxed" title={s.items_summary}>{s.items_summary || '—'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.payment_method === 'online' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                      {s.payment_method === 'online' ? 'Online' : s.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="relative inline-block text-left w-full">
                      <select
                        value={s.status || 'Completed'}
                        onChange={(e) => handleStatusUpdate(s.id, e.target.value)}
                        className={cn(
                          "appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer text-xs font-bold w-full truncate",
                          s.status === 'Returned' ? 'text-orange-500' :
                          s.status === 'Cancelled' ? 'text-destructive' : 'text-green-500 hover:text-green-600'
                        )}
                      >
                        <option value="Completed">Completed</option>
                        <option value="Returned">Returned</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{fmtPKR(s.subtotal || s.total)}</TableCell>
                  <TableCell className="text-right text-destructive text-xs">{s.discount > 0 ? `-${fmtPKR(s.discount)}` : '—'}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{fmtPKR(s.total)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => reprintReceipt(s)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Reprint Receipt">
                        <Printer size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => saveReceiptPdf(s)} className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" title="Download PDF">
                        <Download size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
