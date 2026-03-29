import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, ShoppingBag, TrendingUp, RefreshCw, Award } from 'lucide-react';
import dayjs from 'dayjs';

interface ReportData {
  sales: Array<{ id: number; total: number; date_created: string; payment_method: string }>;
  revenue: number;
  topProducts: Array<{ name: string; qty_sold: number; revenue: number }>;
}

const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

export default function Reports() {
  const [report, setReport] = useState<ReportData>({ sales: [], revenue: 0, topProducts: [] });
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await window.api.getReport(period);
      setReport((res?.success && res.data) ? res.data as any : { sales: [], revenue: 0, topProducts: [] });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const cashSales = report.sales.filter((s) => s.payment_method === 'cash').length;
  const cardSales = report.sales.filter((s) => s.payment_method === 'card').length;
  const avgOrder = report.sales.length > 0 ? report.revenue / report.sales.length : 0;

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'Last 7 Days' : 'This Month';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500 text-sm">Sales analytics — {periodLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${period === p ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          <button onClick={loadReport} className="p-2 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg bg-white transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: fmtPKR(report.revenue), icon: DollarSign, color: 'bg-green-100 text-green-600' },
          { label: 'Total Sales', value: report.sales.length.toString(), icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
          { label: 'Avg Order', value: fmtPKR(avgOrder), icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
          { label: 'Cash / Card', value: `${cashSales} / ${cardSales}`, icon: BarChart3, color: 'bg-orange-100 text-orange-600' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${card.color}`}><card.icon size={18} /></div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-800">Top Selling Products</h2>
          </div>
          {report.topProducts.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {report.topProducts.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty_sold} units sold</p>
                  </div>
                  <p className="font-semibold text-green-600 text-sm">{fmtPKR(p.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 text-sm">No sales data for this period.</div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Sales List</h2>
          </div>
          <div className="overflow-y-auto max-h-72">
            {report.sales.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No sales for {periodLabel.toLowerCase()}.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {report.sales.slice(0, 20).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-gray-600">#{s.id}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {dayjs(s.date_created).format('DD MMM, hh:mm A')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${s.payment_method === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {s.payment_method}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-gray-800">{fmtPKR(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
