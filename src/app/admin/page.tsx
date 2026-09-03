'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface MetricData {
  totalRevenue: number;
  paidOrdersCount: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.data) {
        setMetrics(data.data.metrics);
        setRecentOrders(data.data.recentOrders || []);
        setRevenueTrend(data.data.revenueTrend || []);
        setStatusBreakdown(data.data.statusBreakdown || {});
      } else {
        setError(data.message || data.error || 'Failed to load dashboard metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to analytics server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Aggregating real-time store analytics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Failed to Load Dashboard</h3>
        <p className="text-slate-300 text-sm mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${metrics.totalRevenue.toLocaleString()}`,
      sub: `${metrics.paidOrdersCount} Paid Orders`,
      icon: DollarSign,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders,
      sub: `${metrics.paidOrdersCount} Confirmed / Paid`,
      icon: ShoppingBag,
      color: 'from-indigo-500/20 to-violet-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      title: 'Total Customers',
      value: metrics.totalCustomers,
      sub: 'Registered Accounts',
      icon: Users,
      color: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20',
    },
    {
      title: 'Catalog Products',
      value: metrics.totalProducts,
      sub: `${metrics.lowStockCount} Low Stock / ${metrics.outOfStockCount} Out`,
      icon: Package,
      color: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics, revenue trends, and operational summary</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Stats
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} border backdrop-blur-sm flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</span>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory & Status Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Fulfillment Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Fulfillment Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Order counts across fulfillment pipeline states</p>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                let badgeStyle = 'bg-slate-800 text-slate-300';
                if (status === 'DELIVERED') badgeStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                if (status === 'SHIPPED') badgeStyle = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                if (status === 'PROCESSING' || status === 'CONFIRMED') badgeStyle = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
                if (status === 'PENDING') badgeStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                if (status === 'CANCELLED') badgeStyle = 'bg-red-500/20 text-red-400 border-red-500/30';

                return (
                  <div key={status} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badgeStyle}`}>{status}</span>
                    <span className="text-sm font-bold text-white">{count} orders</span>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            href="/admin/orders"
            className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            Manage All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Low Stock & Inventory Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Inventory Health</h3>
            <p className="text-xs text-slate-400 mb-4">Stock thresholds and re-order alerts</p>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">Low Stock Warning</p>
                    <p className="text-[11px] text-amber-400/80">Products with stock ≤ 5 units</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-amber-300">{metrics.lowStockCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-xs font-bold text-red-300">Out of Stock</p>
                    <p className="text-[11px] text-red-400/80">Products with stock = 0</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-300">{metrics.outOfStockCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Healthy Stock</p>
                    <p className="text-[11px] text-emerald-400/80">Products in good supply</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-300">
                  {Math.max(0, metrics.totalProducts - (metrics.lowStockCount + metrics.outOfStockCount))}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            Go to Inventory Control <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Revenue Trend Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Daily Revenue Activity</h3>
            <p className="text-xs text-slate-400 mb-4">Paid sales logs aggregated by date</p>
            {revenueTrend.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No paid revenue trends recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {revenueTrend.map((trend: any) => (
                  <div key={trend._id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-400 font-mono">{trend._id}</span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">₹{trend.revenue.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 ml-2">({trend.orders} paid)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Revenue calculated exclusively from paid orders
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Orders</h3>
            <p className="text-xs text-slate-400">Latest customer orders submitted</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No recent orders recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{ord.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-200">{ord.customerName || 'Customer'}</p>
                      <p className="text-[11px] text-slate-500">{ord.customerEmail || '—'}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">₹{ord.totalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${ord._id}`}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg font-medium text-xs transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
