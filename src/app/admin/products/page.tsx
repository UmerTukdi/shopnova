'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: string;
  tags?: string[];
  price: number;
  originalPrice: number;
  mrp: number;
  discount: number;
  stock: number;
  image: string;
  featured?: boolean;
  isBestSeller?: boolean;
  isDeleted?: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: 'ShopNova',
    category: 'electronics',
    tags: '',
    price: '',
    originalPrice: '',
    stock: '',
    image: '',
    featured: false,
    isBestSeller: false,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/admin/products?includeDeleted=${includeDeleted}${
        categoryFilter ? `&category=${categoryFilter}` : ''
      }${search ? `&search=${encodeURIComponent(search)}` : ''}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.products) {
        setProducts(data.data.products);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, categoryFilter, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      brand: 'ShopNova',
      category: 'electronics',
      tags: '',
      price: '',
      originalPrice: '',
      stock: '10',
      image: '',
      featured: false,
      isBestSeller: false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      description: prod.description,
      brand: prod.brand || 'ShopNova',
      category: prod.category,
      tags: prod.tags ? prod.tags.join(', ') : '',
      price: prod.price.toString(),
      originalPrice: (prod.originalPrice || prod.mrp || prod.price).toString(),
      stock: prod.stock.toString(),
      image: prod.image,
      featured: Boolean(prod.featured),
      isBestSeller: Boolean(prod.isBestSeller),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formData.price);
    const origNum = parseFloat(formData.originalPrice);
    const stockNum = parseInt(formData.stock, 10);

    if (!formData.name.trim()) return setFormError('Product name is required');
    if (!formData.description.trim()) return setFormError('Description is required');
    if (!formData.image.trim()) return setFormError('Main image URL is required');
    if (isNaN(priceNum) || priceNum < 0) return setFormError('Price must be a valid number >= 0');
    if (isNaN(stockNum) || stockNum < 0) return setFormError('Stock must be a valid number >= 0');
    if (isNaN(origNum) || origNum < priceNum) {
      return setFormError('Original price (MRP) cannot be lower than the selling price');
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        brand: formData.brand.trim(),
        category: formData.category.trim().toLowerCase(),
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        price: priceNum,
        originalPrice: origNum,
        mrp: origNum,
        stock: stockNum,
        image: formData.image.trim(),
        featured: formData.featured,
        isBestSeller: formData.isBestSeller,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct._id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        setFormError(data.message || data.error || 'Failed to save product');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server error while saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSoftDelete = async (prod: ProductItem) => {
    try {
      if (prod.isDeleted) {
        // Restore product
        const res = await fetch(`/api/admin/products/${prod._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDeleted: false }),
        });
        if (res.ok) fetchProducts();
      } else {
        // Soft delete
        if (!confirm(`Are you sure you want to soft-delete "${prod.name}"? It will be hidden from storefront customers.`)) {
          return;
        }
        const res = await fetch(`/api/admin/products/${prod._id}`, {
          method: 'DELETE',
        });
        if (res.ok) fetchProducts();
      }
    } catch (err) {
      console.error('Error toggling delete status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-500" /> Product Catalog Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Create, edit, soft-delete, and configure store inventory items</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search product title, brand, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home-kitchen">Home & Kitchen</option>
            <option value="beauty">Beauty</option>
            <option value="grocery">Grocery</option>
            <option value="sports">Sports</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded bg-slate-950 border-slate-800"
            />
            Show Deleted Products
          </label>
        </div>
      </div>

      {/* Table List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Fetching catalog items...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl text-center">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No products found matching criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting filters or adding a new product.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Selling Price</th>
                  <th className="px-4 py-3.5">MRP</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((prod) => (
                  <tr
                    key={prod._id}
                    className={`hover:bg-slate-800/40 transition ${
                      prod.isDeleted ? 'opacity-50 bg-red-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-800 bg-slate-950"
                        />
                        <div>
                          <p className="font-bold text-slate-100 line-clamp-1">{prod.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Brand: {prod.brand || 'ShopNova'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 font-medium capitalize border border-slate-800">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{prod.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-400 line-through">₹{(prod.originalPrice || prod.mrp || prod.price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          prod.stock === 0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : prod.stock <= 5
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-slate-200'
                        }`}
                      >
                        {prod.stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {prod.isDeleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          DELETED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSoftDelete(prod)}
                          className={`p-1.5 rounded-lg transition ${
                            prod.isDeleted
                              ? 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300'
                              : 'bg-red-600/20 hover:bg-red-600/40 text-red-400'
                          }`}
                          title={prod.isDeleted ? 'Restore Product' : 'Soft Delete'}
                        >
                          {prod.isDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">
              {editingProduct ? 'Edit Product Details' : 'Create New Product'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Enter server-validated product attributes</p>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wireless Headphones"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. NovaPulse"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed product specification and highlights..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home-kitchen">Home & Kitchen</option>
                    <option value="beauty">Beauty</option>
                    <option value="grocery">Grocery</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="4999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Original Price / MRP (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="7999"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stock Level (Units) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="25"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="audio, wireless, bluetooth"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Main Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded bg-slate-950 border-slate-800"
                  />
                  Featured Product
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded bg-slate-950 border-slate-800"
                  />
                  Best Seller Badge
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
