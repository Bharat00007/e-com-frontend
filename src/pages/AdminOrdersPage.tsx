import React, { useEffect, useState } from 'react';
import { adminOrderService } from '../services/storeServices';
import { ApiError } from '../services/apiClient';

interface AdminOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot: string;
  shippingAddressSnapshot: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    id: string;
    productName: string;
    packSizeLabel: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  shipment?: {
    carrier: string;
    trackingNumber?: string | null;
    carrierTrackingUrl?: string | null;
    status: string;
    estimatedDelivery?: string | null;
  } | null;
  history?: Array<{
    id: string;
    status: string;
    note?: string | null;
    updatedBy?: string | null;
    carrier?: string | null;
    trackingNumber?: string | null;
    carrierTrackingUrl?: string | null;
    createdAt: string;
  }>;
}

const ALLOWED_NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

const CARRIER_OPTIONS = [
  'Delhivery Express',
  'Blue Dart',
  'DTDC Express',
  'Shiprocket',
  'Speed Post (India Post)',
];

export const AdminOrdersPage: React.FC = () => {
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sniff_co_admin_token') : null
  );
  const [adminUser, setAdminUser] = useState<{ fullName: string; role: string; email: string } | null>(
    () => {
      try {
        const raw = localStorage.getItem('sniff_co_admin_user');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  );

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('admin@thesniff.co');
  const [loginPassword, setLoginPassword] = useState('AdminPassword123!');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Orders Management State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Update Status Form State
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [carrierName, setCarrierName] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierTrackingUrl, setCarrierTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = (await adminOrderService.listOrders()) as AdminOrder[];
      setOrders(res || []);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        handleLogout();
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      void fetchOrders();
    }
  }, [adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await adminOrderService.login({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      localStorage.setItem('sniff_co_admin_token', res.token);
      localStorage.setItem('sniff_co_admin_user', JSON.stringify(res.admin));
      setAdminToken(res.token);
      setAdminUser(res.admin);
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Invalid administrator credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sniff_co_admin_token');
    localStorage.removeItem('sniff_co_admin_user');
    setAdminToken(null);
    setAdminUser(null);
    setOrders([]);
    setSelectedOrder(null);
  };

  const openOrderManagement = (order: AdminOrder) => {
    setSelectedOrder(order);
    const nextAllowed = ALLOWED_NEXT_STATUSES[order.status] ?? [];
    setTargetStatus(nextAllowed[0] || order.status);
    setStatusNote('');
    setCarrierName(order.shipment?.carrier || 'Delhivery Express');
    setTrackingNumber(order.shipment?.trackingNumber || '');
    setCarrierTrackingUrl(order.shipment?.carrierTrackingUrl || '');
    setEstimatedDelivery(
      order.shipment?.estimatedDelivery
        ? new Date(order.shipment.estimatedDelivery).toISOString().slice(0, 10)
        : ''
    );
    setPaymentStatus(order.paymentStatus);
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const updated = (await adminOrderService.updateStatus(selectedOrder.id, {
        status: targetStatus,
        note: statusNote.trim() || undefined,
        carrier: carrierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        carrierTrackingUrl: carrierTrackingUrl.trim() || undefined,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined,
        paymentStatus: paymentStatus !== selectedOrder.paymentStatus ? paymentStatus : undefined,
      })) as AdminOrder;

      setUpdateSuccess(`Order #${selectedOrder.orderNumber} status updated to ${targetStatus}!`);
      setSelectedOrder(updated);
      await fetchOrders();
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerNameSnapshot.toLowerCase().includes(q) ||
      o.customerEmailSnapshot.toLowerCase().includes(q) ||
      o.customerPhoneSnapshot.includes(q);
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <span className="w-12 h-12 rounded-2xl bg-[#104332] text-white font-bold text-xl inline-flex items-center justify-center mb-4 shadow-sm">
              S
            </span>
            <h2 className="font-heading-syne text-2xl font-bold text-on-surface">
              Administrator Portal
            </h2>
            <p className="mt-1 text-sm text-secondary">
              The Sniff Co. Order Tracking &amp; Fulfillment Management
            </p>
          </div>

          <div className="mt-8 bg-surface-container-lowest py-8 px-6 shadow-sm rounded-2xl sm:px-10 border border-surface-container">
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-container text-body-sm focus:outline-none focus:ring-2 focus:ring-[#104332]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-container text-body-sm focus:outline-none focus:ring-2 focus:ring-[#104332]"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#104332] hover:bg-[#0c3326] text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
              >
                {loginLoading ? 'Signing In...' : 'Sign In as Administrator'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-[#104332] text-white py-4 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
              S
            </span>
            <div>
              <h1 className="font-heading-syne font-bold text-base tracking-tight">
                The Sniff Co. — Operations &amp; Order Tracking
              </h1>
              <p className="text-[11px] text-emerald-200">
                Logged in as {adminUser?.fullName || 'Administrator'} ({adminUser?.role || 'Admin'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchOrders}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-xs font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1 flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-2xs">
            <span className="text-xs text-outline font-semibold uppercase">Total Orders</span>
            <p className="text-2xl font-bold text-on-surface mt-1">{orders.length}</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-2xs">
            <span className="text-xs text-amber-600 font-semibold uppercase">Pending</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {orders.filter((o) => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-2xs">
            <span className="text-xs text-blue-600 font-semibold uppercase">Confirmed/Packed</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PACKED').length}
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-2xs">
            <span className="text-xs text-purple-600 font-semibold uppercase">In Transit</span>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {orders.filter((o) => o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY').length}
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-2xs">
            <span className="text-xs text-emerald-600 font-semibold uppercase">Delivered</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {orders.filter((o) => o.status === 'DELIVERED').length}
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-2xs">
            <span className="text-xs text-red-600 font-semibold uppercase">Cancelled</span>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {orders.filter((o) => o.status === 'CANCELLED').length}
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-2xs">
          <div className="w-full sm:w-96 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by order #, customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-low text-body-sm focus:outline-none focus:ring-1 focus:ring-[#104332]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-semibold text-secondary whitespace-nowrap">
              Filter Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-surface-container-low text-body-sm font-semibold text-on-surface cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Order Placed)</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-sm overflow-hidden">
          {loadingOrders ? (
            <div className="p-12 text-center text-secondary">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-secondary">No orders match your filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-container-low text-xs font-bold text-outline uppercase border-b border-surface-container">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4">Carrier / Tracking</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-primary">#{ord.orderNumber}</td>
                      <td className="py-3.5 px-4 text-secondary whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">
                          {ord.customerNameSnapshot}
                        </div>
                        <div className="text-xs text-secondary">{ord.customerPhoneSnapshot}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-secondary max-w-[200px] truncate">
                        {ord.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-xs block">{ord.paymentMethod}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            ord.paymentStatus === 'CAPTURED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : ord.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-900'
                                : ord.status === 'SHIPPED' || ord.status === 'OUT_FOR_DELIVERY'
                                  ? 'bg-purple-100 text-purple-900'
                                  : ord.status === 'CONFIRMED' || ord.status === 'PACKED'
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {ord.shipment?.trackingNumber ? (
                          <div>
                            <span className="font-semibold text-on-surface block">
                              {ord.shipment.carrier}
                            </span>
                            <span className="text-primary font-mono">
                              {ord.shipment.trackingNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-outline">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openOrderManagement(ord)}
                          className="px-3.5 py-1.5 rounded-full bg-[#104332] hover:bg-[#0c3326] text-white font-semibold text-xs transition-colors shadow-2xs"
                        >
                          Manage &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Update Order Status & Tracking */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-surface-container my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                <div>
                  <h3 className="font-heading-syne text-headline-sm font-bold text-on-surface">
                    Manage Order #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')} · ₹
                    {selectedOrder.totalAmount} · {selectedOrder.paymentMethod}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-secondary transition-colors"
                >
                  &times;
                </button>
              </div>

              {updateSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-body-sm font-medium">
                  {updateSuccess}
                </div>
              )}
              {updateError && (
                <div className="mt-4 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm font-medium">
                  {updateError}
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleStatusSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                      Current Status
                    </label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-surface-container-low font-bold text-primary text-sm">
                      {selectedOrder.status}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                      Transition To Status *
                    </label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#104332]"
                    >
                      {ALLOWED_NEXT_STATUSES[selectedOrder.status]?.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      <option value={selectedOrder.status}>
                        {selectedOrder.status} (Keep Current)
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Status Update Description / Carrier Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Package dispatched from Mumbai Fulfillment Center via Delhivery"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container text-body-sm focus:outline-none focus:ring-2 focus:ring-[#104332]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                      Carrier Name
                    </label>
                    <input
                      type="text"
                      list="carrier-suggestions"
                      placeholder="e.g. Delhivery Express"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container text-body-sm focus:outline-none focus:ring-2 focus:ring-[#104332]"
                    />
                    <datalist id="carrier-suggestions">
                      {CARRIER_OPTIONS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                      Tracking / AWB Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DEL9876543210"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container text-body-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#104332]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                      External Carrier Tracking URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://delhivery.com/track/..."
                      value={carrierTrackingUrl}
                      onChange={(e) => setCarrierTrackingUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container text-body-sm focus:outline-none focus:ring-2 focus:ring-[#104332]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                      Estimated Delivery Date
                    </label>
                    <input
                      type="date"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container text-body-sm focus:outline-none focus:ring-2 focus:ring-[#104332]"
                    />
                  </div>
                </div>

                {/* COD Payment Status toggle */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-on-surface uppercase block">
                      Payment Collection ({selectedOrder.paymentMethod})
                    </span>
                    <span className="text-xs text-secondary">
                      Current payment status: <strong>{selectedOrder.paymentStatus}</strong>
                    </span>
                  </div>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-surface-container font-semibold text-xs bg-white focus:outline-none"
                  >
                    <option value="PENDING">PENDING (Uncollected)</option>
                    <option value="CAPTURED">CAPTURED (Collected/Paid)</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2.5 rounded-full border border-surface-container text-secondary text-sm font-semibold hover:bg-surface-container transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 rounded-full bg-[#104332] hover:bg-[#0c3326] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
                  >
                    {updating ? 'Saving Changes...' : 'Save & Update Tracking'}
                  </button>
                </div>
              </form>

              {/* Status History Audit Log */}
              {selectedOrder.history && selectedOrder.history.length > 0 && (
                <div className="mt-8 pt-6 border-t border-surface-container">
                  <h4 className="font-heading-syne text-title-sm font-bold text-on-surface mb-3">
                    Order Status History &amp; Audit Trail
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-surface-container-low text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-primary mr-2">{h.status}</span>
                          <span className="text-secondary">{h.note || 'No notes provided'}</span>
                          {h.carrier && (
                            <span className="text-outline block text-[11px] mt-0.5">
                              Carrier: {h.carrier} · Tracking: {h.trackingNumber || 'N/A'}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-outline block text-[10px]">
                            {new Date(h.createdAt).toLocaleString('en-IN')}
                          </span>
                          <span className="text-secondary font-medium text-[11px]">
                            {h.updatedBy || 'System'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
