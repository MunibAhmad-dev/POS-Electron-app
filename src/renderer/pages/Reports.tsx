import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, ShoppingBag, TrendingUp, RefreshCw, Award, Calendar, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useNotifications } from '../components/NotificationProvider';

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
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await window.api.getReport(period);
      setReport((res?.success && res.data) ? res.data as any : { sales: [], revenue: 0, topProducts: [] });
    } catch (err) { 
      console.error(err); 
      addNotification("Error", "Could not load report data.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const cashSales = report.sales.filter((s) => s.payment_method === 'cash').length;
  const cardSales = report.sales.filter((s) => s.payment_method === 'online' || s.payment_method === 'card').length;
  const avgOrder = report.sales.length > 0 ? report.revenue / report.sales.length : 0;

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'Last 7 Days' : 'This Month';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1400px] mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Key metrics and reporting for <span className="font-semibold text-foreground">{periodLabel}</span></p>
        </div>
        <div className="flex items-center gap-3 bg-card p-1 rounded-xl shadow-sm border">
          {(['today', 'week', 'month'] as const).map((p) => (
            <Button 
              key={p} 
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className={cn("capitalize px-4 transition-all duration-300", period === p ? "shadow-md" : "hover:bg-muted font-normal")}
              disabled={loading}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
            </Button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={loadReport} disabled={loading} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50 bg-card/60 backdrop-blur-sm hover:-translate-y-1 transition-transform">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-green-500/10 p-2.5 rounded-lg border border-green-500/20 text-green-500"><DollarSign size={20} /></div>
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
              <div className="text-2xl font-bold font-mono tracking-tight mt-1">{fmtPKR(report.revenue)}</div>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="shadow-sm border-border/50 bg-card/60 backdrop-blur-sm hover:-translate-y-1 transition-transform">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-500"><ShoppingBag size={20} /></div>
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</CardTitle>
              <div className="text-2xl font-bold font-mono tracking-tight mt-1">{report.sales.length}</div>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="shadow-sm border-border/50 bg-card/60 backdrop-blur-sm hover:-translate-y-1 transition-transform">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20 text-purple-500"><TrendingUp size={20} /></div>
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Order Value</CardTitle>
              <div className="text-2xl font-bold font-mono tracking-tight mt-1">{fmtPKR(avgOrder)}</div>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-sm border-border/50 bg-card/60 backdrop-blur-sm hover:-translate-y-1 transition-transform">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/20 text-orange-500"><BarChart3 size={20} /></div>
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash / Online Ratio</CardTitle>
              <div className="text-2xl font-bold font-mono tracking-tight mt-1">{cashSales} <span className="text-muted-foreground text-xl font-sans font-light">/</span> {cardSales}</div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <Card className="shadow-md flex flex-col min-h-[400px]">
          <CardHeader className="border-b bg-muted/20 py-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </div>
            <Badge variant="outline" className="bg-background shadow-xs font-normal">Ranked by revenue</Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {loading ? (
               <div className="h-full flex flex-col items-center justify-center min-h-[300px] text-muted-foreground animate-pulse">
                  <RefreshCw size={24} className="animate-spin mb-3 text-primary" /> Loading metrics...
               </div>
            ) : report.topProducts.length > 0 ? (
              <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/10 hover:bg-muted/10">
                     <TableHead className="w-16 text-center">Rank</TableHead>
                     <TableHead>Product</TableHead>
                     <TableHead className="text-right">Volume</TableHead>
                     <TableHead className="text-right pr-6">Revenue</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {report.topProducts.map((p, i) => (
                     <TableRow key={i} className="hover:bg-muted/30">
                       <TableCell className="text-center">
                         <Badge variant={i === 0 ? "default" : i === 1 ? "secondary" : "outline"} className={cn("px-2 py-0 h-5 tabular-nums text-[10px]", i === 0 && "bg-amber-500 text-amber-50 border-transparent", i === 1 && "bg-slate-300 text-slate-800", i === 2 && "border-amber-500/50 text-amber-700")}>
                           #{i + 1}
                         </Badge>
                       </TableCell>
                       <TableCell className="font-semibold">{p.name}</TableCell>
                       <TableCell className="text-right font-mono text-xs">{p.qty_sold}</TableCell>
                       <TableCell className="text-right pr-6 font-bold text-primary">{fmtPKR(p.revenue)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            ) : (
              <div className="py-24 flex flex-col items-center text-center text-muted-foreground">
                 <ShoppingBag size={48} className="opacity-10 mb-4 text-foreground" />
                 <p>No products were sold during {periodLabel.toLowerCase()}.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions list */}
        <Card className="shadow-md flex flex-col min-h-[400px]">
          <CardHeader className="border-b bg-muted/20 py-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </div>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={() => window.location.hash = '/transactions'}>
               View all <ChevronRight size={12} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[460px] scrollbar-hide flex-1">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center min-h-[300px] text-muted-foreground animate-pulse">
                  <RefreshCw size={24} className="animate-spin mb-3 text-primary" /> Loading timeline...
               </div>
            ) : report.sales.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                   <TableRow className="bg-muted/10 hover:bg-muted/10">
                     <TableHead className="pl-6">Invoice</TableHead>
                     <TableHead className="w-24">Method</TableHead>
                     <TableHead className="text-right pr-6">Amount</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {report.sales.slice(0, 20).map((s) => (
                     <TableRow key={s.id} className="cursor-default hover:bg-muted/50">
                       <TableCell className="pl-6">
                         <div className="flex flex-col">
                           <span className="font-bold text-sm leading-tight text-foreground/80">#{s.id}</span>
                           <span className="text-[10px] text-muted-foreground mt-0.5">{dayjs(s.date_created).format('DD MMM, hh:mm A')}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <Badge variant={s.payment_method === 'online' || s.payment_method === 'card' ? 'secondary' : 'outline'} className="uppercase text-[9px] px-1.5 h-4">
                           {s.payment_method}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-right pr-6 font-bold font-mono tracking-tight">{fmtPKR(s.total)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            ) : (
                <div className="py-24 flex flex-col items-center text-center text-muted-foreground">
                 <DollarSign size={48} className="opacity-10 mb-4 text-foreground" />
                 <p>No invoices ringed up {periodLabel.toLowerCase()}.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
