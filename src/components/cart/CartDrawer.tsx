import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const FREE_SHIPPING_THRESHOLD = 499;

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    cartTotals,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    isItemUpdating,
  } = useStore();

  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isCartDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartDrawerOpen, setIsCartDrawerOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isCartDrawerOpen]);

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    navigate('/checkout');
  };

  const handleViewCart = () => {
    setIsCartDrawerOpen(false);
    navigate('/cart');
  };

  const handleShop = () => {
    setIsCartDrawerOpen(false);
    navigate('/shop');
  };

  const subtotal = cartTotals.subtotal;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isCartDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Shopping Cart Drawer"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
          isCartDrawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setIsCartDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className={`w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isCartDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#104332] text-white flex items-center justify-between border-b border-[#164a38]">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#d6ede2]" />
              <h2 className="text-lg font-bold tracking-tight">
                Your Bag{' '}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#164a38] text-[#d6ede2] ml-1">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close cart drawer"
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#f0f9f5] px-6 py-3 border-b border-[#d1fae5]">
            <div className="flex items-center gap-2 text-xs font-medium text-[#065f46] mb-1.5">
              <Truck className="w-4 h-4 text-[#059669] shrink-0" />
              <span>
                {remainingForFreeShipping > 0 ? (
                  <>
                    Add <strong className="font-bold text-[#047857]">₹{remainingForFreeShipping}</strong> more for{' '}
                    <strong className="text-[#047857]">FREE Delivery</strong>
                  </>
                ) : (
                  <strong className="text-[#047857]">🎉 You have qualified for FREE delivery!</strong>
                )}
              </span>
            </div>
            <div className="w-full bg-[#d1fae5] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#059669] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-800 mb-1">Your bag is empty</h3>
                <p className="text-xs text-neutral-500 max-w-xs mb-6">
                  Add clean botanical cat litter or grooming essentials to keep your pets healthy and fresh.
                </p>
                <button
                  type="button"
                  onClick={handleShop}
                  className="px-6 py-2.5 rounded-full bg-[#104332] text-white text-xs font-semibold hover:bg-[#0a2c20] transition-colors"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-start group">
                  {/* Thumbnail */}
                  <img
                    src={item.image || '/placeholder-product.png'}
                    alt={item.name}
                    className="w-18 h-18 rounded-xl object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 leading-snug truncate">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name} from cart`}
                        disabled={isItemUpdating(item.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {item.variantLabel && (
                        <span className="text-[11px] font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
                          {item.variantLabel}
                        </span>
                      )}
                      {item.isSubscription && (
                        <span className="text-[10px] font-bold bg-[#ecfdf5] text-[#047857] px-1.5 py-0.5 rounded">
                          Subscribe &amp; Save (15%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={isItemUpdating(item.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, -1);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={isItemUpdating(item.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, 1);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-sm font-bold text-neutral-900">
                          ₹ {item.unitPrice * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-neutral-400">₹{item.unitPrice} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Sticky Summary & Checkout */}
          {cart.length > 0 && (
            <div className="px-6 py-5 bg-neutral-50 border-t border-neutral-200 space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">₹ {cartTotals.subtotal}</span>
                </div>
                {cartTotals.subscriptionDiscount > 0 && (
                  <div className="flex justify-between text-[#047857]">
                    <span>Subscription Savings</span>
                    <span>-₹ {cartTotals.subscriptionDiscount}</span>
                  </div>
                )}
                {cartTotals.couponDiscount > 0 && (
                  <div className="flex justify-between text-[#047857]">
                    <span>Coupon Discount</span>
                    <span>-₹ {cartTotals.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span>
                    {cartTotals.shippingCharge === 0 ? (
                      <span className="text-[#047857] font-bold">FREE</span>
                    ) : (
                      `₹ ${cartTotals.shippingCharge}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-900">Total</span>
                  <span className="text-lg font-bold text-neutral-900">₹ {cartTotals.totalAmount}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 px-6 rounded-full bg-[#104332] text-white font-semibold text-sm hover:bg-[#0a2c20] transition-all flex items-center justify-center gap-2 shadow-sm group active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Secondary Actions */}
              <div className="flex items-center justify-between text-xs pt-1 text-neutral-500">
                <button
                  type="button"
                  onClick={handleViewCart}
                  className="hover:text-neutral-900 underline underline-offset-2"
                >
                  View Full Cart Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="hover:text-neutral-900"
                >
                  Continue Shopping →
                </button>
              </div>

              {/* Guarantee info */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span>Cash on delivery available · Guaranteed freshness</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
