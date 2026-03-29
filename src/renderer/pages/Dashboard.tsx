import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingBag, TrendingUp,
  Package, Activity, RefreshCw, ShieldCheck
} from 'lucide-react';

interface Stats {
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  totalTransactions: number;
  totalTransactionsToday: number;
  totalProducts: number;
  topProducts: Array<{ name: string; qty_sold: number; revenue: number }>;
  paymentStats: Array<{ payment_method: string; revenue: number; count: number }>;
}

interface DashboardProps {
  onLock: () => void;
}

const fmt = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

const Dashboard: React.FC<DashboardProps> = ({ onLock }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await window.api.getDashboardStats();
      setStats((res?.success && res.data) ? res.data : null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = stats
    ? [
        { title: "Today's Revenue", value: fmt(stats.totalSalesToday), sub: `${stats.totalTransactionsToday} sales today`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
        { title: 'This Week', value: fmt(stats.totalSalesWeek), sub: 'Last 7 days', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
        { title: 'This Month', value: fmt(stats.totalSalesMonth), sub: 'Current month', icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
        { title: 'Total Transactions', value: stats.totalTransactions.toLocaleString(), sub: 'All time', icon: Activity, color: 'bg-orange-100 text-orange-600' },
        { title: 'Total Products', value: stats.totalProducts.toLocaleString(), sub: 'In catalogue', icon: Package, color: 'bg-indigo-100 text-indigo-600' },
      ]
    : [];

  const quickActions = [
    { title: 'New Sale', path: '/sales', icon: ShoppingBag, color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Products', path: '/products', icon: Package, color: 'bg-indigo-500 hover:bg-indigo-600' },
    { title: 'Reports', path: '/reports', icon: TrendingUp, color: 'bg-green-500 hover:bg-green-600' },
    { title: 'Inventory', path: '/inventory', icon: Package, color: 'bg-orange-500 hover:bg-orange-600' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLock}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 bg-white px-3 py-2 rounded-lg transition-colors">
            <ShieldCheck size={14} /> Lock
          </button>
          <button onClick={loadStats}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 bg-white px-3 py-2 rounded-lg transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-blue-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                  <card.icon size={18} />
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{card.title}</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((a, i) => (
                  <Link key={i} to={a.path}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl text-white shadow-sm hover:-translate-y-1 transition-transform ${a.color}`}>
                    <a.icon size={26} className="mb-2" />
                    <span className="text-sm font-medium">{a.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Top Selling Products</h2>
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {stats?.topProducts?.length ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.topProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{p.name}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{p.qty_sold}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">{fmt(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    <ShoppingBag size={36} className="mx-auto mb-2 opacity-20" />
                    No sales data yet.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Payment Analytics</h2>
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                {stats?.paymentStats?.length ? (() => {
                  const cashStat = stats.paymentStats.find(p => p.payment_method === 'cash') || { revenue: 0, count: 0 };
                  const onlineStat = stats.paymentStats.find(p => p.payment_method === 'online' || p.payment_method === 'card') || { revenue: 0, count: 0 };
                  const totalRev = (cashStat.revenue || 0) + (onlineStat.revenue || 0);
                  const cashPct = totalRev > 0 ? ((cashStat.revenue || 0) / totalRev) * 100 : 0;
                  const onlinePct = totalRev > 0 ? ((onlineStat.revenue || 0) / totalRev) * 100 : 0;
                  
                  return (
                    <div className="space-y-4">
                      {/* Cash */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-green-100 text-green-600 flex items-center justify-center">
                            <DollarSign size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Cash Sales</p>
                            <p className="text-xs text-gray-500">{cashStat.count} transactions</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-800">{fmt(cashStat.revenue || 0)}</p>
                      </div>

                      {/* Online */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Activity size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Online Payment</p>
                            <p className="text-xs text-gray-500">{onlineStat.count} transactions</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-800">{fmt(onlineStat.revenue || 0)}</p>
                      </div>

                      {/* Bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                          <span>Cash ({cashPct.toFixed(0)}%)</span>
                          <span>Online ({onlinePct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="bg-green-500 h-full" style={{ width: `${cashPct}%` }}></div>
                          <div className="bg-blue-500 h-full" style={{ width: `${onlinePct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No payment data yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
