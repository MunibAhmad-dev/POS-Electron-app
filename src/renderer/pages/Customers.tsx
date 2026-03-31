import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNotifications } from '../components/NotificationProvider';

interface Customer {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
}

const empty: Customer = { name: '', phone: '', email: '' };

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [current, setCurrent] = useState<Customer>(empty);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // Dummy read for UI consistency, assuming backend hooks later
      setCustomers([]);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => { setCurrent(empty); setIsEditing(false); setShowDialog(true); };
  const openEdit = (c: Customer) => { setCurrent({ ...c }); setIsEditing(true); setShowDialog(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current.name.trim()) {
       addNotification("Validation Error", "Customer name is required.", "warning");
       return;
    }

    if (isEditing) {
      setCustomers(customers.map((c) => (c.id === current.id ? current : c)));
      addNotification("Customer updated", `${current.name} updated successfully.`, "success");
    } else {
      setCustomers([{ ...current, id: Date.now() }, ...customers]);
      addNotification("Customer added", `${current.name} added to database.`, "success");
    }
    setShowDialog(false);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    setCustomers(customers.filter((c) => c.id !== id));
    addNotification("Customer deleted", "Customer record removed entirely.", "info");
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-[1400px]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Customers Directory</h1>
           <p className="text-muted-foreground text-sm mt-1">Manage client relationships and contact info</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-sm">
          <Plus size={16} /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-primary/10 p-3 rounded-xl border border-primary/20"><Users className="text-primary w-5 h-5"/></div>
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Customers</CardTitle>
              <div className="text-3xl font-bold tabular-nums">{customers.length}</div>
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
                placeholder="Search by name, phone or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full md:max-w-md bg-background"
             />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                       <Users size={40} className="opacity-20" />
                       <p>{searchTerm ? "No customers match your search." : "No customers registered yet. Add your first client!"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c, i) => (
                  <TableRow key={c.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell>
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                           <Phone size={12} className="opacity-70" />
                           <span className="font-mono text-xs tracking-wide">{c.phone}</span>
                        </div>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      {c.email ? (
                         <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                           <Mail size={12} className="opacity-70" />
                           <span className="text-sm">{c.email}</span>
                        </div>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2 outline-none">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Pencil size={14} />
                        </Button>
                        {deleteConfirmId === c.id ? (
                          <div className="flex items-center gap-2 bg-destructive/10 px-2 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-right-2">
                            <span className="text-xs font-semibold text-destructive">Delete?</span>
                            <Button variant="default" size="sm" onClick={() => handleDelete(c.id)} className="h-6 px-2 text-[10px] bg-destructive hover:bg-destructive/90">Yes</Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)} className="h-6 px-2 text-[10px]">No</Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(c.id!)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for Edit / Add */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
                <CardDescription>Enter contact details below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Full Name <span className="text-destructive">*</span></label>
                  <Input 
                    type="text" required value={current.name} autoFocus
                    onChange={(e) => setCurrent({ ...current, name: e.target.value })}
                    placeholder="e.g. John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Phone Number</label>
                  <Input 
                    type="tel" value={current.phone || ''}
                    onChange={(e) => setCurrent({ ...current, phone: e.target.value })}
                    placeholder="+92 300 1234567" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email Address</label>
                  <Input 
                    type="email" value={current.email || ''}
                    onChange={(e) => setCurrent({ ...current, email: e.target.value })}
                    placeholder="john@example.com" 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="w-full">{isEditing ? 'Save Changes' : 'Create Customer'}</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
