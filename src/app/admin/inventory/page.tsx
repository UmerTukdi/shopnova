'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Boxes,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Loader2,
  Package,
} from 'lucide-react';

interface InventoryProduct {
  _id: string;
  name: string;
  slug: string;
  brand?: string;
  category: string;
  stock: number;
  price: number;
  image: string;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState({ totalProducts: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/inventory?filter=${filter}`);
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data.products || []);
        setSummary(data.data.summary || { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0 });

        const initialStockMap: Record<string, number> = {};
        (data.data.products || []).forEach((p: InventoryProduct) => {
          initialStockMap[p._id] = p.stock;
        });
        setEditingStock(initialStockMap);
      } else {
        setError(data.message || 'Failed to fetch inventory');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading inventory');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockChange = (id: string, val: string) => {
    const parsed = parseInt(val, 10);
    setEditingStock((prev) => ({
      ...prev,
      [id]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  const handleSaveStock = async (id: string) => {
    const newStock = editingStock[id];
    if (newStock === undefined || newStock < 0) return;

    try {
      setUpdatingId(id);
      setUpdateMsg(null);
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, stock: newStock }),
      });
      const data = await res.json();

      if (data.success) {
        setUpdateMsg({ id, msg: 'Stock saved!' });
        fetchInventory();
      } else {
        setUpdateMsg({ id, msg: data.message || 'Failed to save', isError: true });
      }
    } catch (err: any) {
      setUpdateMsg({ id, msg: err.message || 'Error saving stock', isError: true });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-indigo-500" /> Dedicated Inventory Control
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor real-time stock levels, low-stock thresholds (≤ 5 units), and execute atomic stock updates</p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Inventory
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-5 rounded-2xl border text-left transition ${
            filter === 'all'
              ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Active Catalog</span>
            <Package className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{summary.totalProducts}</p>
          <p className="text-[11px] text-slate-400 mt-1">All catalog items</p>
        </button>

        <button
          onClick={() => setFilter('low')}
          className={`p-5 rounded-2xl border text-left transition ${
            filter === 'low'
              ? 'bg-amber-500/20 border-amber-500/40 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Low Stock Warning</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300">{summary.lowStockCount}</p>
          <p className="text-[11px] text-amber-400/80 mt-1">Stock ≤ 5 units</p>
        </button>

        <button
          onClick={() => setFilter('out')}
          className={`p-5 rounded-2xl border text-left transition ${
            filter === 'out'
              ? 'bg-red-500/20 border-red-500/40 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Out of Stock</span>
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-extrabold text-red-300">{summary.outOfStockCount}</p>
          <p className="text-[11px] text-red-400/80 mt-1">Stock = 0 units</p>
        </button>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Querying stock counts...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl text-center">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No inventory alerts found for filter: {filter.toUpperCase()}</p>
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
                  <th className="px-4 py-3.5">Stock Status</th>
                  <th className="px-4 py-3.5">Atomic Stock Update</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((prod) => {
                  const currentEditStock = editingStock[prod._id] ?? prod.stock;
                  const isModified = currentEditStock !== prod.stock;
                  const isSaving = updatingId === prod._id;

                  let stockBadge = (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      IN STOCK
                    </span>
                  );
                  if (prod.stock === 0) {
                    stockBadge = (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        OUT OF STOCK
                      </span>
                    );
                  } else if (prod.stock <= 5) {
                    stockBadge = (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        LOW STOCK
                      </span>
                    );
                  }

                  return (
                    <tr key={prod._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 capitalize text-slate-300 font-medium">{prod.category}</td>
                      <td className="px-4 py-3.5 font-bold text-white">₹{prod.price.toLocaleString()}</td>
                      <td className="px-4 py-3.5">{stockBadge}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={currentEditStock}
                            onChange={(e) => handleStockChange(prod._id, e.target.value)}
                            className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-slate-400 text-xs">units</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {updateMsg?.id === prod._id && (
                            <span
                              className={`text-[11px] font-semibold ${
                                updateMsg.isError ? 'text-red-400' : 'text-emerald-400'
                              }`}
                            >
                              {updateMsg.msg}
                            </span>
                          )}
                          <button
                            disabled={!isModified || isSaving}
                            onClick={() => handleSaveStock(prod._id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
