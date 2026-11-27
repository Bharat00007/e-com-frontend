import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  addressService,
  orderService,
  subscriptionService,
  OrderTrackingData,
} from '../services/storeServices';

type AccountTab = 'dashboard' | 'subscriptions' | 'orders' | 'addresses' | 'wishlist' | 'tracking';

interface ApiOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ id: string; productName: string; packSizeLabel: string; quantity: number }>;
}

interface ApiAddress {
  id: string;
  label: string;
  recipientName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface ApiSubscription {
  id: string;
  status: string;
  discountPercent: number;
  nextDeliveryDate: string;
  plan: { name: string; frequencyWeeks: number };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string; images?: Array<{ url: string }> };
    variant: { packSizeLabel: string };
  }>;
}

export const AccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    products,
    wishlist,
    addToCart,
    removeFromWishlist,
    setIsCartDrawerOpen,
    customer,
    authLoading,
    logout,
  } = useStore();
  const [activeTab, setActiveTab] = useState<AccountTab>(
    (searchParams.get('tab') as AccountTab) || 'dashboard'
  );
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<OrderTrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Maharashtra');
  const [addrPin, setAddrPin] = useState('');

  const handleViewTracking = async (orderNumber: string) => {
    try {
      setTrackingLoading(true);
      setTrackingError(null);
      const data = await orderService.getTracking(orderNumber);
      setSelectedTracking(data);
      setActiveTab('tracking');
    } catch {
      setTrackingError('Unable to load tracking details for order #' + orderNumber);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    const trackNum = searchParams.get('track') || searchParams.get('orderNumber');
    if (trackNum && customer) {
      void handleViewTracking(trackNum);
    }
  }, [searchParams, customer]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addressService.create({
        label: addrLabel.trim() || 'Home',
        recipientName: addrRecipient.trim(),
        phone: addrPhone.trim(),
        addressLine1: addrLine1.trim(),
        addressLine2: addrLine2.trim(),
        city: addrCity.trim(),
        state: addrState.trim(),
        pincode: addrPin.trim(),
        isDefault: addresses.length === 0,
      });
      const updated = (await addressService.list()) as ApiAddress[];
      setAddresses(updated);
      setShowAddAddress(false);
      setAddrRecipient('');
      setAddrPhone('');
      setAddrLine1('');
      setAddrLine2('');
      setAddrCity('');
      setAddrPin('');
      notify('Address saved.');
    } catch {
      notify('Please verify all address fields (including 6-digit PIN code).');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressService.remove(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      notify('Address removed.');
    } catch {
      notify('Unable to remove address.');
    }
  };

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    if (!customer) return;
    let active = true;
    setDataLoading(true);
    (async () => {
      try {
        const [ords, addrs, subs] = await Promise.all([
          orderService.getMyOrders() as Promise<ApiOrder[]>,
          addressService.list() as Promise<ApiAddress[]>,
          subscriptionService.getMine() as Promise<ApiSubscription[]>,
        ]);
        if (!active) return;
        setOrders(ords);
        setAddresses(addrs);
        setSubscriptions(subs);
      } catch {
        // Ignore if session expired
      } finally {
        if (active) setDataLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [customer]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="h-48 bg-surface-container-low rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-surface min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-[42px] text-primary-container mb-3">
            lock
          </span>
          <h1 className="text-headline-md text-primary mb-2">Sign in to view your account</h1>
          <p className="text-body-md text-secondary mb-6">
            Access your orders, saved addresses, wishlist, and Subscribe &amp; Save deliveries.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3.5 px-6 rounded-full bg-primary text-on-primary text-title-sm font-semibold hover:bg-tertiary transition-colors"
          >
            Sign In / Create Account
          </Link>
        </div>
      </div>
    );
  }

  const initials = customer.fullName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleSubAction = async (id: string, action: 'pause' | 'resume' | 'skip' | 'cancel') => {
    try {
      await subscriptionService[action](id);
      const updated = (await subscriptionService.getMine()) as ApiSubscription[];
      setSubscriptions(updated);
      notify(`Subscription ${action}d.`);
    } catch {
      notify('Unable to update subscription.');
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-16">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3 rounded-full shadow-xl text-label-md flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary-fixed">
            check_circle
          </span>
          <span>{toast}</span>
        </div>
      )}

      {/* Customer Profile Overview */}
      <section className="bg-surface relative overflow-hidden pt-space-xl pb-space-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-space-lg">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full text-primary">
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
                <span className="text-label-sm uppercase tracking-wider">Account Active</span>
              </div>
              <h1 className="text-display-hero-mobile sm:text-headline-lg text-primary tracking-tight">
                Welcome back, {customer.fullName}
              </h1>
              <p className="text-body-md text-on-surface-variant flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{subscriptions.filter((s) => s.status === 'ACTIVE').length} Active Subscriptions</span>
                <span className="text-outline-variant">•</span>
                <span>{orders.length} Orders</span>
                <span className="text-outline-variant">•</span>
                <span>{addresses.length} Saved Addresses</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Portal Interface */}
      <section className="bg-surface py-space-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Sidebar */}
            <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col">
                <div className="px-3 py-2 pb-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-title-md">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-title-sm text-on-surface truncate">{customer.fullName}</p>
                    <p className="text-body-sm text-secondary truncate">{customer.email || customer.phone}</p>
                  </div>
                </div>

                <nav className="flex flex-col space-y-1">
                  {[
                    { id: 'dashboard' as const, label: 'Overview & Dashboard', icon: 'dashboard' },
                    {
                      id: 'subscriptions' as const,
                      label: 'My Subscriptions',
                      icon: 'autorenew',
                      badge: `${subscriptions.length}`,
                    },
                    {
                      id: 'orders' as const,
                      label: 'Order History',
                      icon: 'receipt_long',
                      badge: `${orders.length}`,
                    },
                    ...(selectedTracking
                      ? [
                          {
                            id: 'tracking' as const,
                            label: `Track #${selectedTracking.orderNumber}`,
                            icon: 'local_shipping',
                            badge: selectedTracking.currentStatus,
                          },
                        ]
                      : []),
                    { id: 'addresses' as const, label: 'Saved Addresses', icon: 'pin_drop' },
                    {
                      id: 'wishlist' as const,
                      label: 'My Wishlist',
                      icon: 'favorite',
                      badge: `${wishlistedProducts.length}`,
                    },
                  ].map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-title-sm transition-colors ${
                          active
                            ? 'bg-surface-container text-primary'
                            : 'hover:bg-surface-container-low text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-xl ${
                              active ? 'text-primary' : 'text-secondary'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {'badge' in item && item.badge && (
                          <span className="bg-surface-container text-secondary text-label-sm px-2.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-4 pt-3 flex items-center justify-between px-3.5 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={logout}
                    className="text-secondary hover:text-error transition-colors flex items-center gap-2 text-body-sm"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Content Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {dataLoading ? (
                <div className="h-48 bg-surface-container-lowest rounded-2xl animate-pulse" />
              ) : (
                <>
                  {(activeTab === 'dashboard' || activeTab === 'subscriptions') && (
                    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
                      <h2 className="text-headline-sm text-primary mb-4">My Subscriptions</h2>
                      {subscriptions.length === 0 ? (
                        <div className="p-6 rounded-xl bg-surface-container-low text-center">
                          <p className="text-body-md text-secondary mb-3">
                            No active subscriptions.
                          </p>
                          <Link
                            to="/product/clumping-cat-litter"
                            className="inline-block px-5 py-2.5 rounded-full bg-primary text-on-primary text-label-md font-bold"
                          >
                            Explore Subscribe &amp; Save (15% Off)
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {subscriptions.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-label-sm uppercase px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-bold">
                                  {sub.status}
                                </span>
                                <span className="text-body-sm text-secondary">
                                  {sub.plan.name} · Next delivery:{' '}
                                  {new Date(sub.nextDeliveryDate).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                              {sub.items.map((it) => (
                                <div key={it.id} className="text-title-sm text-on-surface">
                                  {it.product.name} ({it.variant.packSizeLabel}) × {it.quantity}
                                </div>
                              ))}
                              <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleSubAction(sub.id, 'skip')}
                                  className="px-3.5 py-1.5 rounded-full bg-white text-on-surface text-label-md font-semibold"
                                >
                                  Skip Next
                                </button>
                                {sub.status === 'ACTIVE' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSubAction(sub.id, 'pause')}
                                    className="px-3.5 py-1.5 rounded-full bg-white text-on-surface text-label-md font-semibold"
                                  >
                                    Pause
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSubAction(sub.id, 'resume')}
                                    className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-label-md font-semibold"
                                  >
                                    Resume
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(activeTab === 'dashboard' || activeTab === 'orders') && (
                    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
                      <h2 className="text-headline-sm text-primary mb-4">Order History</h2>
                      {orders.length === 0 ? (
                        <div className="p-6 rounded-xl bg-surface-container-low text-center">
                          <p className="text-body-md text-secondary">No orders found.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {orders.map((ord) => (
                            <div
                              key={ord.id}
                              className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/order-confirmation?orderNumber=${encodeURIComponent(ord.orderNumber)}`}
                                    className="text-title-sm text-primary font-bold hover:underline"
                                  >
                                    #{ord.orderNumber}
                                  </Link>
                                  <span className="bg-tertiary-fixed text-on-tertiary-fixed text-label-sm px-2.5 py-0.5 rounded-full font-semibold">
                                    {ord.status}
                                  </span>
                                </div>
                                <p className="text-body-sm text-secondary mt-1">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN')} ·{' '}
                                  {ord.items.map((i) => `${i.productName} (${i.packSizeLabel})`).join(', ')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-title-md text-primary font-bold mr-2">
                                  ₹{ord.totalAmount.toLocaleString('en-IN')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleViewTracking(ord.orderNumber)}
                                  className="px-3.5 py-1.5 rounded-full bg-[#104332] hover:bg-[#0c3326] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                                  <span>Track Order</span>
                                </button>
                                <Link
                                  to={`/order-confirmation?orderNumber=${encodeURIComponent(ord.orderNumber)}`}
                                  className="text-label-sm font-semibold text-secondary hover:text-primary underline px-2 py-1"
                                >
                                  Invoice
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'addresses' && (
                    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-headline-sm text-primary">Saved Addresses</h2>
                        <button
                          type="button"
                          onClick={() => setShowAddAddress((v) => !v)}
                          className="px-4 py-2 rounded-full bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors"
                        >
                          {showAddAddress ? 'Cancel' : '+ Add Address'}
                        </button>
                      </div>

                      {showAddAddress && (
                        <form
                          onSubmit={handleCreateAddress}
                          className="mb-6 p-4 rounded-xl bg-surface-container-low grid grid-cols-1 md:grid-cols-2 gap-3"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Label (e.g., Home, Work)"
                            value={addrLabel}
                            onChange={(e) => setAddrLabel(e.target.value)}
                            className="px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Recipient full name"
                            value={addrRecipient}
                            onChange={(e) => setAddrRecipient(e.target.value)}
                            className="px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <input
                            type="tel"
                            required
                            placeholder="Mobile number"
                            value={addrPhone}
                            onChange={(e) => setAddrPhone(e.target.value)}
                            className="px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            pattern="[0-9]{6}"
                            placeholder="6-digit PIN code"
                            value={addrPin}
                            onChange={(e) => setAddrPin(e.target.value)}
                            className="px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Flat, House No., Building"
                            value={addrLine1}
                            onChange={(e) => setAddrLine1(e.target.value)}
                            className="md:col-span-2 px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Area, Street, Landmark"
                            value={addrLine2}
                            onChange={(e) => setAddrLine2(e.target.value)}
                            className="md:col-span-2 px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <input
                            type="text"
                            required
                            placeholder="City"
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            className="px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <input
                            type="text"
                            required
                            placeholder="State"
                            value={addrState}
                            onChange={(e) => setAddrState(e.target.value)}
                            className="px-3.5 py-2.5 rounded-lg bg-white text-body-sm"
                          />
                          <button
                            type="submit"
                            className="md:col-span-2 py-2.5 rounded-full bg-primary-container text-on-primary text-title-sm font-semibold hover:bg-primary transition-colors"
                          >
                            Save Address
                          </button>
                        </form>
                      )}

                      {addresses.length === 0 ? (
                        <p className="text-body-md text-secondary">No saved addresses yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((a) => (
                            <div
                              key={a.id}
                              className="p-5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-label-sm uppercase bg-primary text-on-primary px-2.5 py-0.5 rounded-full font-bold">
                                    {a.label}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAddress(a.id)}
                                    className="text-label-sm text-error hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <h3 className="text-title-md text-on-surface mt-3">
                                  {a.recipientName}
                                </h3>
                                <p className="text-body-sm text-on-surface-variant mt-1">
                                  {a.addressLine1}, {a.addressLine2}, {a.city}, {a.state} {a.pincode}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'tracking' && (
                    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container">
                        <div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('orders')}
                            className="text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1 mb-2"
                          >
                            &larr; Back to Order History
                          </button>
                          <h2 className="font-heading-syne text-headline-sm font-bold text-on-surface">
                            Order #{selectedTracking?.orderNumber} Tracking
                          </h2>
                          <p className="text-xs text-secondary mt-0.5">
                            Placed on{' '}
                            {selectedTracking
                              ? new Date(selectedTracking.createdAt).toLocaleString('en-IN')
                              : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                              selectedTracking?.currentStatus === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-900'
                                : selectedTracking?.currentStatus === 'CANCELLED'
                                  ? 'bg-red-100 text-red-900'
                                  : 'bg-primary-fixed text-on-primary-fixed'
                            }`}
                          >
                            {selectedTracking?.currentStatus}
                          </span>
                        </div>
                      </div>

                      {trackingLoading ? (
                        <div className="space-y-4 py-8">
                          <div className="h-6 bg-surface-container-low rounded-xl animate-pulse" />
                          <div className="h-32 bg-surface-container-low rounded-2xl animate-pulse" />
                        </div>
                      ) : trackingError ? (
                        <div className="p-4 rounded-xl bg-error-container text-on-error-container text-body-sm">
                          {trackingError}
                        </div>
                      ) : selectedTracking ? (
                        <>
                          {/* Exceptional Terminal State Banner */}
                          {selectedTracking.isTerminal && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-body-sm flex items-center gap-3">
                              <span className="material-symbols-outlined text-red-600">cancel</span>
                              <div>
                                <p className="font-bold">Order {selectedTracking.currentStatus}</p>
                                <p className="text-xs text-red-700">
                                  {selectedTracking.terminalReason ||
                                    'This order has been cancelled.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Visual Order Progress Tracker / Stepper */}
                          <div
                            className="bg-surface-container-low rounded-2xl p-6 border border-surface-container"
                            data-purpose="tracking-timeline-stepper"
                          >
                            <h3 className="font-heading-syne text-title-md font-bold text-on-surface mb-6">
                              Delivery Progress
                            </h3>

                            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[15px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-container-highest">
                              {selectedTracking.steps.map((step, idx) => {
                                const isDone = step.isCompleted;
                                const isCurr = step.isCurrent;

                                return (
                                  <div key={step.status} className="relative flex items-start gap-4">
                                    {/* Timeline Node Icon */}
                                    <div
                                      className={`absolute -left-[27px] sm:-left-[31px] w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                                        isDone
                                          ? 'bg-[#104332] text-white shadow-2xs'
                                          : isCurr
                                            ? 'bg-[#104332] text-white ring-4 ring-[#104332]/20 shadow-sm animate-pulse'
                                            : 'bg-surface-container-highest text-outline'
                                      }`}
                                    >
                                      {isDone ? (
                                        <span className="material-symbols-outlined text-[16px] font-bold">
                                          check
                                        </span>
                                      ) : (
                                        <span className="text-[11px] font-bold">{idx + 1}</span>
                                      )}
                                    </div>

                                    {/* Step Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <h4
                                          className={`text-title-sm font-bold ${
                                            isCurr
                                              ? 'text-primary'
                                              : isDone
                                                ? 'text-on-surface'
                                                : 'text-secondary'
                                          }`}
                                        >
                                          {step.label}
                                        </h4>
                                        {step.timestamp && (
                                          <span className="text-[11px] text-outline font-medium">
                                            {new Date(step.timestamp).toLocaleString('en-IN', {
                                              day: '2-digit',
                                              month: 'short',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-body-sm text-secondary mt-0.5 leading-relaxed">
                                        {step.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Shipment, Delivery & Carrier Details Card */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
                              <div>
                                <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-2">
                                  Shipping &amp; Carrier Information
                                </span>
                                <p className="text-title-sm font-bold text-on-surface">
                                  {selectedTracking.shipment?.carrier || 'Delhivery Express'}
                                </p>
                                <p className="text-body-sm text-secondary mt-1">
                                  Tracking Number:{' '}
                                  <strong className="text-primary font-mono">
                                    {selectedTracking.shipment?.trackingNumber ||
                                      'Awaiting fulfillment dispatch'}
                                  </strong>
                                </p>
                                {selectedTracking.shipment?.estimatedDelivery && (
                                  <p className="text-body-sm text-emerald-800 font-medium mt-1">
                                    Estimated Delivery:{' '}
                                    {new Date(
                                      selectedTracking.shipment.estimatedDelivery
                                    ).toLocaleDateString('en-IN', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </p>
                                )}
                              </div>

                              {selectedTracking.shipment?.carrierTrackingUrl && (
                                <a
                                  href={selectedTracking.shipment.carrierTrackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-surface-container text-primary text-xs font-semibold hover:bg-surface-container transition-colors w-max"
                                >
                                  <span>Track on Courier Site</span>
                                  <span className="material-symbols-outlined text-[14px]">
                                    open_in_new
                                  </span>
                                </a>
                              )}
                            </div>

                            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
                              <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-2">
                                Delivery Address
                              </span>
                              <p className="text-title-sm font-bold text-on-surface">
                                {selectedTracking.shippingAddress?.recipientName}
                              </p>
                              <p className="text-body-sm text-secondary mt-1 leading-relaxed">
                                {selectedTracking.shippingAddress?.addressLine1}
                                {selectedTracking.shippingAddress?.addressLine2
                                  ? `, ${selectedTracking.shippingAddress.addressLine2}`
                                  : ''}
                                <br />
                                {selectedTracking.shippingAddress?.city},{' '}
                                {selectedTracking.shippingAddress?.state} —{' '}
                                <strong className="text-on-surface">
                                  {selectedTracking.shippingAddress?.pincode}
                                </strong>
                              </p>
                              <p className="text-xs text-secondary mt-2">
                                Contact: {selectedTracking.shippingAddress?.phone}
                              </p>
                            </div>
                          </div>

                          {/* Payment & Items Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container md:col-span-1">
                              <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-2">
                                Payment Method
                              </span>
                              <p className="text-title-sm font-bold text-on-surface">
                                {selectedTracking.paymentMethod === 'COD'
                                  ? 'Cash on Delivery (COD)'
                                  : selectedTracking.paymentMethod}
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                    selectedTracking.paymentStatus === 'CAPTURED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  Payment {selectedTracking.paymentStatus}
                                </span>
                              </div>
                              {selectedTracking.paymentMethod === 'COD' &&
                                selectedTracking.paymentStatus === 'PENDING' && (
                                  <p className="text-xs text-secondary mt-3 leading-relaxed">
                                    Please keep ₹{selectedTracking.totalAmount} ready in exact cash
                                    or UPI upon delivery.
                                  </p>
                                )}
                            </div>

                            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container md:col-span-2">
                              <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-2">
                                Package Contents ({selectedTracking.items.length}{' '}
                                {selectedTracking.items.length === 1 ? 'item' : 'items'})
                              </span>
                              <div className="divide-y divide-surface-container">
                                {selectedTracking.items.map((it) => (
                                  <div
                                    key={it.id}
                                    className="py-2 flex items-center justify-between text-body-sm"
                                  >
                                    <div>
                                      <p className="font-semibold text-on-surface">
                                        {it.productName}
                                      </p>
                                      <span className="text-xs text-secondary">
                                        {it.packSizeLabel} &times; {it.quantity}
                                      </span>
                                    </div>
                                    <span className="font-bold text-primary">
                                      ₹{it.lineTotal.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-3 mt-2 border-t border-surface-container flex justify-between items-center text-title-sm font-bold text-on-surface">
                                <span>Total Amount</span>
                                <span>₹{selectedTracking.totalAmount.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}

                  {activeTab === 'wishlist' && (
                    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
                      <div className="flex items-center justify-between mb-6 pb-3 border-b border-surface-container">
                        <h2 className="text-headline-sm text-primary font-bold">
                          Saved Pet Essentials
                        </h2>
                        <Link
                          to="/wishlist"
                          className="text-label-md font-semibold text-primary hover:underline"
                        >
                          View Full Wishlist Page &rarr;
                        </Link>
                      </div>

                      {wishlistedProducts.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-body-md text-secondary mb-4">
                            Your wishlist is currently empty.
                          </p>
                          <Link
                            to="/shop"
                            className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#104332] text-white text-xs font-semibold hover:bg-[#0c3326] transition-colors"
                          >
                            Explore Pet Essentials
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {wishlistedProducts.map((p) => (
                            <div
                              key={p.id}
                              className="p-4 rounded-2xl bg-surface-container-low flex flex-col justify-between gap-3 border border-surface-container relative group"
                            >
                              <button
                                type="button"
                                aria-label="Remove from wishlist"
                                onClick={() => removeFromWishlist(p.id)}
                                className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/90 text-error hover:bg-error-container hover:text-on-error-container flex items-center justify-center transition-colors shadow-2xs"
                              >
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  favorite
                                </span>
                              </button>

                              <Link to={`/product/${p.slug}`}>
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-36 object-contain rounded-xl bg-white p-2"
                                />
                              </Link>

                              <div>
                                <Link to={`/product/${p.slug}`}>
                                  <p className="text-title-sm text-on-surface font-bold hover:text-primary transition-colors">
                                    {p.shortName}
                                  </p>
                                </Link>
                                <p className="text-xs text-secondary mt-0.5 line-clamp-1">
                                  {p.subtitle}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-title-sm text-primary font-bold">
                                    ₹{p.price.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[11px] text-outline">{p.unitLabel}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container">
                                <Link
                                  to={`/product/${p.slug}`}
                                  className="py-2 text-center rounded-full border border-surface-container-high text-xs font-semibold text-secondary hover:bg-surface-container transition-colors"
                                >
                                  Details
                                </Link>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await addToCart(p);
                                    setIsCartDrawerOpen(true);
                                    notify(`${p.shortName} added to cart.`);
                                  }}
                                  className="py-2 rounded-full bg-[#104332] hover:bg-[#0c3326] text-white text-xs font-semibold transition-colors shadow-2xs"
                                >
                                  Add to Bag
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
