import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/storeServices';
import { useStore } from '../context/StoreContext';
import { PageTransitionLoader } from '../components/ui/PageTransitionLoader';

interface ConfirmedOrder {
  id: string;
  orderNumber: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalAmount: number;
  subscriptionDiscount: number;
  couponDiscount: number;
  shippingCharge: number;
  totalAmount: number;
  shippingAddressSnapshot: {
    recipientName: string;
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
    lineTotal: number;
    isSubscription: boolean;
  }>;
  shipment?: {
    carrier: string;
    trackingNumber: string;
    status: string;
  } | null;
}

export const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { customer } = useStore();
  const state = location.state as { order?: ConfirmedOrder } | null;
  const orderNumberParam = searchParams.get('orderNumber');

  const [fetchedOrder, setFetchedOrder] = useState<ConfirmedOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const order = state?.order ?? fetchedOrder;

  useEffect(() => {
    if (state?.order || !customer) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        if (orderNumberParam) {
          const ord = (await orderService.getByIdOrNumber(orderNumberParam)) as ConfirmedOrder;
          if (active) setFetchedOrder(ord);
        } else {
          const all = (await orderService.getMyOrders()) as ConfirmedOrder[];
          if (active && all.length > 0) setFetchedOrder(all[0]);
        }
      } catch {
        // Ignore if order not accessible
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [state?.order, orderNumberParam, customer]);

  if (loading) {
    return <PageTransitionLoader message="Loading order details..." />;
  }

  if (!order) {
    return (
      <div className="w-full bg-surface py-20 px-margin">
        <div className="max-w-xl mx-auto bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm">
          <span className="material-symbols-outlined text-[42px] text-primary-container mb-3">
            receipt_long
          </span>
          <h1 className="text-headline-md text-primary mb-2">No order selected</h1>
          <p className="text-body-md text-secondary mb-6">
            Place an order from your cart or view your order history in your account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/account"
              className="px-6 py-3 rounded-full bg-primary-container text-on-primary text-title-sm"
            >
              View My Orders
            </Link>
            <Link
              to="/shop"
              className="px-6 py-3 rounded-full bg-surface-container text-on-surface text-title-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstName = order.customerNameSnapshot.split(' ')[0] || 'Pet Parent';
  const addr = order.shippingAddressSnapshot;

  return (
    <div className="w-full bg-surface">
      {/* Main Hero Confirmation Banner */}
      <section className="w-full bg-surface-container-lowest px-margin py-space-xl">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-gutter">
          <div className="flex items-start gap-space-md max-w-2xl">
            <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-md">
              <span
                className="material-symbols-outlined text-[30px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="text-label-sm uppercase tracking-wider px-space-sm py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                  {order.status}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  · Order #{order.orderNumber}
                </span>
              </div>
              <h1 className="text-headline-lg text-primary tracking-tight font-medium">
                Thank you for your order, {firstName}!
              </h1>
              <p className="text-body-md text-on-surface-variant">
                Confirmation sent to {order.customerEmailSnapshot}.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-space-xs min-w-[280px] w-full md:w-auto">
            <div className="flex items-center justify-between text-on-surface-variant text-label-md">
              <span>Tracking Number</span>
              <span className="font-bold text-on-surface">
                {order.shipment?.trackingNumber ?? 'Pending Dispatch'}
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant text-label-md">
              <span>Delivery Partner</span>
              <span className="font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                {order.shipment?.carrier ?? 'Delhivery Express'}
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant text-label-md">
              <span>Payment</span>
              <span className="px-space-xs py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold">
                ₹{order.totalAmount.toLocaleString('en-IN')} ({order.paymentMethod} · {order.paymentStatus === 'PENDING' ? 'Pending' : order.paymentStatus})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="w-full bg-surface px-margin py-space-xl">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <h2 className="text-headline-sm text-on-surface font-medium">
                Items in this Delivery ({order.items.length})
              </h2>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-space-md p-space-md bg-surface-container-low rounded-2xl"
                >
                  <div>
                    <h3 className="text-title-md text-on-surface font-semibold">
                      {item.productName}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant">
                      {item.packSizeLabel} · Qty {item.quantity}{' '}
                      {item.isSubscription ? '· Auto-Refill' : ''}
                    </p>
                  </div>
                  <span className="text-title-md font-bold text-on-surface">
                    ₹{item.lineTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
              <h2 className="text-headline-sm text-on-surface font-medium mb-2">
                Delivery Destination
              </h2>
              <span className="text-title-sm font-bold text-on-surface">{addr.recipientName}</span>
              <p className="text-body-md text-on-surface-variant">
                {addr.addressLine1}, {addr.addressLine2}
                <br />
                {addr.city}, {addr.state} — {addr.pincode}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <h2 className="text-headline-sm text-on-surface font-medium">Order Calculation</h2>
              <div className="flex flex-col gap-space-sm text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Items Subtotal</span>
                  <span className="font-semibold">
                    ₹{order.subtotalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {order.subscriptionDiscount > 0 && (
                  <div className="flex justify-between text-primary-container font-semibold">
                    <span>Subscribe &amp; Save</span>
                    <span>- ₹{order.subscriptionDiscount}</span>
                  </div>
                )}
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-primary-container font-semibold">
                    <span>Coupon Discount</span>
                    <span>- ₹{order.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>Shipping</span>
                  <span>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span>
                </div>
                <div className="h-[1px] w-full bg-surface-container-high my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-title-md text-on-surface font-bold">Total</span>
                  <span className="text-headline-md text-primary font-bold">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Link
                to="/shop"
                className="w-full bg-primary-container text-on-primary py-3.5 px-space-md rounded-full text-title-sm font-bold text-center hover:bg-primary transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
