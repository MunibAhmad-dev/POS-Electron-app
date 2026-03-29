import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Minus, Search, ShoppingCart as CartIcon, X,
  CreditCard, Printer, RefreshCw, PenLine, CheckCircle
} from 'lucide-react';

interface CartItem {
  id: string;
  product_id: number | null;
  name: string;
  price: number;
  quantity: number;
  is_custom: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface Settings {
  store_name: string; store_phone: string; store_address: string;
  receipt_footer: string; store_logo: string;
}

interface ReceiptData {
  saleId: number | bigint;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  settings: Settings;
  date: string;
}

const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');
// ── In-App Receipt Preview Modal ─────────────────────────────────────
function ReceiptModal({ data, onPrint, onSavePdf, onClose }: {
  data: ReceiptData;
  onPrint: () => void;
  onSavePdf: () => void;
  onClose: () => void;
}) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    await onPrint();
    setIsPrinting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
            <h2 className="text-lg font-bold text-gray-800">Sale Complete!</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 font-mono text-xs text-gray-800">
            {/* Store Header */}
            {data.settings.store_logo && (
              <img src={data.settings.store_logo} alt="Logo" className="h-10 mx-auto mb-2 object-contain" />
            )}
            <p className="text-center font-bold text-sm mb-0.5">{data.settings.store_name}</p>
            {data.settings.store_address && (
              <p className="text-center text-gray-500 leading-tight">{data.settings.store_address}</p>
            )}
            {data.settings.store_phone && (
              <p className="text-center text-gray-500">Tel: {data.settings.store_phone}</p>
            )}

            <div className="border-b border-dashed border-gray-300 my-3" />

            {/* Receipt Meta */}
            <p className="text-center text-gray-500">Receipt #{String(data.saleId)}</p>
            <p className="text-center text-gray-400 text-[10px]">{data.date}</p>

            <div className="border-b border-dashed border-gray-300 my-3" />

            {/* Items */}
            <div className="space-y-1.5">
              {data.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="flex-1 mr-2 truncate">
                    {item.name}
                    {item.is_custom && <span className="text-purple-500 ml-1">(custom)</span>}
                    {' '}x{item.quantity}
                  </span>
                  <span className="font-semibold flex-shrink-0">{fmtPKR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-gray-300 my-3" />

            {/* Total */}
            <div className="flex justify-between text-gray-500 text-[10px] mt-1">
              <span>Subtotal</span>
              <span>{fmtPKR(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-red-500 text-[10px] mt-0.5">
                <span>Discount</span>
                <span>-{fmtPKR(data.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm mt-1">
              <span>Total</span>
              <span>{fmtPKR(data.total)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-[10px] mt-1">
              <span>Payment</span>
              <span className="uppercase">{data.paymentMethod === 'online' ? 'Online Payment' : data.paymentMethod}</span>
            </div>

            {/* Footer */}
            {data.settings.receipt_footer && (
              <>
                <div className="border-b border-dashed border-gray-300 my-3" />
                <p className="text-center text-gray-500">{data.settings.receipt_footer}</p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
              Close
            </button>
            <button onClick={handlePrint} disabled={isPrinting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm">
              {isPrinting ? (
                <><RefreshCw size={15} className="animate-spin" /> Printing...</>
              ) : (
                <><Printer size={15} /> Print Receipt</>
              )}
            </button>
          </div>
          {/* Save as properly-sized PDF — bypasses the A4 system dialog issue */}
          <button onClick={onSavePdf} disabled={isPrinting}
            className="w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Sales Component ─────────────────────────────────────────────
export default function Sales() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [settings, setSettings] = useState<Settings>({
    store_name: 'My Restaurant', store_phone: '', store_address: '', receipt_footer: 'Thank you!', store_logo: ''
  });

  // Receipt preview
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Custom sale modal
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const customNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProducts(); loadSettings(); }, []);
  useEffect(() => {
    // Only clear on initial open
    if (showCustom) {
      setCustomName('');
      setCustomPrice('');
      setCustomQty('1');
      setTimeout(() => customNameRef.current?.focus(), 100);
    }
  }, [showCustom]);

  const loadProducts = async () => {
    try { const res = await window.api.getProducts(); setProducts((res?.success && res.data) ? res.data as any : []); } catch { }
  };
  const loadSettings = async () => {
    try { const res = await window.api.getSettings(); if (res?.success && res.data) setSettings(res.data); } catch { }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Cart helpers ─────────────────────────────────────────────────
  const addProductToCart = (product: Product) => {
    const key = String(product.id);
    const existing = cart.find((i) => i.id === key);
    if (existing) {
      setCart(cart.map((i) => i.id === key ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { id: key, product_id: product.id, name: product.name, price: product.price, quantity: 1, is_custom: false }]);
    }
  };

  const addCustomToCart = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customPrice);
    const qty = parseInt(customQty) || 1;
    if (!customName.trim() || isNaN(price) || price <= 0) return;
    const key = `custom-${Date.now()}`;
    setCart([...cart, { id: key, product_id: null, name: customName.trim(), price, quantity: qty, is_custom: true }]);
    setShowCustom(false);
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart(cart.filter((i) => i.id !== id)); return; }
    setCart(cart.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = discountType === 'percentage'
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : (parseFloat(discountValue) || 0);
  const total = Math.max(0, subtotal - discountAmount);

  // ── Build printable HTML ─────────────────────────────────────────
  const buildReceiptHtml = (saleId: number | bigint) => {
    const date = new Date().toLocaleString('en-PK');
    const itemsHtml = cart.map((item) =>
      `<div class="item"><span>${item.name} x${item.quantity}</span><span>${fmtPKR(item.price * item.quantity)}</span></div>`
    ).join('');
    return `
      ${settings.store_logo ? `<img src="${settings.store_logo}" style="max-height:48px;display:block;margin:0 auto 4px"/>` : ''}
      <h2>${settings.store_name}</h2>
      ${settings.store_address ? `<p class="center">${settings.store_address}</p>` : ''}
      ${settings.store_phone ? `<p class="center">Tel: ${settings.store_phone}</p>` : ''}
      <div class="divider"></div>
      <p class="center">Receipt #${saleId}</p>
      <p class="center" style="font-size:10px">${date}</p>
      <div class="divider"></div>
      ${itemsHtml}
      <div class="divider"></div>
      <div class="total-row" style="font-weight:normal;font-size:11px"><span>Subtotal</span><span>${fmtPKR(subtotal)}</span></div>
      ${discountAmount > 0 ? `<div class="total-row" style="font-weight:normal;font-size:11px;color:red"><span>Discount</span><span>-${fmtPKR(discountAmount)}</span></div>` : ''}
      <div class="total-row"><span>Total</span><span>${fmtPKR(total)}</span></div>
      <div class="total-row" style="font-weight:normal;font-size:10px;margin-top:2px"><span>Payment</span><span>${paymentMethod === 'online' ? 'ONLINE PAYMENT' : paymentMethod.toUpperCase()}</span></div>
      <div class="footer">${settings.receipt_footer}</div>
    `;
  };

  // ── Checkout ─────────────────────────────────────────────────────
  const processPayment = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await window.api.createSale({
        subtotal,
        discount: discountAmount,
        total,
        payment_method: paymentMethod,
        items: cart.map((c) => ({
          product_id: c.product_id || undefined,
          product_name: c.name,
          quantity: c.quantity,
          price: c.price,
          is_custom: c.is_custom,
        })),
      });
      if (result.success) {
        // Show in-app receipt preview instead of directly printing
        setReceiptData({
          saleId: result.data?.saleId || Date.now(),
          items: [...cart],
          subtotal,
          discount: discountAmount,
          total,
          paymentMethod,
          settings: { ...settings },
          date: new Date().toLocaleString('en-PK'),
        });
        loadProducts();
        setDiscountValue('');
        setCheckoutError('');
      } else {
        setCheckoutError('Failed to process: ' + result.error);
      }
    } catch { setCheckoutError('Error processing sale.'); }
    finally { setIsProcessing(false); }
  };

  const handlePrintReceipt = async () => {
    if (!receiptData) return;
    await window.api.printInvoice(buildReceiptHtml(receiptData.saleId));
  };

  const handleSavePdf = async () => {
    if (!receiptData) return;
    await window.api.saveInvoicePdf(buildReceiptHtml(receiptData.saleId));
  };


  const handleCloseReceipt = () => {
    setReceiptData(null);
    setCart([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="text-blue-600" size={24} /> Point of Sale
        </h1>
        <button onClick={() => setShowCustom(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
          <PenLine size={16} /> Custom Sale
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Products Grid */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:w-2/3">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input type="text" placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button key={product.id} onClick={() => addProductToCart(product)}
                  className="flex flex-col p-3 rounded-xl border text-left bg-white border-gray-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <p className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">{product.name}</p>
                  {product.category && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mb-2 w-fit">{product.category}</span>
                  )}
                  <p className="text-blue-600 font-bold mt-auto">{fmtPKR(product.price)}</p>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-400 text-sm">
                  No products found. <button onClick={() => setShowCustom(true)} className="text-purple-600 underline ml-1">Use custom sale?</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:w-[340px] min-w-[300px]">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="relative inline-block">
                <CartIcon size={21} className="text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <h2 className="font-bold text-gray-800">Order</h2>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Clear</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                <CartIcon size={44} className="opacity-20 mb-3" />
                <p className="text-sm">Tap a product or add a custom item</p>
              </div>
            ) : cart.map((item) => (
              <div key={item.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${item.is_custom ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    {item.is_custom && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 rounded font-medium flex-shrink-0">Custom</span>}
                  </div>
                  <p className="text-xs text-blue-600 font-semibold">{fmtPKR(item.price)}</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1.5 hover:text-blue-600"><Minus size={13} /></button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1.5 hover:text-blue-600"><Plus size={13} /></button>
                </div>
                <p className="text-xs font-bold text-gray-800 w-20 text-right">{fmtPKR(item.price * item.quantity)}</p>
                <button onClick={() => setCart(cart.filter((i) => i.id !== item.id))} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50">
            {/* Discount Section */}
            {cart.length > 0 && (
              <div className="mb-3 p-2 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">Discount</span>
                  <div className="flex bg-gray-100 rounded-md p-0.5">
                    <button
                      onClick={() => setDiscountType('percentage')}
                      className={`px-2 py-0.5 text-[10px] rounded ${discountType === 'percentage' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >%</button>
                    <button
                      onClick={() => setDiscountType('fixed')}
                      className={`px-2 py-0.5 text-[10px] rounded ${discountType === 'fixed' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >Amt</button>
                  </div>
                </div>
                <input
                  type="number"
                  placeholder={discountType === 'percentage' ? "0%" : "0.00"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            )}

            <div className="flex gap-2 mb-3">
              {(['cash', 'online'] as const).map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {m === 'online' ? 'Online Payment' : m}
                </button>
              ))}
            </div>
            <div className="space-y-1 mb-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700 font-medium">{fmtPKR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-500">Discount</span>
                  <span className="text-red-600 font-medium">-{fmtPKR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-gray-800 font-bold">Total</span>
                <span className="text-2xl font-bold text-blue-700">{fmtPKR(total)}</span>
              </div>
            </div>
            <button onClick={processPayment}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${cart.length === 0 || isProcessing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}>
              {isProcessing
                ? <><RefreshCw size={17} className="animate-spin" /> Processing...</>
                : <><Printer size={17} /> Charge &amp; Print</>}
            </button>
            {checkoutError && (
              <div className="mt-3 text-red-600 text-sm font-medium bg-red-50 p-2 rounded-lg text-center border border-red-100">
                {checkoutError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Sale Modal */}
      {showCustom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine size={20} className="text-purple-600" />
                <h2 className="text-lg font-bold text-gray-800">Custom Sale</h2>
              </div>
              <button onClick={() => setShowCustom(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={addCustomToCart} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input ref={customNameRef} type="text" required value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="e.g. Special Drink"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (PKR) *</label>
                  <input type="number" min="1" step="1" required value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" min="1" required value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              {customName && customPrice && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm">
                  <span className="text-purple-700 font-medium">{customName} x{customQty || 1}</span>
                  <span className="float-right font-bold text-purple-700">{fmtPKR((parseFloat(customPrice) || 0) * (parseInt(customQty) || 1))}</span>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCustom(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium text-sm">
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {receiptData && (
        <ReceiptModal
          data={receiptData}
          onPrint={handlePrintReceipt}
          onSavePdf={handleSavePdf}
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
}
