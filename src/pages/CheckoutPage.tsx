import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  addressService,
  checkoutService,
  paymentService,
  CheckoutQuoteResponse,
} from '../services/storeServices';
import { ApiError } from '../services/apiClient';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartTotals,
    couponCode: activeCoupon,
    applyCouponCode,
    customer,
    authLoading,
    cartSyncError,
    retryCartMerge,
    clearCart,
  } = useStore();
  const navigate = useNavigate();

  const [contactEmail, setContactEmail] = useState(customer?.email ?? '');
  const [contactPhone, setContactPhone] = useState(customer?.phone ?? '');
  const [fullName, setFullName] = useState(customer?.fullName ?? '');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'COD'>('COD');
  const [onlinePaymentsAvailable, setOnlinePaymentsAvailable] = useState<boolean>(false);
  const [couponInput, setCouponInput] = useState(activeCoupon ?? '');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authoritative server quote state
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteSeqRef = useRef(0);
  const quoteAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!authLoading && !customer) {
      navigate('/login?redirect=/checkout', { replace: true });
    }
  }, [authLoading, customer, navigate]);

  useEffect(() => {
    paymentService
      .getConfigurationStatus()
      .then((status) => {
        setOnlinePaymentsAvailable(status.onlinePaymentsAvailable);
        if (!status.onlinePaymentsAvailable) {
          setPaymentMethod('COD');
        }
      })
      .catch(() => {
        setOnlinePaymentsAvailable(false);
        setPaymentMethod('COD');
      });
  }, []);

  useEffect(() => {
    if (customer) {
      if (!contactEmail && customer.email) setContactEmail(customer.email);
      if (!fullName) setFullName(customer.fullName);
      if (!contactPhone && customer.phone) setContactPhone(customer.phone);
    }
  }, [customer, contactEmail, fullName, contactPhone]);

  useEffect(() => {
    if (authLoading || !customer) return;
    let cancelled = false;

    addressService
      .list()
      .then((rows) => {
        if (cancelled || !Array.isArray(rows) || rows.length === 0) return;
        const typed = rows as Array<{
          isDefault?: boolean;
          recipientName?: string;
          phone?: string;
          addressLine1?: string;
          addressLine2?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
        }>;
        const chosen = typed.find((a) => a.isDefault) ?? typed[0];
        if (!chosen) return;
        setFullName((prev) => prev || chosen.recipientName || customer.fullName || '');
        setContactPhone((prev) => prev || chosen.phone || customer.phone || '');
        setAddress1((prev) => prev || chosen.addressLine1 || '');
        setAddress2((prev) => prev || chosen.addressLine2 || '');
        setCity((prev) => prev || chosen.city || '');
        setStateName((prev) => (prev === 'Maharashtra' && chosen.state ? chosen.state : prev));
        setPincode((prev) => prev || chosen.pincode || '');
      })
      .catch(() => {
        // Non-fatal: customer can enter address manually
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, customer]);

  const cartSignature = useMemo(
    () =>
      cart
        .map((item) => `${item.id}:${item.variantId ?? ''}:${item.quantity}:${item.isSubscription}`)
        .join('|'),
    [cart]
  );

  const fetchQuote = useCallback(async () => {
    if (authLoading || !customer) {
      setQuoteLoading(false);
      return;
    }

    if (cart.length === 0) {
      quoteAbortRef.current?.abort();
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    const seq = ++quoteSeqRef.current;
    quoteAbortRef.current?.abort();
    const controller = new AbortController();
    quoteAbortRef.current = controller;

    setQuoteLoading(true);
    setQuoteError(null);

    try {
      const data = await checkoutService.getQuote(
        {
          shippingMethod,
          couponCode: activeCoupon ?? undefined,
          pincode: pincode.trim().length === 6 ? pincode.trim() : undefined,
        },
        controller.signal
      );
      if (quoteSeqRef.current === seq) {
        setQuote(data);
        setQuoteError(null);
      }
    } catch (err) {
      if (controller.signal.aborted || quoteSeqRef.current !== seq) {
        return;
      }
      setQuote(null);
      setQuoteError(err instanceof ApiError ? err.message : 'Unable to retrieve verified server quote.');
    } finally {
      if (quoteSeqRef.current === seq) {
        setQuoteLoading(false);
      }
    }
  }, [authLoading, customer, cart.length, cartSignature, shippingMethod, activeCoupon, pincode]);

  // Request authoritative server quote whenever verified checkout inputs change
  useEffect(() => {
    void fetchQuote();

    return () => {
      quoteAbortRef.current?.abort();
      quoteSeqRef.current += 1;
      setQuoteLoading(false);
    };
  }, [fetchQuote]);

  const expressFee = shippingMethod === 'express' ? 99 : cartTotals.shippingCharge;
  const serverSubtotal = quote?.totals ? quote.totals.subtotal : cartTotals.subtotal;
  const serverSavings = quote?.totals ? quote.totals.totalSavings : cartTotals.totalSavings;
  const serverShipping = quote?.totals ? quote.totals.shippingCharge : expressFee;
  const serverTotal = quote?.totals
    ? quote.totals.totalAmount
    : Math.max(0, serverSubtotal - serverSavings + serverShipping);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    if (quoteLoading) {
      setErrorMsg('Please wait while your order total is verified by the server.');
      return;
    }

    if (!quote) {
      setErrorMsg('Order totals must be verified by the server before placing your order.');
      void fetchQuote();
      return;
    }

    if (!quote.isValid && quote.validationErrors.length > 0) {
      setErrorMsg(quote.validationErrors.join(' '));
      return;
    }

    if (paymentMethod !== 'COD' && !onlinePaymentsAvailable) {
      setErrorMsg(
        'Online payment is temporarily unavailable because Razorpay credentials are not configured yet. Please select Cash on Delivery (COD) to complete your order.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = (await checkoutService.createOrder({
        idempotencyKey: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        shippingAddress: {
          recipientName: fullName.trim(),
          phone: contactPhone.trim(),
          addressLine1: address1.trim(),
          addressLine2: address2.trim(),
          city: city.trim(),
          state: stateName,
          pincode: pincode.trim(),
        },
        shippingMethod,
        paymentMethod,
        couponCode: activeCoupon ?? undefined,
      })) as { id: string; orderNumber: string };

      if (paymentMethod !== 'COD') {
        try {
          await paymentService.createGatewayOrder(order.id);
        } catch (payErr) {
          if (payErr instanceof ApiError && payErr.code === 'PAYMENT_GATEWAY_NOT_CONFIGURED') {
            setErrorMsg(
              `Order ${order.orderNumber} created in PENDING status, but online payment gateway credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured in backend/.env. Use Cash on Delivery (COD) or configure Razorpay test keys.`
            );
            setSubmitting(false);
            return;
          }
          throw payErr;
        }
      }

      clearCart();
      navigate(`/order-confirmation?orderNumber=${encodeURIComponent(order.orderNumber)}`, {
        state: { order },
      });
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Unable to place order. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      <section className="w-full bg-surface-container-low py-space-sm px-margin lg:px-space-xl">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-space-sm">
          <nav className="flex items-center gap-space-xs text-label-md">
            <Link className="text-secondary hover:text-on-surface" to="/cart">
              Bag
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-bold">2 Shipping &amp; Payment</span>
          </nav>
          <div className="flex items-center gap-space-xs text-on-surface-variant text-label-md">
            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
            <span>256-bit Encrypted Checkout</span>
          </div>
        </div>
      </section>

      <section className="w-full py-space-xl px-margin lg:px-space-xl">
        <form
          onSubmit={handlePlaceOrder}
          className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start"
        >
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {cartSyncError && (
              <div className="p-4 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] text-body-sm flex items-center justify-between gap-3">
                <span>{cartSyncError}</span>
                <button
                  type="button"
                  onClick={() => void retryCartMerge()}
                  className="px-3 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold shrink-0"
                >
                  Retry Cart Sync
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container text-body-sm">
                {errorMsg}
              </div>
            )}

            {/* Step 1: Contact */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm flex items-center justify-center font-bold">
                    1
                  </span>
                  <h2 className="text-headline-sm text-on-surface">Contact Information</h2>
                </div>
                {!customer && (
                  <Link className="text-body-sm text-primary font-semibold underline" to="/login">
                    Log in
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="text-label-md text-on-surface" htmlFor="contact-email">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="parent@example.in"
                    className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="text-label-md text-on-surface" htmlFor="contact-phone">
                    Mobile Number <span className="text-error">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm flex items-center justify-center font-bold">
                  2
                </span>
                <h2 className="text-headline-sm text-on-surface">Delivery Address</h2>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="text-label-md text-on-surface" htmlFor="full-name">
                  Recipient Full Name <span className="text-error">*</span>
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="text-label-md text-on-surface" htmlFor="address-line-1">
                  Flat, House No., Building <span className="text-error">*</span>
                </label>
                <input
                  id="address-line-1"
                  type="text"
                  required
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Flat 402, Building Name"
                  className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="text-label-md text-on-surface" htmlFor="address-line-2">
                  Area, Street, Landmark <span className="text-error">*</span>
                </label>
                <input
                  id="address-line-2"
                  type="text"
                  required
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Street & Landmark"
                  className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="text-label-md text-on-surface" htmlFor="pincode-input">
                    PIN Code <span className="text-error">*</span>
                  </label>
                  <input
                    id="pincode-input"
                    maxLength={6}
                    pattern="[1-9][0-9]{5}"
                    required
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="411001"
                    className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="text-label-md text-on-surface" htmlFor="city-input">
                    City <span className="text-error">*</span>
                  </label>
                  <input
                    id="city-input"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Pune"
                    className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="text-label-md text-on-surface" htmlFor="state-select">
                    State <span className="text-error">*</span>
                  </label>
                  <select
                    id="state-select"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Shipping */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm flex items-center justify-center font-bold">
                  3
                </span>
                <h2 className="text-headline-sm text-on-surface">Shipping Method</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <button
                  type="button"
                  onClick={() => setShippingMethod('standard')}
                  className={`text-left p-space-md rounded-xl bg-surface-container-low ${
                    shippingMethod === 'standard' ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-title-sm text-on-surface">Standard Road Freight</span>
                    <span className="text-label-md font-bold text-primary">
                      {cartTotals.shippingCharge === 0 ? 'FREE' : `₹${cartTotals.shippingCharge}`}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    2–3 business days · Free above ₹499
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingMethod('express')}
                  className={`text-left p-space-md rounded-xl bg-surface-container-low ${
                    shippingMethod === 'express' ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-title-sm text-on-surface">Priority Express</span>
                    <span className="text-title-sm font-bold text-on-surface">₹99</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Dispatched within 4 hours
                  </p>
                </button>
              </div>
            </div>

            {/* Step 4: Payment */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm flex items-center justify-center font-bold">
                  4
                </span>
                <h2 className="text-headline-sm text-on-surface">Payment Method</h2>
              </div>
              {onlinePaymentsAvailable ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { id: 'UPI', label: 'UPI (Razorpay)' },
                      { id: 'CARD', label: 'Cards' },
                      { id: 'NETBANKING', label: 'Net Banking' },
                      { id: 'COD', label: 'Cash on Delivery' },
                    ] as const
                  ).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm.id);
                        setErrorMsg(null);
                      }}
                      className={`p-3 rounded-xl text-label-md font-bold text-center ${
                        paymentMethod === pm.id
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-container-low ring-2 ring-primary flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      payments
                    </span>
                    <div>
                      <p className="text-title-sm text-on-surface font-bold">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-body-sm text-secondary">
                        Pay via cash or UPI QR when your courier arrives. Online payments are not
                        enabled yet.
                      </p>
                    </div>
                  </div>
                  <span className="bg-primary text-on-primary text-label-sm px-2.5 py-1 rounded-full font-bold shrink-0">
                    Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-24">
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm text-on-surface">Order Summary</h2>
                <span className="text-label-sm uppercase text-secondary">
                  {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {cart.map((item) => {
                const lineBase = item.unitPrice * item.quantity;
                const lineFinal = item.isSubscription ? Math.round(lineBase * 0.85) : lineBase;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-space-md bg-surface-container-low/50 p-space-sm rounded-xl"
                  >
                    <img
                      className="w-16 h-16 rounded-lg object-cover bg-white shrink-0"
                      alt={item.name}
                      src={item.image}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3 className="text-title-sm text-on-surface truncate">{item.name}</h3>
                        <span className="text-title-sm font-bold text-on-surface">
                          ₹{lineFinal}
                        </span>
                      </div>
                      <p className="text-body-sm text-secondary">
                        {item.variantLabel} · Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-surface-container-low px-space-md py-space-sm rounded-lg text-body-sm uppercase"
                    placeholder="Promo code"
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      setCouponError(null);
                      try {
                        await applyCouponCode(couponInput.trim());
                      } catch (err) {
                        setCouponError(err instanceof ApiError ? err.message : 'Invalid coupon code');
                      }
                    }}
                    className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg text-label-md"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-error">{couponError}</p>}
              </div>

              {quote?.validationErrors && quote.validationErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-body-sm flex flex-col gap-1">
                  <div className="flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>Order Validation Warning</span>
                  </div>
                  {quote.validationErrors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}

              {quoteError && !quoteLoading && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-label-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{quoteError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void fetchQuote()}
                    className="px-2.5 py-1 rounded-md bg-primary text-on-primary text-xs font-semibold shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-space-xs text-body-md text-secondary">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {quoteLoading
                      ? 'Calculating...'
                      : !quote
                        ? '—'
                        : `₹${serverSubtotal.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {quote && !quoteLoading && serverSavings > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Discounts</span>
                    <span>- ₹{serverSavings}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {quoteLoading
                      ? 'Calculating...'
                      : !quote
                        ? '—'
                        : serverShipping === 0
                          ? 'FREE'
                          : `₹${serverShipping}`}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-surface-container text-on-surface font-bold text-title-md items-center">
                  <span>Total Payable</span>
                  <div className="flex items-center gap-2">
                    {quoteLoading ? (
                      <span className="text-label-xs text-secondary italic">Calculating...</span>
                    ) : !quote ? (
                      <span className="text-label-sm text-error">Unavailable</span>
                    ) : (
                      <span>₹{serverTotal.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  cart.length === 0 ||
                  quoteLoading ||
                  !quote ||
                  !quote.isValid
                }
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 px-space-lg rounded-full text-title-sm flex items-center justify-center gap-space-sm transition-all shadow-md disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? 'Processing Order...'
                    : quoteLoading
                      ? 'Calculating Total...'
                      : !quote
                        ? 'Quote Verification Required'
                        : `Place Order · ₹${serverTotal.toLocaleString('en-IN')}`}
                </span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};
