import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useNotifications } from '../components/NotificationProvider';

interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
}

const empty: Product = { name: '', price: 0, category: '' };
const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [current, setCurrent] = useState<Product>(empty);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const nameRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (showDialog) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [showDialog]);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await window.api.getProducts();
      if (response && response.success) {
        setProducts(response.data || []);
      } else {
        addNotification("Load Error", "Failed to load products. Please refresh.", "error");
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      addNotification("Error", error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const openAdd = () => {
    setCurrent(empty);
    setIsEditing(false);
    setShowDialog(true);
  };
  
  const openEdit = (p: Product) => {
    setCurrent({ ...p });
    setIsEditing(true);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!current.name.trim()) {
      addNotification("Validation Error", "Product name is required.", "warning");
      nameRef.current?.focus();
      return;
    }
    
    const price = Number(current.price);
    if (isNaN(price) || price <= 0) {
      addNotification("Validation Error", "Price must be a positive number.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: current.name.trim(),
        price: price,
        category: current.category.trim()
      };
      
      let response;
      if (isEditing && current.id) {
        response = await window.api.updateProduct(current.id, productData);
      } else {
        response = await window.api.addProduct(productData);
      }
      
      if (response && response.success) {
        addNotification("Success", isEditing ? "Product updated successfully." : "Product added successfully.", "success");
        setTimeout(() => {
          setShowDialog(false);
          load();
        }, 300);
      } else {
        throw new Error(response?.error || 'Failed to save product');
      }
    } catch (err: any) {
      addNotification("Error", err.message || "Failed to save product.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      const response = await window.api.deleteProduct(id);
      if (response && response.success) {
        addNotification("Deleted", "Product deleted successfully.", "success");
        await load();
        setDeleteConfirmId(null);
      } else {
        throw new Error(response?.error || 'Failed to delete product');
      }
    } catch (err: any) {
      addNotification("Error", err.message || "Failed to delete product.", "error");
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products Catalogue</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and organize your catalogue</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-sm">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-primary/10 p-3 rounded-xl"><Package className="text-primary w-5 h-5"/></div>
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Products</CardTitle>
              <div className="text-3xl font-bold">{products.length}</div>
            </div>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-secondary p-3 rounded-xl"><Package className="text-secondary-foreground w-5 h-5"/></div>
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Categories</CardTitle>
              <div className="text-3xl font-bold">{categories.length}</div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
             <Input 
                type="text" 
                placeholder="Search by name or category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full sm:w-1/3 min-w-[300px]"
             />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[40%]">Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Loading products...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    {searchTerm ? "No matching products found." : "No products available. Add some to get started!"}
                  </TableCell>
                </TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell>
                    {p.category ? <Badge variant="secondary" className="font-mono">{p.category}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{fmtPKR(p.price)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Pencil size={14} />
                      </Button>
                      
                      {deleteConfirmId === p.id ? (
                        <div className="flex items-center gap-2 bg-destructive/10 px-2 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-right-2">
                          <span className="text-xs font-semibold text-destructive">Sure?</span>
                          <Button variant="default" size="sm" onClick={() => handleDelete(p.id)} className="h-6 px-2 text-[10px] bg-destructive hover:bg-destructive/90">Yes</Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)} className="h-6 px-2 text-[10px]">No</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(p.id!)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Modal completely styled generically */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => !isSaving && setShowDialog(false)}>
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</CardTitle>
                <CardDescription>Fill in the details below to complete your catalogue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Product Name <span className="text-destructive">*</span></label>
                  <Input 
                    ref={nameRef}
                    required 
                    value={current.name || ''}
                    onChange={(e) => setCurrent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Zinger Burger"
                    disabled={isSaving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Price (PKR) <span className="text-destructive">*</span></label>
                    <Input 
                      type="number" min="1" step="1" required 
                      value={current.price || ''}
                      onChange={(e) => setCurrent(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Category</label>
                    <Input 
                      type="text" 
                      value={current.category || ''}
                      onChange={(e) => setCurrent(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g. Fast Food"
                      list="cat-list"
                      disabled={isSaving}
                    />
                    <datalist id="cat-list">
                      {categories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowDialog(false)} disabled={isSaving}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Product')}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}