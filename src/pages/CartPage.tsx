import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { shippingService } from '../services/storeServices';
import { ApiError } from '../services/apiClient';
import { CircularLoader } from '../components/ui/CircularLoader';

export const CartPage: React.FC = () => {
  const {
    products,
    cart,
    cartCount,
    couponCode: activeCoupon,
    cartTotals,
    customer,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleItemSubscription,
    applyCouponCode,
    isItemUpdating,
  } = useStore();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [editingPin, setEditingPin] = useState(false);
  const [pinStatus, setPinStatus] = useState<string | null>(null);
  const [isProceedingToCheckout, setIsProceedingToCheckout] = useState(false);

  const handleProceedToCheckout = () => {
    if (isProceedingToCheckout) return;
    setIsProceedingToCheckout(true);
    const target = customer ? '/checkout' : '/login?redirect=/checkout';
    setTimeout(() => {
      navigate(target);
    }, 120);
  };
  const [cartError, setCartError] = useState<string | null>(null);

  const handleQtyChange = async (itemId: string, delta: number) => {
    setCartError(null);
    try {
      await updateQuantity(itemId, delta);
    } catch (err) {
      setCartError(err instanceof ApiError ? err.message : 'Unable to update item quantity.');
    }
  };

  const dryShampoo = products.find((p) => p.slug === 'waterless-dry-foam-shampoo');
  const progressPercent = Math.min(100, Math.round((cartTotals.subtotal / 499) * 100));

  const handleApplyCoupon = async () => {
    setCouponError(null);
    try {
      await applyCouponCode(couponInput.trim());
    } catch (err) {
      setCouponError(err instanceof ApiError ? err.message : 'Invalid coupon code');
    }
  };

  const handleCheckPincode = async () => {
    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      setPinStatus('Enter a valid 6-digit Indian PIN code.');
      return;
    }
    try {
      const res = await shippingService.checkPincode(pincode.trim());
      setPinStatus(
        res.serviceable
          ? `Estimated delivery to ${res.pincode}: ${res.estimatedDays}`
          : `PIN code ${res.pincode} is not serviceable.`
      );
      setEditingPin(false);
    } catch {
      setPinStatus('Unable to check PIN code.');
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* Top Status Bar */}
      <section className="w-full bg-surface-container-low py-space-sm px-margin">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs text-label-md text-on-surface-variant">
            <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span>Free delivery above ₹499 · Cash on delivery available</span>
          </div>
          <div className="flex items-center gap-space-md">
            <Link
              className="text-label-md text-secondary hover:text-on-surface transition-colors flex items-center gap-1"
              to="/shop"
            >
              <span>Continue Shopping</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Shopping Cart Layout */}
      <section className="w-full py-space-xl px-margin">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-lg gap-space-md">
            <div>
              <nav className="flex items-center gap-space-xs text-label-md text-secondary pb-space-xs">
                <Link className="hover:text-on-surface transition-colors" to="/">
                  Home
                </Link>
                <span>/</span>
                <span className="text-on-surface font-semibold">Your Bag</span>
              </nav>
              <h1 className="text-headline-lg font-normal text-on-surface tracking-tight">
                Your Cart{' '}
                <span className="text-body-md text-secondary align-middle ml-2 font-normal">
                  ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-space-md bg-surface-container-low px-4 py-2 rounded-full w-max">
              <span className="flex items-center gap-1.5 text-label-md font-bold text-primary">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">
                  1
                </span>
                Bag
              </span>
              <span className="w-6 h-[1px] bg-outline-variant" />
              <span className="flex items-center gap-1.5 text-label-md text-secondary">
                <span className="w-5 h-5 rounded-full bg-surface-variant text-secondary flex items-center justify-center text-[10px]">
                  2
                </span>
                Shipping
              </span>
              <span className="w-6 h-[1px] bg-outline-variant" />
              <span className="flex items-center gap-1.5 text-label-md text-secondary">
                <span className="w-5 h-5 rounded-full bg-surface-variant text-secondary flex items-center justify-center text-[10px]">
                  3
                </span>
                Payment
              </span>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="bg-surface-container-lowest p-12 rounded-2xl shadow-sm text-center">
              <h2 className="text-headline-md text-primary mb-3">Your cart is empty</h2>
              <p className="text-body-md text-secondary mb-6">
                Explore our low-dust activated carbon litter and gentle botanical grooming
                essentials.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-7 py-3.5 rounded-full text-title-sm hover:bg-primary transition-colors"
              >
                Shop All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              {/* LEFT COLUMN */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                {/* Free Shipping Progress Card */}
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                        <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                      </div>
                      <p className="text-title-sm text-on-surface">
                        {cartTotals.subtotal >= 499 ? (
                          <>
                            <span className="font-bold text-primary">Free delivery unlocked!</span>{' '}
                            You&apos;re getting free shipping anywhere in India.
                          </>
                        ) : (
                          <>
                            Add ₹{499 - cartTotals.subtotal} more to unlock free shipping across
                            India.
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-label-md font-bold text-primary-container bg-primary-fixed px-2.5 py-0.5 rounded-full shrink-0">
                      {progressPercent}% Achieved
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-primary-container h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="flex flex-col gap-space-md">
                  {cartError && (
                    <div className="p-3 rounded-xl bg-error-container text-on-error-container text-body-sm">
                      {cartError}
                    </div>
                  )}
                  {cart.map((item) => {
                    const lineBase = item.unitPrice * item.quantity;
                    const lineFinal = item.isSubscription ? Math.round(lineBase * 0.85) : lineBase;
                    return (
                      <div
                        key={item.id}
                        className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-lg shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row gap-space-md">
                          <div className="relative w-full sm:w-32 h-36 sm:h-32 bg-surface-container-low rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              className="object-cover w-full h-full"
                              alt={item.name}
                              src={item.image}
                            />
                            <span className="absolute top-2 left-2 bg-on-secondary-fixed text-surface-container-lowest text-label-sm uppercase px-2 py-0.5 rounded-full">
                              {item.variantLabel}
                            </span>
                          </div>

                          <div className="flex flex-col justify-between flex-grow gap-space-sm">
                            <div>
                              <div className="flex items-start justify-between gap-space-sm">
                                <div>
                                  <span className="text-label-md text-on-tertiary-fixed-variant font-semibold tracking-wider uppercase">
                                    Natural Formula
                                  </span>
                                  <h2 className="text-headline-sm text-on-surface font-normal">
                                    {item.name}
                                  </h2>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-title-md font-bold text-on-surface">
                                    ₹{lineFinal.toLocaleString('en-IN')}
                                  </div>
                                  {item.isSubscription ? (
                                    <div className="text-body-sm text-secondary line-through">
                                      ₹{lineBase.toLocaleString('en-IN')}
                                    </div>
                                  ) : (
                                    <div className="text-body-sm text-secondary">
                                      ₹{item.unitPrice} each
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-space-xs mt-2">
                                <span className="bg-surface-container px-2.5 py-0.5 rounded-full text-label-md text-on-surface-variant font-medium">
                                  Pack size: {item.variantLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleItemSubscription(item.id)}
                                  className={
                                    item.isSubscription
                                      ? 'bg-primary-container text-on-primary px-2.5 py-0.5 rounded-full text-label-sm font-semibold flex items-center gap-1'
                                      : 'bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full text-label-md font-medium hover:bg-surface-container-high'
                                  }
                                >
                                  <span className="material-symbols-outlined text-[13px]">
                                    autorenew
                                  </span>
                                  {item.isSubscription
                                    ? `Deliver every ${item.frequencyWeeks ?? 4} weeks · Save 15%`
                                    : 'Switch to Subscribe & Save 15%'}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-space-xs">
                              <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1 gap-space-sm">
                                <button
                                  type="button"
                                  aria-label="Decrease quantity"
                                  disabled={isItemUpdating(item.id)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQtyChange(item.id, -1);
                                  }}
                                  className="w-6 h-6 rounded-full hover:bg-surface flex items-center justify-center text-on-surface text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  −
                                </button>
                                <span className="text-title-sm px-1.5 text-on-surface font-semibold min-w-[20px] text-center inline-flex items-center justify-center">
                                  {isItemUpdating(item.id) ? (
                                    <CircularLoader size="xs" color="primary" label="Updating quantity..." />
                                  ) : (
                                    item.quantity
                                  )}
                                </span>
                                <button
                                  type="button"
                                  aria-label="Increase quantity"
                                  disabled={isItemUpdating(item.id)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQtyChange(item.id, 1);
                                  }}
                                  className="w-6 h-6 rounded-full hover:bg-surface flex items-center justify-center text-on-surface text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                disabled={isItemUpdating(item.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
                                }}
                                className="text-body-sm text-error hover:opacity-80 flex items-center gap-1 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete_outline
                                </span>
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pincode Delivery Estimator */}
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-sm flex-1">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                    </div>
                    <div className="flex-1">
                      {editingPin || !pinStatus ? (
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit PIN code"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="text-title-sm text-on-surface border-b border-primary focus:outline-none w-full max-w-[200px]"
                        />
                      ) : (
                        <p className="text-title-sm text-on-surface">{pinStatus}</p>
                      )}
                      {pinStatus && editingPin && (
                        <p className="text-body-sm text-secondary mt-0.5">{pinStatus}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckPincode}
                    className="text-label-md uppercase tracking-wider text-primary font-bold hover:underline shrink-0"
                  >
                    Check Delivery
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-28">
                <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex items-center justify-between pb-space-xs">
                    <h2 className="text-headline-sm text-on-surface font-medium">Order Summary</h2>
                    <span className="text-label-md text-secondary">INR (₹)</span>
                  </div>

                  <div className="flex flex-col gap-space-xs text-body-md text-on-surface-variant">
                    <div className="flex justify-between items-center">
                      <span>Items Subtotal ({cartCount} units)</span>
                      <span className="text-on-surface font-semibold">
                        ₹{cartTotals.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {cartTotals.subscriptionDiscount > 0 && (
                      <div className="flex justify-between items-center text-primary-container">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">loyalty</span>
                          Subscription Benefit (15%)
                        </span>
                        <span className="font-semibold">-₹{cartTotals.subscriptionDiscount}</span>
                      </div>
                    )}
                    {cartTotals.couponDiscount > 0 && (
                      <div className="flex justify-between items-center text-primary-container">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">redeem</span>
                          Coupon ({activeCoupon})
                        </span>
                        <span className="font-semibold">-₹{cartTotals.couponDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>Estimated Standard Shipping</span>
                      <span className="text-primary font-bold uppercase text-xs tracking-wider">
                        {cartTotals.shippingCharge === 0 ? 'FREE' : `₹${cartTotals.shippingCharge}`}
                      </span>
                    </div>
                  </div>

                  {/* Coupon Input Block */}
                  <div className="pt-space-xs flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        className="flex-grow bg-surface-container-low text-on-surface text-body-sm px-3.5 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider"
                        placeholder="Promo code"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-surface-container text-on-surface text-label-md px-5 py-2.5 rounded-full hover:bg-surface-variant transition-colors font-bold"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-error px-2">{couponError}</p>}
                    {activeCoupon && (
                      <div className="flex items-center justify-between bg-primary-fixed/30 text-on-primary-fixed px-3 py-1.5 rounded-full text-label-md">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Coupon &apos;{activeCoupon}&apos; applied
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await applyCouponCode('');
                            setCouponInput('');
                          }}
                          className="hover:opacity-70 text-secondary text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Total Price Row */}
                  <div className="pt-space-xs">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-headline-sm font-normal text-on-surface">
                          Total Amount
                        </span>
                        <p className="text-body-sm text-secondary">
                          Inclusive of ₹{cartTotals.taxAmount} GST
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-headline-md font-bold text-on-surface">
                          ₹{cartTotals.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProceedingToCheckout}
                    onClick={handleProceedToCheckout}
                    className="w-full bg-on-surface hover:bg-primary-container text-on-primary text-center text-title-sm py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm disabled:opacity-75 disabled:cursor-wait"
                  >
                    {isProceedingToCheckout ? (
                      <CircularLoader size="sm" color="white" label="Preparing checkout..." inlineText="Proceeding to Checkout..." />
                    ) : (
                      <>
                        <span>Proceed to Checkout</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {dryShampoo && (
                  <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-space-sm">
                    <span className="text-label-md uppercase tracking-wider text-secondary font-bold">
                      Frequently bought together
                    </span>
                    <div className="flex items-center justify-between gap-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-14 h-14 bg-surface-container-low rounded-2xl overflow-hidden flex-shrink-0">
                          <img
                            className="object-cover w-full h-full"
                            alt={dryShampoo.shortName}
                            src={dryShampoo.image}
                          />
                        </div>
                        <div>
                          <h3 className="text-title-sm text-on-surface font-medium leading-snug">
                            {dryShampoo.shortName}
                          </h3>
                          <p className="text-body-sm text-secondary">{dryShampoo.subtitle}</p>
                          <p className="text-title-sm font-bold text-on-surface mt-0.5">
                            ₹{dryShampoo.price}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(dryShampoo)}
                        className="px-4 py-2 rounded-full bg-primary-container text-on-primary text-label-md font-bold hover:bg-primary transition-colors shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
