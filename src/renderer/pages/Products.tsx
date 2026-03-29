import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Package, AlertCircle, CheckCircle } from 'lucide-react';

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
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  const addDebug = (message: string) => {
    console.log('[DEBUG]', message);
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addDebug('Component mounted, checking window.api...');
    if (window.api) {
      addDebug('window.api exists');
      addDebug(`Available methods: ${Object.keys(window.api).join(', ')}`);
    } else {
      addDebug('ERROR: window.api is undefined!');
    }
    load();
  }, []);

  useEffect(() => {
    if (showDialog) {
      addDebug('Dialog opened');
      setFormError('');
      setFormSuccess('');
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [showDialog]);

  const load = async () => {
    addDebug('Loading products...');
    setIsLoading(true);
    try {
      addDebug('Calling window.api.getProducts()');
      const response = await window.api.getProducts();
      addDebug(`Response received: ${JSON.stringify(response).substring(0, 200)}`);
      
      if (response && response.success) {
        addDebug(`Successfully loaded ${response.data?.length || 0} products`);
        setProducts(response.data || []);
      } else {
        addDebug(`Failed to load products: ${response?.error || 'Unknown error'}`);
        setFormError('Failed to load products. Please refresh.');
      }
    } catch (error: any) {
      addDebug(`ERROR loading products: ${error.message}`);
      console.error('Error loading products:', error);
      setFormError(`Failed to load products: ${error.message}`);
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
    addDebug('openAdd called');
    setCurrent(empty);
    setIsEditing(false);
    setShowDialog(true);
  };
  
  const openEdit = (p: Product) => {
    addDebug(`openEdit called for product: ${p.name}`);
    setCurrent({ ...p });
    setIsEditing(true);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDebug('handleSubmit called');
    setFormError('');
    setFormSuccess('');

    // Validate
    if (!current.name.trim()) {
      addDebug('Validation failed: name required');
      setFormError('Product name is required.');
      nameRef.current?.focus();
      return;
    }
    
    const price = Number(current.price);
    if (isNaN(price) || price <= 0) {
      addDebug(`Validation failed: invalid price ${current.price}`);
      setFormError('Price must be a positive number.');
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: current.name.trim(),
        price: price,
        category: current.category.trim()
      };
      
      addDebug(`Saving product: ${JSON.stringify(productData)}`);
      
      let response;
      if (isEditing && current.id) {
        addDebug(`Updating product ID: ${current.id}`);
        response = await window.api.updateProduct(current.id, productData);
      } else {
        addDebug('Adding new product');
        response = await window.api.addProduct(productData);
      }
      
      addDebug(`Response: ${JSON.stringify(response).substring(0, 200)}`);
      
      if (response && response.success) {
        addDebug('Save successful');
        setFormSuccess(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
        
        // Close dialog after success
        setTimeout(() => {
          setShowDialog(false);
          load();
        }, 1000);
      } else {
        throw new Error(response?.error || 'Failed to save product');
      }
    } catch (err: any) {
      addDebug(`ERROR saving product: ${err.message}`);
      setFormError(err?.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    addDebug(`Delete called for product ID: ${id}`);
    
    try {
      addDebug(`Calling delete API for ID: ${id}`);
      const response = await window.api.deleteProduct(id);
      addDebug(`Delete response: ${JSON.stringify(response)}`);
      
      if (response && response.success) {
        addDebug('Delete successful');
        await load();
        setFormSuccess('Product deleted successfully!');
        setDeleteConfirmId(null);
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        throw new Error(response?.error || 'Failed to delete product');
      }
    } catch (err: any) {
      addDebug(`ERROR deleting product: ${err.message}`);
      setFormError(err.message || 'Failed to delete product.');
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="p-6">
      {/* Debug Panel - Remove in production */}
      {debug.length > 0 && (
        <div className="mb-4 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-40 overflow-auto">
          <div className="flex justify-between mb-2">
            <strong>Debug Console:</strong>
            <button 
              onClick={() => setDebug([])} 
              className="text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          </div>
          {debug.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {formSuccess && !showDialog && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {formSuccess}
        </div>
      )}

      {/* Error Message */}
      {formError && !showDialog && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {formError}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500 text-sm">Manage your product catalogue</p>
          {!window.api && (
            <p className="text-red-500 text-sm mt-2 font-bold">
              ⚠️ ERROR: window.api is not defined! Check your preload script.
            </p>
          )}
        </div>
        <button 
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg"><Package size={18} /></div>
          <div>
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-800">{products.length}</p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-lg"><Package size={18} /></div>
          <div>
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input 
          type="text" 
          placeholder="Search by name or category..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3.5 text-left">Name</th>
              <th className="px-5 py-3.5 text-left">Category</th>
              <th className="px-5 py-3.5 text-left">Price</th>
              <th className="px-5 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Loading products...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {searchTerm ? 'No matching products found.' : 'No products yet. Add one to get started!'}
                </td>
              </tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-800">{p.name}</td>
                <td className="px-5 py-3.5">
                  {p.category
                    ? <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{p.category}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5 font-semibold text-blue-600">{fmtPKR(p.price)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => openEdit(p)} 
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit product"
                    >
                      <Pencil size={15} />
                    </button>
                    {deleteConfirmId === p.id ? (
                      <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                        <span className="text-xs text-red-600 font-medium mr-1">Delete?</span>
                        <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Yes</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-gray-600 hover:underline px-1 py-1">No</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeleteConfirmId(p.id!)} 
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !isSaving && setShowDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit' : 'Add'} Product</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input 
                  ref={nameRef}
                  type="text" 
                  required 
                  value={current.name || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    addDebug(`Name input changed: "${val}"`);
                    setCurrent(prev => ({ ...prev, name: val }));
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="e.g. Chicken Burger"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    step="1" 
                    required 
                    value={current.price || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      addDebug(`Price input changed: ${val}`);
                      setCurrent(prev => ({ ...prev, price: val }));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input 
                    type="text" 
                    value={current.category || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrent(prev => ({ ...prev, category: val }));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="e.g. Beverages"
                    list="cat-list"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSaving}
                  />
                  <datalist id="cat-list">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              {/* Error message */}
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Success message */}
              {formSuccess && !formError && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-lg text-sm">
                  <CheckCircle size={15} className="flex-shrink-0" />
                  {formSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowDialog(false)} 
                  disabled={isSaving}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : (isEditing ? 'Update' : 'Add') + ' Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}