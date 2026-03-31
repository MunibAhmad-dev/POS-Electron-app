import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Search, RefreshCw, FolderTree, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useNotifications } from '../components/NotificationProvider';

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
  const { addNotification } = useNotifications();

  useEffect(() => { load(); }, []);

  const load = async (isManual = false) => {
    setLoading(true);
    try { 
      const res = await window.api.getProducts(); 
      if (res?.success) {
        setProducts(res.data as any || []); 
        if (isManual) addNotification("Refreshed", "Inventory catalogue re-synced.", "success");
      }
    }
    catch { 
      if (isManual) addNotification("Error", "Could not load inventory.", "error");
    } finally { 
      setLoading(false); 
    }
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
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1400px]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Catalogue</h1>
          <p className="text-muted-foreground text-sm mt-1">Full overview of all available products and categories</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => load(true)} className="gap-2 h-9 shadow-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Inventory
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-primary/10 p-3 rounded-xl border border-primary/20"><Package className="text-primary w-5 h-5"/></div>
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Products</CardTitle>
              <div className="text-3xl font-bold tabular-nums">{products.length}</div>
            </div>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20"><FolderTree className="text-orange-500 w-5 h-5"/></div>
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Categories</CardTitle>
              <div className="text-3xl font-bold tabular-nums">{categories.length}</div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm border-none bg-transparent">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
          <Input 
            type="text" 
            placeholder="Search products by name or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base shadow-sm w-full md:max-w-md bg-card" 
          />
        </div>

        {searchTerm ? (
          /* Flat list when searching */
          <Card className="overflow-hidden shadow-md">
             <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/30">
                     <TableHead className="w-1/2">Product Name</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead className="text-right pr-6">Price</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filtered.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                         No products found matching "{searchTerm}".
                       </TableCell>
                     </TableRow>
                   ) : filtered.map((p) => (
                     <TableRow key={p.id}>
                       <TableCell className="font-semibold">{p.name}</TableCell>
                       <TableCell>
                         {p.category ? <Badge variant="secondary" className="font-mono text-[10px] uppercase">{p.category}</Badge> : <span className="text-muted-foreground">—</span>}
                       </TableCell>
                       <TableCell className="text-right pr-6 font-semibold text-primary">{fmtPKR(p.price)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
          </Card>
        ) : (
          /* Grouped by category */
          <div className="space-y-6">
            {byCategory.map((group) => (
              <Card key={group.name} className="overflow-hidden shadow-sm border-border/60 hover:border-border transition-colors">
                <CardHeader className="px-5 py-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-[15px] font-bold text-foreground flex items-center gap-2">
                     <FolderTree size={16} className="text-muted-foreground" />
                     {group.name}
                  </CardTitle>
                  <Badge variant="outline" className="bg-background">{group.items.length} items</Badge>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {group.items.map((p) => (
                      <div key={p.id} className="group flex flex-col justify-between border border-border rounded-xl p-4 bg-card hover:bg-muted/30 hover:border-primary/30 transition-all cursor-default">
                        <p className="font-semibold text-sm line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">{p.name}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                           <p className="text-primary font-bold text-sm tracking-tight">{fmtPKR(p.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {byCategory.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-card border rounded-xl border-dashed">
                <Package size={48} className="opacity-10 mb-4" />
                <p className="text-muted-foreground font-medium">No products added yet.</p>
                <Button variant="link" className="mt-2 text-primary" onClick={() => window.location.hash = '/products'}>
                  Go to Products to add some <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            )}
            
            {loading && byCategory.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 bg-card border rounded-xl border-dashed">
                <RefreshCw size={32} className="opacity-50 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading catalogue...</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
