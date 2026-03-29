import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Search, RefreshCw } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const res = await window.api.getProducts(); setProducts((res?.success && res.data) ? res.data as any : []); }
    catch {} finally { setLoading(false); }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const byCategory = categories.map((cat) => ({
    name: cat,
    items: products.filter((p) => p.category === cat),
  }));
  const uncategorized = products.filter((p) => !p.category);
  if (uncategorized.length) byCategory.push({ name: 'Uncategorized', items: uncategorized });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-gray-500 text-sm">Product catalogue overview</p>
        </div>
        <button onClick={load} className="p-2 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg bg-white transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg"><Package size={18} /></div>
          <div>
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-800">{products.length}</p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-lg"><TrendingUp size={18} /></div>
          <div>
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
          </div>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input type="text" placeholder="Search products..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
      </div>

      {searchTerm ? (
        /* Flat list when searching */
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left">Product</th>
                <th className="px-5 py-3.5 text-left">Category</th>
                <th className="px-5 py-3.5 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm">No results.</td></tr>
                : filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{p.name}</td>
                    <td className="px-5 py-3.5">
                      {p.category ? <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{p.category}</span> : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-blue-600">{fmtPKR(p.price)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      ) : (
        /* Grouped by category */
        <div className="space-y-5">
          {byCategory.map((group) => (
            <div key={group.name} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-700">{group.name}</span>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-full">{group.items.length} items</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
                {group.items.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-shadow">
                    <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                    <p className="text-blue-600 font-bold mt-1 text-sm">{fmtPKR(p.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {byCategory.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400 text-sm">
              No products added yet. Go to Products to add some.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
