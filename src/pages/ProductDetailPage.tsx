import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HOME_FAQS } from '../data/products';
import { useStore } from '../context/StoreContext';
import { shippingService } from '../services/storeServices';
import { ApiError } from '../services/apiClient';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, productsLoading, addToCart, customer, toggleWishlist, isInWishlist } = useStore();

  const product = products.find((p) => p.slug === slug) ?? products[0];
  const isLitter = product?.slug === 'clumping-cat-litter';

  const [packSize, setPackSize] = useState<'5 kg' | '10 kg'>('5 kg');
  const [purchasePlan, setPurchasePlan] = useState<'subscribe' | 'onetime'>('subscribe');
  const [pincode, setPincode] = useState('');
  const [pinResult, setPinResult] = useState<string | null>(null);
  const [showClumpModal, setShowClumpModal] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (productsLoading) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16">
        <div className="h-96 bg-neutral-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-[#133527] mb-3">Product not found</h1>
        <Link to="/shop" className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold">
          Back to Shop
        </Link>
      </div>
    );
  }

  const activeVariant = isLitter
    ? product.variants.find((v) => v.label === packSize) ?? product.variants[0]
    : product.variants[0];
  const activePrice = activeVariant?.price ?? product.price;
  const activeUnit = activeVariant?.label ?? product.unitLabel;
  const isOutOfStock = activeVariant
    ? !activeVariant.isAvailable || activeVariant.stockQuantity <= 0
    : product.stockQuantity <= 0;

  const handlePrimaryCta = async () => {
    if (isOutOfStock) return;
    setActionError(null);
    try {
      await addToCart(product, {
        variantId: activeVariant?.id,
        variantLabel: activeUnit,
        unitPrice: activePrice,
        isSubscription: purchasePlan === 'subscribe',
        frequencyWeeks: 4,
      });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to add item to cart.');
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    setActionError(null);
    try {
      await addToCart(product, {
        variantId: activeVariant?.id,
        variantLabel: activeUnit,
        unitPrice: activePrice,
        isSubscription: purchasePlan === 'subscribe',
        frequencyWeeks: 4,
      });
      navigate(customer ? '/checkout' : '/login?redirect=/checkout');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to proceed with Buy Now.');
    }
  };

  return (
    <div className="bg-white">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-2">
        <ol className="flex items-center space-x-2 text-[13px] text-gray-500">
          <li>
            <Link className="hover:text-gray-900 transition-colors" to="/">
              Home
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <Link className="hover:text-gray-900 transition-colors" to="/shop?category=cats">
              {product.petCategory === 'dogs' ? 'Dogs' : 'Cats'}
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li className="text-gray-900 font-medium">{product.shortName}</li>
        </ol>
      </nav>

      {/* Product Overview Section */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          {/* Left Column: Gallery & Featured Image */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="w-full bg-[#fbfbfb] rounded-2xl border border-gray-200/80 p-8 sm:p-12 flex items-center justify-center relative overflow-hidden aspect-[4/4.5] shadow-xs">
              <button
                type="button"
                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-6 right-6 z-20 w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-all shadow-sm hover:scale-110 ${
                  isInWishlist(product.id) ? 'text-error' : 'text-neutral-500 hover:text-error'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
              </button>
              {isLitter ? (
                <div className="relative w-full max-w-[340px] aspect-[1/1.4] bg-emerald-700 rounded-t-3xl rounded-b-xl shadow-2xl flex flex-col overflow-hidden border-2 border-emerald-800">
                  <div className="bg-emerald-900 h-9 border-b border-emerald-600/40 flex items-center justify-between px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border border-emerald-400" />
                      <span className="text-[9px] font-bold text-white tracking-widest uppercase">
                        Made In India
                      </span>
                    </div>
                    <div className="text-[9px] text-emerald-200 font-semibold tracking-wider border border-emerald-400/50 rounded-full px-2 py-0.5">
                      NATURAL &amp; SAFE
                    </div>
                  </div>

                  <div className="pt-5 pb-3 text-center bg-gradient-to-b from-emerald-800 to-emerald-700">
                    <div className="w-6 h-6 mx-auto rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center mb-1">
                      S
                    </div>
                    <h3 className="text-white text-xs font-black tracking-widest">
                      THE <span className="font-light">SNIFF</span> CO.
                    </h3>
                    <p className="text-[10px] font-bold tracking-widest text-emerald-200 uppercase mt-0.5">
                      Cat Litter
                    </p>
                  </div>

                  <div className="relative flex-1 bg-gradient-to-b from-emerald-700 to-emerald-800 px-4 py-2 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 z-10">
                        <div className="flex items-center gap-1 bg-emerald-900/60 backdrop-blur-xs rounded px-1.5 py-0.5 w-max">
                          <span className="text-[9px] text-emerald-300">⚡</span>
                          <span className="text-[8px] font-bold text-white leading-tight">
                            STRONG
                            <br />
                            CLUMPING
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-900/60 backdrop-blur-xs rounded px-1.5 py-0.5 w-max">
                          <span className="text-[9px] text-emerald-300">♨</span>
                          <span className="text-[8px] font-bold text-white leading-tight">
                            ODOR
                            <br />
                            CONTROL
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-900/60 backdrop-blur-xs rounded px-1.5 py-0.5 w-max">
                          <span className="text-[9px] text-emerald-300">⏱</span>
                          <span className="text-[8px] font-bold text-white leading-tight">
                            LONG
                            <br />
                            LASTING
                          </span>
                        </div>
                      </div>

                      <div className="w-36 h-36 rounded-full border-4 border-white/90 overflow-hidden shadow-lg bg-amber-50 relative ml-auto -mr-2">
                        <div className="w-full h-full bg-[#f4ebe1] flex flex-col items-center justify-center p-2 text-center">
                          <div className="relative w-16 h-14 bg-gray-200 rounded-full border border-gray-300 flex items-center justify-center">
                            <div className="absolute -top-2 left-1 w-4 h-4 bg-gray-400 rotate-45 rounded-sm" />
                            <div className="absolute -top-2 right-1 w-4 h-4 bg-gray-400 rotate-45 rounded-sm" />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <div className="absolute bottom-3 w-1.5 h-1 bg-pink-400 rounded-full" />
                          </div>
                          <span className="text-[9px] font-bold text-gray-700 mt-2">
                            Bentonite &amp; Carbon
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto bg-black/40 rounded-xl p-2.5 border border-white/20 backdrop-blur-sm">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-black uppercase text-white block tracking-wider">
                            Activated Carbon
                          </span>
                          <span className="text-[8px] text-emerald-200">
                            Zero Dust · Instant Odor Lock
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-white bg-black/50 px-2 py-0.5 rounded">
                            {activeUnit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-20 bg-gray-200 rounded-l-md border border-gray-400 shadow-inner flex items-center justify-center">
                    <span className="rotate-90 text-[7px] font-bold tracking-widest text-gray-700">
                      HANDLE
                    </span>
                  </div>
                </div>
              ) : (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-3 pt-1">
              <button
                aria-label="View packaging image"
                className="aspect-[4/3] rounded-xl border-2 border-black p-1.5 flex items-center justify-center bg-gray-50 focus:outline-none"
                type="button"
              >
                <div className="w-7 h-10 bg-emerald-700 rounded-sm flex flex-col justify-between items-center py-0.5">
                  <span className="text-[5px] text-white font-bold">SNIFF</span>
                  <div className="w-4 h-4 rounded-full bg-white/40" />
                  <span className="text-[5px] text-white">{activeUnit}</span>
                </div>
              </button>
              <div className="aspect-[4/3] rounded-xl border border-gray-200 p-2 flex items-center justify-center text-center bg-white hover:border-gray-400 transition-colors">
                <span className="text-xs font-medium text-gray-800 leading-tight">
                  Fast clumping
                </span>
              </div>
              <div className="aspect-[4/3] rounded-xl border border-gray-200 p-2 flex items-center justify-center text-center bg-white hover:border-gray-400 transition-colors">
                <span className="text-xs font-medium text-gray-800 leading-tight">
                  Carbon granules
                </span>
              </div>
              <div className="aspect-[4/3] rounded-xl border border-gray-200 p-2 flex items-center justify-center text-center bg-white hover:border-gray-400 transition-colors">
                <span className="text-xs font-medium text-gray-800 leading-tight">
                  Low-dust formula
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Purchasing & Specs */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
                {product.badge ?? 'Bestseller'}
              </span>
              <span className="border border-gray-800 text-gray-900 text-xs font-medium px-3 py-0.5 rounded-full">
                Made in India
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-[40px] leading-[1.15] text-[#133527] font-semibold tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-3 mb-4">
              <div aria-label="5 out of 5 stars" className="flex text-black text-sm tracking-tighter">
                ★★★★★
              </div>
              <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
              <span className="text-xs text-gray-400">·</span>
              <a
                className="text-sm font-medium text-gray-600 underline underline-offset-2 hover:text-black"
                href="#reviews"
              >
                {product.reviewCount} reviews
              </a>
            </div>

            <div className="flex items-baseline gap-2 pb-5 border-b border-gray-100">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950">
                ₹ {activePrice.toLocaleString('en-IN')}
              </span>
              <span className="text-2xl sm:text-3xl font-semibold text-gray-700">
                · {activeUnit}
              </span>
              <span className="text-xs text-gray-500 font-normal ml-1">incl. of all taxes</span>
            </div>

            {isLitter && (
              <div className="mt-6">
                <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Pack size
                </label>
                <div className="flex items-center gap-3">
                  {(['5 kg', '10 kg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPackSize(sz)}
                      className={
                        packSize === sz
                          ? 'px-7 py-2.5 rounded-full bg-black text-white text-sm font-medium border border-black shadow-xs'
                          : 'px-7 py-2.5 rounded-full bg-white text-gray-800 text-sm font-medium border border-gray-300 hover:border-gray-500 transition-colors'
                      }
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Type Selector */}
            <fieldset className="mt-6 space-y-3">
              <legend className="sr-only">Choose a purchase option</legend>
              <label
                onClick={() => setPurchasePlan('subscribe')}
                className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                  purchasePlan === 'subscribe'
                    ? 'border-2 border-black bg-white'
                    : 'border border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={purchasePlan === 'subscribe'}
                    onChange={() => setPurchasePlan('subscribe')}
                    className="w-4 h-4 accent-black"
                    name="purchase_plan"
                    type="radio"
                  />
                  <div>
                    <div className="font-bold text-sm text-gray-900">Subscribe &amp; save</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Delivered every 4 weeks · skip or cancel any time
                    </div>
                  </div>
                </div>
                <span className="bg-black text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                  Save 15%
                </span>
              </label>

              <label
                onClick={() => setPurchasePlan('onetime')}
                className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                  purchasePlan === 'onetime'
                    ? 'border-2 border-black bg-white'
                    : 'border border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={purchasePlan === 'onetime'}
                    onChange={() => setPurchasePlan('onetime')}
                    className="w-4 h-4 accent-black"
                    name="purchase_plan"
                    type="radio"
                  />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">One-time purchase</div>
                    <div className="text-xs text-gray-500 mt-0.5">Pay once, no subscription</div>
                  </div>
                </div>
                <span className="bg-black text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                  Standard
                </span>
              </label>
            </fieldset>

            {/* Primary Call to Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-6">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handlePrimaryCta}
                className="sm:col-span-7 bg-black hover:bg-gray-900 text-white font-semibold py-3.5 px-6 rounded-full text-sm sm:text-base tracking-wide transition-all shadow-md active:scale-[0.99] text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOutOfStock
                  ? 'Out of stock'
                  : purchasePlan === 'subscribe'
                    ? `Subscribe · ${activeUnit}`
                    : `Add to cart · ${activeUnit}`}
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="sm:col-span-3 bg-white hover:bg-gray-50 border border-gray-900 text-gray-900 font-semibold py-3.5 px-4 rounded-full text-sm sm:text-base tracking-wide transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy now
              </button>
              <button
                type="button"
                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => toggleWishlist(product.id)}
                className={`sm:col-span-2 flex items-center justify-center py-3.5 px-3 rounded-full border transition-all ${
                  isInWishlist(product.id)
                    ? 'border-error text-error bg-error-container/20'
                    : 'border-gray-300 text-gray-700 hover:border-gray-500 hover:text-error'
                }`}
                title={isInWishlist(product.id) ? 'Saved to wishlist' : 'Add to wishlist'}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
              </button>
            </div>
            {actionError && (
              <p className="text-xs text-error mt-2 font-medium">{actionError}</p>
            )}

            {/* Delivery Pincode Check Form */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <form
                className="flex flex-col sm:flex-row sm:items-center gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!/^[0-9]{6}$/.test(pincode)) return;
                  try {
                    const res = await shippingService.checkPincode(pincode);
                    setPinResult(
                      res.serviceable
                        ? `Express delivery in ${res.estimatedDays} available for ${res.pincode} (COD & Free Shipping > ₹499).`
                        : `PIN code ${res.pincode} is not serviceable.`
                    );
                  } catch {
                    setPinResult('Unable to verify PIN code right now.');
                  }
                }}
              >
                <span className="text-xs font-semibold text-gray-800 whitespace-nowrap min-w-max">
                  Check delivery
                </span>
                <div className="flex-1 flex gap-2">
                  <input
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3.5 py-2 focus:ring-black focus:border-black placeholder:text-gray-400"
                    maxLength={6}
                    placeholder="Enter pincode"
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                  <button
                    className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg tracking-wider transition-colors"
                    type="submit"
                  >
                    Check
                  </button>
                </div>
              </form>
              {pinResult && (
                <p className="text-xs text-emerald-800 font-medium mt-2">{pinResult}</p>
              )}
            </div>

            {/* Key Benefit Icon Highlights */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 mt-6 pt-5 border-t border-gray-100 text-xs text-gray-700 font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-800">
                  check_circle
                </span>
                <span>Strong clumping</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-800">
                  filter_alt
                </span>
                <span>Odour control</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-800">
                  local_shipping
                </span>
                <span>Long lasting</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-800">
                  air
                </span>
                <span>99.9% dust free</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How To Use Section */}
      <section className="w-full bg-[#0a3528] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal mb-10">
            How to use
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: 1, title: 'Pour', desc: 'Fill a clean, dry tray 5–7 cm deep.' },
              { n: 2, title: 'Scoop', desc: 'Lift out clumps and solid waste every day.' },
              { n: 3, title: 'Top up', desc: 'Add fresh litter to keep the depth even.' },
              { n: 4, title: 'Refresh', desc: "Replace it fully every 4 weeks. Don't flush." },
            ].map((step) => (
              <div
                key={step.n}
                className="bg-[#104334]/80 border border-emerald-800/60 rounded-2xl p-6 flex flex-col justify-between h-44 hover:border-emerald-600 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-black/80 flex items-center justify-center font-bold text-sm text-white">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">{step.title}</h3>
                  <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Demonstration Video Card */}
          <div
            onClick={() => setShowClumpModal(true)}
            className="mt-6 border border-emerald-800/60 rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center text-center bg-[#0d3f30]/60 hover:bg-[#0d3f30]/80 transition-colors cursor-pointer group"
          >
            <button
              aria-label="Play video demonstration"
              className="w-12 h-12 rounded-full bg-black/90 flex items-center justify-center group-hover:scale-110 transition-transform mb-4 shadow-lg border border-emerald-600/30"
              type="button"
            >
              <span className="material-symbols-outlined text-white text-[24px]">play_arrow</span>
            </button>
            <p className="text-base font-semibold text-white tracking-wide">
              See the 15-second clump test
            </p>
            <p className="text-xs text-emerald-200/80 mt-1 font-light">
              Pour water. Wait. Scoop the clump.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ and Cross-Sell Bundle */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 lg:py-20" id="reviews">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-3xl sm:text-[34px] text-emerald-950 font-normal mb-8">
              Questions pet parents ask
            </h2>
            <div className="space-y-3">
              {HOME_FAQS.map((faq) => (
                <details
                  key={faq.id}
                  className="group border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                  open={faq.defaultOpen}
                >
                  <summary className="flex justify-between items-center px-6 py-4.5 cursor-pointer font-semibold text-sm text-gray-900 select-none">
                    <span>{faq.question}</span>
                    <span className="text-lg font-light text-gray-500 group-open:hidden">+</span>
                    <span className="text-lg font-light text-gray-500 hidden group-open:inline">
                      −
                    </span>
                  </summary>
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-[13px] text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 lg:ml-4">
            <div className="border border-gray-200 rounded-2xl p-6 sm:p-7 bg-white shadow-xs">
              <h3 className="font-serif text-xl sm:text-2xl text-emerald-950 font-normal mb-6">
                Frequently bought together
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
                  <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                    <div className="w-7 h-10 bg-emerald-700 rounded-xs flex flex-col justify-center items-center">
                      <span className="text-[5px] text-white font-bold leading-none">5KG</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">This litter · 5 kg</h4>
                    <p className="text-xs text-gray-600 mt-0.5">₹ 699</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 pb-2">
                  <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                    <div className="w-5 h-10 bg-amber-800/80 rounded-sm flex flex-col items-center justify-center">
                      <div className="w-2.5 h-1 bg-gray-800 -mt-1 rounded-xs" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Soft &amp; Silky Shampoo</h4>
                    <p className="text-xs text-gray-600 mt-0.5">₹ 399</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    const litter = products.find((p) => p.slug === 'clumping-cat-litter');
                    const shampoo = products.find((p) => p.slug === 'soft-silky-dog-shampoo');
                    if (litter) await addToCart(litter);
                    if (shampoo) await addToCart(shampoo);
                    setBundleAdded(true);
                    setTimeout(() => setBundleAdded(false), 1800);
                  }}
                  className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-5 rounded-full text-sm transition-colors shadow-xs"
                >
                  {bundleAdded ? 'Both Added to Cart ✓' : 'Add both · Save 10%'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showClumpModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowClumpModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[28px]">science</span>
            </div>
            <h3 className="font-serif text-2xl text-emerald-950 mb-2">15-Second Clump Test</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Our high-purity sodium bentonite absorbs moisture in under 15 seconds, forming a
              rock-solid, non-crumbling clump that lifts cleanly without leaving damp residue
              behind.
            </p>
            <button
              type="button"
              onClick={() => setShowClumpModal(false)}
              className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
