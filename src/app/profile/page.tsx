'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Package,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Home,
  Briefcase,
  Building,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressFullName, setAddressFullName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressCountry, setAddressCountry] = useState('India');
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Sync profile fields from user
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await fetch('/api/addresses');
      const data = await res.json();
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error('Fetch addresses error:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!profileName.trim()) {
      setProfileFeedback({ type: 'error', message: 'Full name cannot be empty.' });
      return;
    }

    setProfileUpdating(true);
    const res = await updateProfile({
      name: profileName.trim(),
      phone: profilePhone.trim(),
    });
    setProfileUpdating(false);

    if (res.success) {
      setProfileFeedback({ type: 'success', message: 'Profile updated and saved to database successfully.' });
      setIsEditingProfile(false);
      setTimeout(() => setProfileFeedback(null), 4000);
    } else {
      setProfileFeedback({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressFullName(user?.name || '');
    setAddressPhone(user?.phone || '');
    setAddressLabel('Home');
    setAddressLine1('');
    setAddressLine2('');
    setAddressCity('');
    setAddressState('');
    setAddressPostalCode('');
    setAddressCountry('India');
    setAddressIsDefault(addresses.length === 0);
    setAddressError('');
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr: any) => {
    setEditingAddressId(addr._id);
    setAddressFullName(addr.fullName || '');
    setAddressPhone(addr.phone || '');
    setAddressLabel(addr.label || 'Home');
    setAddressLine1(addr.addressLine1 || addr.addressLine || '');
    setAddressLine2(addr.addressLine2 || addr.apartment || '');
    setAddressCity(addr.city || '');
    setAddressState(addr.state || '');
    setAddressPostalCode(addr.postalCode || '');
    setAddressCountry(addr.country || 'India');
    setAddressIsDefault(Boolean(addr.isDefault));
    setAddressError('');
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!addressFullName || !addressPhone || !addressLine1 || !addressCity || !addressState || !addressPostalCode) {
      setAddressError('Please fill in all required address fields.');
      return;
    }

    setAddressSubmitting(true);
    try {
      const payload = {
        fullName: addressFullName.trim(),
        phone: addressPhone.trim(),
        label: addressLabel,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: addressCity.trim(),
        state: addressState.trim(),
        postalCode: addressPostalCode.trim(),
        country: addressCountry.trim(),
        isDefault: addressIsDefault,
      };

      const endpoint = editingAddressId ? `/api/addresses/${editingAddressId}` : '/api/addresses';
      const method = editingAddressId ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddressModal(false);
        fetchAddresses();
      } else {
        setAddressError(data.error || 'Failed to save address');
      }
    } catch (err: any) {
      setAddressError(err.message || 'Error saving address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAddresses((prev) => prev.filter((a) => a._id !== id));
      }
    } catch (err) {
      console.error('Delete address error:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Set default address error:', err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Login Required</h1>
            <p className="text-xs text-slate-500">Please sign in to view and manage your profile details.</p>
          </div>
          <Link
            href="/login?redirect=/profile"
            className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Profile &amp; Account</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Manage personal contact info, view order history, and maintain saved delivery addresses
        </p>
      </div>

      {profileFeedback && (
        <div
          className={`border text-xs rounded-2xl p-4 flex items-center gap-3 ${
            profileFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {profileFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{profileFeedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left 5 Cols: Account & Personal Info */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3 border-b border-slate-100 pb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20 uppercase">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-0.5 rounded-full mt-1 border border-indigo-100">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verified {user.role === 'admin' ? 'Administrator' : 'Customer'}</span>
              </div>
            </div>
          </div>

          {/* Profile Details (View or Edit Mode) */}
          {!isEditingProfile ? (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Personal Details</span>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Full Name</p>
                    <p className="font-bold text-slate-900">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Email Address</p>
                    <p className="font-bold text-slate-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Phone Number</p>
                    <p className="font-bold text-slate-900">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Edit Details</span>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileUpdating}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                >
                  {profileUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Quick Links */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <Link
              href="/orders"
              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-bold text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" /> My Orders &amp; Receipts
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <button
              onClick={logout}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl text-xs transition-colors"
            >
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Right 7 Cols: Saved Addresses */}
        <div id="addresses" className="md:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" /> Saved Delivery Addresses
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage multiple delivery locations for quick 1-click checkout</p>
            </div>
            <button
              onClick={handleOpenAddAddress}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Address
            </button>
          </div>

          {loadingAddresses ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading saved addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No saved addresses yet.</p>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="text-indigo-600 font-bold hover:underline"
              >
                + Add your first delivery address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                    addr.isDefault
                      ? 'border-indigo-300 bg-indigo-50/20 shadow-sm'
                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                            addr.label === 'Work'
                              ? 'bg-blue-100 text-blue-800'
                              : addr.label === 'Other'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {addr.label === 'Work' ? (
                            <Briefcase className="w-3 h-3" />
                          ) : addr.label === 'Other' ? (
                            <Building className="w-3 h-3" />
                          ) : (
                            <Home className="w-3 h-3" />
                          )}
                          {addr.label || 'Home'}
                        </span>
                        {addr.isDefault && (
                          <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            Default Address
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700">
                        {addr.addressLine1 || addr.addressLine}
                        {(addr.addressLine2 || addr.apartment) && `, ${addr.addressLine2 || addr.apartment}`}
                      </p>
                      <p className="text-slate-600">
                        {addr.city}, {addr.state} - {addr.postalCode}, {addr.country || 'India'}
                      </p>
                      <p className="text-slate-500 font-medium">Phone: {addr.phone}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAddress(addr)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Address"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {!addr.isDefault && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr._id)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        Set as Default Address
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>

            {addressError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3">
              {/* Label Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Address Label</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressLabel(lbl)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        addressLabel === lbl
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lbl === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {lbl === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                      {lbl === 'Other' && <Building className="w-3.5 h-3.5" />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={addressFullName}
                  onChange={(e) => setAddressFullName(e.target.value)}
                  required
                  placeholder="Receiver's name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                <input
                  type="tel"
                  value={addressPhone}
                  onChange={(e) => setAddressPhone(e.target.value)}
                  required
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Address Line 1 (Street/House) *</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                  placeholder="House No., Street Name, Area"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Address Line 2 (Apartment/Suite)</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt 4B, Tower 2 (Optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">City *</label>
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    required
                    placeholder="City"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">State *</label>
                  <input
                    type="text"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    required
                    placeholder="State"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Pincode *</label>
                  <input
                    type="text"
                    value={addressPostalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    required
                    placeholder="Pincode"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={addressIsDefault}
                    onChange={(e) => setAddressIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Make this my default delivery address</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {addressSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Address</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
