import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingBag, TrendingUp, Package, Activity, RefreshCw, ShieldCheck, CreditCard, Boxes
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useNotifications } from '../components/NotificationProvider';

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

export default function Dashboard({ onLock }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  const loadStats = async (isManualRefresh = false) => {
    setLoading(true);
    try {
      const res = await window.api.getDashboardStats();
      setStats((res?.success && res.data) ? res.data : null);
      if (isManualRefresh) addNotification("Dashboard refreshed", "Latest metrics loaded successfully.", "success");
    } catch (err) { 
      console.error(err);
      addNotification("Refresh Failed", "Could not fetch dashboard analytics.", "error");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = stats ? [
    { title: "Today's Revenue", value: fmt(stats.totalSalesToday), sub: `${stats.totalTransactionsToday} sales today`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'This Week', value: fmt(stats.totalSalesWeek), sub: 'Last 7 days', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'This Month', value: fmt(stats.totalSalesMonth), sub: 'Current month', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Total Trx', value: stats.totalTransactions.toLocaleString(), sub: 'Lifetime sales', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Total Catalog', value: stats.totalProducts.toLocaleString(), sub: 'Active products', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ] : [];

  const quickActions = [
    { title: 'New Sale', path: '/sales', icon: ShoppingBag, color: 'border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5' },
    { title: 'Products', path: '/products', icon: Package, color: 'border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5' },
    { title: 'Reports', path: '/reports', icon: TrendingUp, color: 'border-green-500/20 hover:border-green-500/50 hover:bg-green-500/5' },
    { title: 'Inventory', path: '/inventory', icon: Boxes, color: 'border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5' },
  ];

  if (loading && !stats) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
         <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <RefreshCw size={40} className="animate-spin text-primary" />
            <p className="text-sm font-medium animate-pulse">Loading Analytics...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onLock} className="h-9 gap-2">
            <ShieldCheck size={16} /> <span className="hidden sm:inline">Lock Screen</span>
          </Button>
          <Button variant="default" size="sm" onClick={() => loadStats(true)} className="h-9 gap-2 shadow-sm">
            <RefreshCw size={14} className={cn(loading && "animate-spin")} /> <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((card, i) => (
              <Card key={i} className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">{card.title}</CardTitle>
                  <div className={cn("p-2 rounded-lg", card.bg)}>
                     <card.icon className={cn("h-4 w-4", card.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <Card className="col-span-1 lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Shortcut to main modules</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {quickActions.map((action, i) => (
                  <Link key={i} to={action.path} className="h-full">
                    <div className={cn(
                      "flex flex-col items-center justify-center p-4 h-24 rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 cursor-pointer",
                      action.color
                    )}>
                      <action.icon size={28} className="mb-3 text-foreground/70" />
                      <span className="text-sm font-semibold text-foreground/80">{action.title}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-5 shadow-md">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Highest revenue generators this month</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {stats.topProducts?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-16 text-center">#</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity Sold</TableHead>
                        <TableHead className="text-right pr-6">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topProducts.map((p, i) => (
                        <TableRow key={i} className="hover:bg-muted/50 cursor-default">
                          <TableCell className="text-center font-medium text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-semibold">{p.name}</TableCell>
                          <TableCell className="text-right">
                             <Badge variant="outline" className="font-mono">{p.qty_sold}</Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6 font-semibold text-primary">{fmt(p.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <ShoppingBag size={48} className="opacity-10 mb-4" />
                    <p>No sales data registered yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Payment Analytics</CardTitle>
              <CardDescription>Breakdown of revenue streams</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.paymentStats?.length ? (() => {
                  const cashStat = stats.paymentStats.find(p => p.payment_method === 'cash') || { revenue: 0, count: 0 };
                  const onlineStat = stats.paymentStats.find(p => p.payment_method === 'online' || p.payment_method === 'card') || { revenue: 0, count: 0 };
                  const totalRev = (cashStat.revenue || 0) + (onlineStat.revenue || 0);
                  const cashPct = totalRev > 0 ? ((cashStat.revenue || 0) / totalRev) * 100 : 0;
                  const onlinePct = totalRev > 0 ? ((onlineStat.revenue || 0) / totalRev) * 100 : 0;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                         <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                  <DollarSign size={24} />
                               </div>
                               <div>
                                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cash Sales</p>
                                  <p className="text-2xl font-bold">{fmt(cashStat.revenue || 0)}</p>
                               </div>
                            </div>
                            <Badge variant="secondary" className="px-3 py-1 font-mono">{cashStat.count} txns</Badge>
                         </div>
                         
                         <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                  <CreditCard size={24} />
                               </div>
                               <div>
                                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Online Payment</p>
                                  <p className="text-2xl font-bold">{fmt(onlineStat.revenue || 0)}</p>
                               </div>
                            </div>
                            <Badge variant="secondary" className="px-3 py-1 font-mono">{onlineStat.count} txns</Badge>
                         </div>
                       </div>
                       
                       <div className="flex flex-col justify-center bg-card border rounded-xl p-6">
                          <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Revenue Ratio</h4>
                          <div className="flex justify-between text-sm font-bold mb-2">
                             <span className="text-green-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"/> Cash ({cashPct.toFixed(0)}%)</span>
                             <span className="text-blue-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"/> Online ({onlinePct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex shadow-inner">
                            <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${cashPct}%` }}></div>
                            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${onlinePct}%` }}></div>
                          </div>
                       </div>
                    </div>
                  );
                })() : (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    No payment analytics available.
                  </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
