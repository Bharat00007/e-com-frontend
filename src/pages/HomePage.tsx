import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, Zap, ArrowLeftRight, Check } from 'lucide-react';
import { HOME_FAQS, INSTAGRAM_IMAGES, TESTIMONIALS } from '../data/products';
import { useStore } from '../context/StoreContext';

const HERO_CAT_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAzYHrtCA7SatHmLQTLXUbR-F5BlO2xockuhdaHj4F0gwjXiyyNMaJeOiZ5Fw0a-TjodJuQEVXFT4gzZTg0D4Kg5QRajr5VoXbeTDZQnEqaU0E72AJfb7ZPWwREK3vKTZIlTEviTaPlodoB5UD5CH2EPkaUlXXzwIQfWLjSlrhHmaAbEqd6oHreI4pMaoFAM4gTlHE_TyuP9nsaaFbynjoT0iPN_ktnkcvjYFD31Mz0';

const HERO_DOG_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBLCNpBbf884EHhAjOTtd0V6MFAkNB08iULIr4ZTmjZnQo9ZNEvyM1Z6gbVXz5iDfzOAwg_6e7mXemqK50QOd_peMvTv6u0JOvsSpkbWRaZNyJ-bOCWj6uZsf3i0jdXy3BNena-UILk3aLY3vmYAM8_nEj4d6dJcKdvPyTRUZTe4BWPTEHxHPvggF3q-tG1Jxa1qJvCbC5HX9PfCjkIVR1NpQg-Q1wsrN7s4GTDNUe3';

const CAT_CARD_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBCpj3fKZoORAwDMOkPBVnT9k6WIor7uKTqikCRyHuRa3gEyC8ICIyMBh7-_TnOoO-y0bVnwIeHmqPZQnY6Rt2OhHvO_M9xcTWRANyVPu-doweCGH87__VxT0mI6cFWyKyXmfuawAdzNGW4jk1jzrCt3jahoA5vciXwROUJK89hRpM9RZh_Mf1ZlP0KKyzN1MIWv6LiHDQVyk7JkuRTwp-T97tD1qyuC-wTyBg_SAbX';

const DOG_CARD_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDeaTu-gn20a9p3uYogunFlspH2C67NuOnUA2eLbvFCAeps8-3zehILS0PcZ_80NYUhTizdEE4PJ0x2mCVtM-chXWezMJ9GjLFx4BqSGGik8zCl-MhrpuJRA5_VSqTqB--OwPAuOgBNFI7QMXR-uKNasb5rIlsCAjNM5hN35oGLRwC68_3u-qoanWJjNxZcK7z1Vsgui0vxZvHPi5AmCAJNMi8ayWzyPxRBWG_HA27d';

const OUR_STORY_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDDEKzsxcbAmnmjN0ULCV4OLxZViM6l0H5hT3VzH_R0w94ISSd2dLz3Phr8lmrdNoLGgIZt4FSsgulOM1IIJRIlnYio-cw2YDjehPm5oIBQ1Ug4evRQ8cCLNOxgNQtsEiVd3JwcKhO5j_qzwAuox0MZyiIBvLMPhSbis2aio2fxRE6RIhZZl4FU1ccj6lJtQKdQ9mHA-ejva4wsPbKTM45JHo_dvpFea9qUnHqk15z5';

const CAT_PLANS: Record<string, { title: string; detail: string }> = {
  '1': { title: 'Suggested plan for 1 cat', detail: '5 kg every 4 weeks' },
  '2': { title: 'Suggested plan for 2 cats', detail: '10 kg every 4 weeks' },
  '3': { title: 'Suggested plan for 3 cats', detail: '15 kg every 4 weeks' },
  '4+': { title: 'Suggested plan for 4+ cats', detail: '20 kg every 4 weeks' },
};

export const HomePage: React.FC = () => {
  const {
    products,
    productsLoading,
    addToCart,
    apiStatus,
    apiErrorMessage,
    retryConnection,
    toggleWishlist,
    isInWishlist,
  } = useStore();
  const [selectedCats, setSelectedCats] = useState<string>('1');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [bundleAdded, setBundleAdded] = useState(false);
  const [newsletterInput, setNewsletterInput] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const bestsellerCards = products.slice(0, 4);
  const bundleLitter = products.find((p) => p.slug === 'clumping-cat-litter') ?? products[0];
  const bundleShampoo = products.find((p) => p.slug === 'soft-silky-dog-shampoo') ?? products[1];

  const handleQuickAdd = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    await addToCart(product);
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleAddBundle = async () => {
    if (bundleLitter) await addToCart(bundleLitter);
    if (bundleShampoo) await addToCart(bundleShampoo);
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 1800);
  };

  return (
    <div className="bg-white">
      {/* BEGIN: HeroSection */}
      <section
        className="bg-[#104332] text-white pt-8 pb-20 md:pb-24 overflow-hidden relative"
        data-purpose="hero-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column Content */}
            <div className="lg:col-span-6 flex flex-col items-start pt-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a291f] text-[#a4dbc2] text-xs font-medium tracking-wide mb-8 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ae099]" />
                New · Activated carbon cat litter
              </div>

              <h1 className="font-heading-syne text-4xl sm:text-5xl lg:text-[58px] leading-[1.08] font-bold mb-6 tracking-tight">
                Made for the nose that knows.
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/80 mb-10 max-w-xl font-normal leading-relaxed">
                Low-dust clumping litter and gentle grooming for cats and dogs. Made in India, from
                clay we know inside out.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  className="px-7 py-3.5 rounded-full bg-white text-[#104332] font-semibold text-sm hover:bg-emerald-50 transition-all shadow-sm"
                  to="/product/clumping-cat-litter"
                >
                  Shop cat litter
                </Link>
                <Link
                  className="px-7 py-3.5 rounded-full bg-transparent text-white font-semibold text-sm border border-white/40 hover:bg-white/10 transition-all"
                  to="/shop?category=grooming"
                >
                  Shop grooming
                </Link>
              </div>
            </div>

            {/* Right Column: Packaging Mockups */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
              <div className="flex items-end gap-5 sm:gap-7">
                {/* Cat Litter Bag Mockup Card */}
                <div className="w-64 sm:w-80 bg-white rounded-3xl p-5 shadow-2xl border-4 border-white/10 flex flex-col items-center">
                  <div className="w-full bg-[#ecf7f1] rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden border border-[#cfe6db]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-5 h-5 rounded-full bg-[#104332] text-white text-[10px] font-bold flex items-center justify-center">
                        S
                      </span>
                      <span className="text-[10px] font-bold tracking-widest text-[#104332]">
                        THE SNIFF CO.
                      </span>
                    </div>
                    <span className="bg-[#104332] text-[#86efac] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                      CAT LITTER
                    </span>
                    <div className="w-36 h-36 rounded-full overflow-hidden my-2 border-4 border-white shadow-inner bg-amber-50">
                      <img
                        alt="Fluffy domestic cat"
                        className="w-full h-full object-cover"
                        decoding="async"
                        fetchPriority="high"
                        height={144}
                        src={HERO_CAT_IMG}
                        width={144}
                      />
                    </div>
                    <div className="text-[11px] font-semibold text-[#0b2e22] mt-1">
                      ACTIVATED CARBON · 5kg
                    </div>
                    <div className="w-full bg-[#104332] text-white text-[9px] py-1.5 rounded-lg mt-3 font-semibold uppercase tracking-wider">
                      Superior Clumping Formula
                    </div>
                  </div>
                </div>

                {/* Sleek Grooming Shampoo Bottle Mockup */}
                <div className="w-36 sm:w-44 bg-white rounded-3xl p-4 shadow-xl border-4 border-white/10 flex flex-col items-center mb-2">
                  <div className="w-7 h-5 bg-neutral-900 rounded-t-sm mb-0.5" />
                  <div className="w-3 h-4 bg-neutral-300" />
                  <div className="w-full bg-gradient-to-b from-[#2e1d0f] to-[#1a1109] rounded-2xl p-3 text-center text-white flex flex-col items-center border border-amber-900/40">
                    <div className="w-4 h-4 rounded-full border border-white/30 text-[8px] flex items-center justify-center mb-1">
                      S
                    </div>
                    <span className="text-[8px] font-semibold tracking-wider text-amber-200">
                      THE SNIFF CO.
                    </span>
                    <div className="w-14 h-14 rounded-full overflow-hidden my-2 border-2 border-amber-500/30">
                      <img
                        alt="Golden Retriever puppy"
                        className="w-full h-full object-cover"
                        decoding="async"
                        fetchPriority="high"
                        height={56}
                        src={HERO_DOG_IMG}
                        width={56}
                      />
                    </div>
                    <p className="text-[9px] font-bold text-amber-100 uppercase tracking-tighter">
                      Soft &amp; Silky
                    </p>
                    <p className="text-[7px] text-amber-300">Oatmeal &amp; Aloe · 200ml</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEGIN: BenefitsBannerStrip */}
      <section className="border-b border-neutral-200 bg-white py-6" data-purpose="benefits-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-neutral-800 text-xs sm:text-sm font-semibold">
            <div className="flex items-center space-x-3">
              <span className="text-[#104332]">
                <Globe className="w-5 h-5" />
              </span>
              <span>Made in India</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[#104332]">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span>Pet-safe formulas</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[#104332]">
                <Zap className="w-5 h-5" />
              </span>
              <span>Activated carbon odour control</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[#104332]">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <span>Fast delivery · COD</span>
            </div>
          </div>
        </div>
      </section>

      {/* BEGIN: ShopByPetSection */}
      <section className="py-16 md:py-20 bg-white" data-purpose="shop-by-pet">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading-syne text-2xl sm:text-3xl font-bold mb-8">Shop by pet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Cats */}
            <div className="border border-neutral-200 rounded-3xl p-8 hover:border-neutral-400 transition-all flex items-center justify-between bg-[#FCFCFB]">
              <div className="max-w-[240px]">
                <h3 className="font-heading-syne text-2xl font-bold mb-2">For cats</h3>
                <p className="text-neutral-500 text-sm mb-6">Litter, shampoo, dry shampoo</p>
                <Link
                  className="inline-flex items-center text-sm font-bold text-neutral-900 group"
                  to="/shop?category=cats"
                >
                  Shop cats{' '}
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
              <div className="w-28 sm:w-36 bg-[#eef7f2] p-2.5 rounded-2xl border border-[#d2eadb] shadow-sm flex flex-col items-center">
                <span className="text-[8px] font-bold text-[#104332] uppercase">Cat Litter</span>
                <img
                  alt="Cat Litter bag"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full my-1.5 border border-white"
                  decoding="async"
                  height={80}
                  loading="lazy"
                  src={CAT_CARD_IMG}
                  width={80}
                />
                <span className="text-[8px] text-neutral-500 font-medium">Bentonite 5kg</span>
              </div>
            </div>

            {/* For Dogs */}
            <div className="border border-neutral-200 rounded-3xl p-8 hover:border-neutral-400 transition-all flex items-center justify-between bg-[#FCFCFB]">
              <div className="max-w-[240px]">
                <h3 className="font-heading-syne text-2xl font-bold mb-2">For dogs</h3>
                <p className="text-neutral-500 text-sm mb-6">Shampoo, 3-in-1, dry shampoo</p>
                <Link
                  className="inline-flex items-center text-sm font-bold text-neutral-900 group"
                  to="/shop?category=dogs"
                >
                  Shop dogs{' '}
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
              <div className="w-28 sm:w-36 bg-[#f7f4ef] p-2.5 rounded-2xl border border-[#ece4d3] shadow-sm flex flex-col items-center">
                <span className="text-[8px] font-bold text-amber-900 uppercase">Dog Care</span>
                <img
                  alt="Dog Shampoo bottle"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full my-1.5 border border-white"
                  decoding="async"
                  height={80}
                  loading="lazy"
                  src={DOG_CARD_IMG}
                  width={80}
                />
                <span className="text-[8px] text-neutral-500 font-medium">Shampoo 200ml</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEGIN: BestsellersSection */}
      <section className="pb-20 bg-white" data-purpose="bestsellers">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading-syne text-2xl sm:text-3xl font-bold">Bestsellers</h2>
            <Link
              className="text-sm font-bold text-neutral-800 hover:text-[#104332] underline-offset-4 hover:underline"
              to="/shop"
            >
              View all products
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="border border-neutral-200 rounded-3xl p-5 h-96 animate-pulse bg-neutral-50" />
              ))}
            </div>
          ) : bestsellerCards.length === 0 ? (
            apiStatus === 'offline' ? (
              <div
                className="border border-neutral-200 rounded-3xl p-10 text-center text-neutral-600 bg-neutral-50/50"
                data-purpose="offline-bestseller-state"
              >
                <p className="font-bold text-neutral-900 mb-1">Backend Connection Unavailable</p>
                <p className="text-xs text-neutral-500 mb-4">
                  {apiErrorMessage || 'Unable to load products. Backend is offline.'}
                </p>
                <button
                  type="button"
                  onClick={() => retryConnection()}
                  className="bg-[#104332] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#0c3326] transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-3xl p-10 text-center text-neutral-600">
                No products available.
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellerCards.map((product) => (
                <div
                  key={product.id}
                  className="border border-neutral-200 rounded-3xl p-5 flex flex-col justify-between hover:shadow-lg transition-shadow group relative bg-white"
                >
                  <button
                    type="button"
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className={`absolute top-7 right-7 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-all shadow-xs hover:scale-110 ${
                      isInWishlist(product.id) ? 'text-error' : 'text-neutral-500 hover:text-error'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      favorite
                    </span>
                  </button>
                  <div>
                    <Link
                      to={`/product/${product.slug}`}
                      className="w-full bg-[#f8f9f8] rounded-2xl h-60 flex items-center justify-center p-4 relative mb-4"
                    >
                      {product.badge && (
                        <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {product.badge}
                        </span>
                      )}
                      <img
                        alt={product.shortName}
                        className="h-44 w-44 object-contain rounded-2xl"
                        decoding="async"
                        height={176}
                        loading="lazy"
                        src={product.image}
                        width={176}
                      />
                    </Link>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      {product.petCategory === 'cats'
                        ? 'FOR CATS'
                        : product.petCategory === 'dogs'
                          ? 'FOR DOGS'
                          : 'CATS & DOGS'}
                    </span>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-heading-syne text-base font-bold text-neutral-900 mt-1 hover:text-[#104332] transition-colors">
                        {product.shortName}
                      </h3>
                    </Link>
                    <p className="text-xs text-neutral-500 mt-0.5">{product.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-2">
                    <span className="font-bold text-lg text-neutral-900">
                      ₹ {product.price.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      disabled={product.stockQuantity <= 0}
                      onClick={() => handleQuickAdd(product.id)}
                      className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.stockQuantity <= 0
                        ? 'Out of stock'
                        : addedId === product.id
                          ? 'Added ✓'
                          : 'Add to cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BEGIN: DeepGreenLitterFeature */}
      <section className="bg-[#104332] text-white py-20" data-purpose="litter-feature" id="litter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold block mb-3">
                THE LITTER
              </span>
              <h2 className="font-heading-syne text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-8">
                Clumps fast. Smells like nothing.
              </h2>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <p className="text-sm text-emerald-100">
                    <strong className="text-white font-semibold">Strong clumping</strong> · so you
                    scoop only what&apos;s used.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <p className="text-sm text-emerald-100">
                    <strong className="text-white font-semibold">Activated carbon</strong> locks
                    odours in, not just covers them.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <p className="text-sm text-emerald-100">
                    <strong className="text-white font-semibold">Low dust</strong> for cleaner air,
                    for them and for you.
                  </p>
                </div>
              </div>

              <Link
                className="inline-block px-7 py-3 rounded-full bg-white text-[#104332] font-semibold text-sm hover:bg-neutral-100 transition-all"
                to="/product/clumping-cat-litter"
              >
                See the litter
              </Link>
            </div>

            {/* Right Subscription Card */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-neutral-900 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading-syne text-xl font-bold">Subscribe &amp; save</h3>
                  <span className="bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Save 15%
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  Litter delivered every 3 or 4 weeks. Skip, pause or cancel any time.
                </p>

                <p className="text-xs font-bold text-neutral-800 mb-3">
                  How many cats do you have?
                </p>
                <div className="grid grid-cols-4 gap-2 mb-6" data-purpose="cat-selector">
                  {(['1', '2', '3', '4+'] as const).map((count) => {
                    const active = selectedCats === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSelectedCats(count)}
                        className={
                          active
                            ? 'py-2.5 rounded-xl text-xs font-bold bg-black text-white shadow-sm border border-black focus:outline-none'
                            : 'py-2.5 rounded-xl text-xs font-bold bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200'
                        }
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-neutral-100 rounded-2xl p-4 border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 block mb-0.5 font-medium">
                    {CAT_PLANS[selectedCats].title}
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {CAT_PLANS[selectedCats].detail}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEGIN: OurStorySection */}
      <section
        className="py-20 md:py-24 bg-white border-b border-neutral-100"
        data-purpose="our-story"
        id="our-story"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md border border-neutral-200 rounded-3xl p-6 sm:p-8 bg-[#FCFCFB] flex items-center justify-center">
                <div className="w-64 sm:w-72 bg-[#eef7f2] rounded-2xl p-4 border border-[#cfe6db] flex flex-col items-center shadow-sm">
                  <span className="text-[10px] font-bold tracking-widest text-[#104332] uppercase mb-1">
                    THE SNIFF CO.
                  </span>
                  <span className="bg-[#104332] text-[#86efac] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                    CAT LITTER
                  </span>
                  <img
                    alt="Cat portrait packaging"
                    className="w-40 h-40 object-cover rounded-full my-2 border-4 border-white shadow-md"
                    decoding="async"
                    height={160}
                    loading="lazy"
                    src={OUR_STORY_IMG}
                    width={160}
                  />
                  <span className="text-[11px] font-bold text-neutral-700 mt-2">
                    Bentonite · Activated Carbon
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 max-w-lg">
              <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold block mb-3">
                OUR STORY
              </span>
              <h2 className="font-heading-syne text-3xl sm:text-4xl font-bold leading-tight mb-6 text-neutral-900">
                From our own clay to your cat&apos;s corner.
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                We&apos;ve worked with bentonite clay for years as manufacturers. The Sniff Co.
                puts that know-how into litter and grooming that&apos;s made in India and made for
                the nose.
              </p>
              <Link
                className="inline-flex items-center text-sm font-bold text-neutral-900 group"
                to="/our-story"
              >
                Read our story{' '}
                <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BEGIN: TestimonialsSection */}
      <section className="py-20 bg-white" data-purpose="pet-parents-say">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading-syne text-2xl sm:text-3xl font-bold mb-8">
            Pet parents say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="border border-neutral-200 rounded-3xl p-6 sm:p-7 flex flex-col justify-between bg-white hover:border-neutral-300 transition-colors"
              >
                <div>
                  <span className="text-3xl text-neutral-800 font-serif leading-none font-bold block mb-3">
                    “
                  </span>
                  <p className="text-neutral-800 text-sm leading-relaxed mb-8">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <p className="text-xs font-semibold text-neutral-700">
                  {t.author} · {t.city} · {t.petName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEGIN: InstagramGridSection */}
      <section className="pb-20 bg-white" data-purpose="instagram-feed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading-syne text-2xl sm:text-3xl font-bold">
              Sniffing around Instagram
            </h2>
            <a
              className="text-xs sm:text-sm font-bold text-neutral-800 hover:text-[#104332]"
              href="https://instagram.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Follow @THESNIFFCO
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {INSTAGRAM_IMAGES.map((img, i) => (
              <div
                key={i}
                className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 group"
              >
                <img
                  alt={`Instagram ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  decoding="async"
                  loading="lazy"
                  src={img}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEGIN: NewsletterBanner */}
      <section className="pb-20" data-purpose="newsletter-discount">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black text-white rounded-3xl p-8 sm:p-10 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center lg:text-left">
              <h2 className="font-heading-syne text-2xl sm:text-3xl font-bold mb-2">
                Get 15% off your first order
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                Plus pet tips and early access to new products. No spam.
              </p>
            </div>

            {newsletterSubscribed ? (
              <div className="text-sm font-semibold text-emerald-300 bg-white/10 px-6 py-3 rounded-full">
                Welcome! Use code SNIFF15 at checkout for 15% off.
              </div>
            ) : (
              <form
                className="w-full max-w-md flex flex-col sm:flex-row items-center gap-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterInput.trim()) setNewsletterSubscribed(true);
                }}
              >
                <input
                  className="w-full rounded-full bg-white text-neutral-900 placeholder-neutral-400 px-5 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border-none"
                  placeholder="Email or WhatsApp number"
                  required
                  type="text"
                  value={newsletterInput}
                  onChange={(e) => setNewsletterInput(e.target.value)}
                />
                <button
                  className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-full bg-[#1b5e47] hover:bg-[#23775b] text-white text-xs sm:text-sm font-semibold transition-colors"
                  type="submit"
                >
                  Sign me up
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* BEGIN: FAQAndCrossSellSection */}
      <section className="pb-24 bg-white" data-purpose="faq-and-bundle" id="faqs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading-syne text-2xl sm:text-3xl font-bold mb-8">
            Questions pet parents ask
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Accordion FAQ Column */}
            <div className="lg:col-span-7 space-y-3">
              {HOME_FAQS.map((faq) => (
                <details
                  key={faq.id}
                  className="border border-neutral-200 rounded-2xl p-5 bg-white group"
                  open={faq.defaultOpen}
                >
                  <summary className="flex items-center justify-between cursor-pointer font-bold text-sm text-neutral-900 select-none">
                    <span>{faq.question}</span>
                    <span className="text-lg font-light text-neutral-400 group-open:hidden">+</span>
                    <span className="text-lg font-light text-neutral-400 hidden group-open:inline">
                      −
                    </span>
                  </summary>
                  <p className="text-xs sm:text-sm text-neutral-600 mt-3 pt-3 border-t border-neutral-100 leading-relaxed font-normal">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>

            {/* Right Column: Frequently Bought Together Bundle Card */}
            <div className="lg:col-span-5">
              <div className="border border-neutral-200 rounded-3xl p-6 sm:p-7 bg-white shadow-sm">
                <h3 className="font-heading-syne text-base font-bold mb-6 text-neutral-900">
                  Frequently bought together
                </h3>
                <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
                  <div className="w-14 h-14 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200">
                    <img
                      alt={bundleLitter?.shortName ?? 'Clumping Cat Litter 5kg'}
                      className="w-full h-full object-cover"
                      decoding="async"
                      height={56}
                      loading="lazy"
                      src={
                        bundleLitter?.image ??
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuA6yzt1JQHT1Y61ujMMgxjXpJj9Vg3Ch1B6j8QRq1AU17FU15BynbggNtpnGBW0tt1blx__P1WbC_k4OQ9o-oQlFs_YU4AwKHXm6hXzSKfOSq1LVX-224cG69kZ8GH0qV1Ee5oJKbldaMgo9cIJPCneveDiFeOj5fjqU3mlJ0RwigHHZLqDKkW9EZdl665Zxqo5m2FoWFDctYwf7TBNiFkZfOlFCKepMDDadi5oetsZ'
                      }
                      width={56}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">
                      {bundleLitter?.shortName ?? 'Clumping Cat Litter'} ·{' '}
                      {bundleLitter?.unitLabel ?? '5 kg'}
                    </h4>
                    <p className="text-xs text-neutral-500 font-medium">
                      ₹ {bundleLitter?.price ?? 699}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-4">
                  <div className="w-14 h-14 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200">
                    <img
                      alt={bundleShampoo?.shortName ?? 'Soft & Silky Shampoo'}
                      className="w-full h-full object-cover"
                      decoding="async"
                      height={56}
                      loading="lazy"
                      src={
                        bundleShampoo?.image ??
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDxlK7Zf26cjJJI-758lviA3RKj5B8aX4GtqowU6ug0iIDfFRr6aPWFK9MEeMjc9SzQWCEKYt7YxxPtVRntGwyyPcAwwA5Gc2e92bHoVvt6uPIfpKxnCeQXXTFi_j0xIaVVbbIcVnnCJFWRKcO-ISzzDn0DmebzWEEmRLBjkBc1y-hgVmIlmJEYBPMwbpIkkViHFoON8YS4ZqaQFY0N-VbFJpUEGk_QwdIlUhBjYzW0'
                      }
                      width={56}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">
                      {bundleShampoo?.shortName ?? 'Soft & Silky Shampoo'}
                    </h4>
                    <p className="text-xs text-neutral-500 font-medium">
                      ₹ {bundleShampoo?.price ?? 399}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddBundle}
                  className="w-full mt-4 bg-black hover:bg-neutral-800 text-white text-xs font-bold py-3.5 rounded-full transition-colors"
                >
                  {bundleAdded ? 'Both Added to Cart ✓' : 'Add both · Save 10%'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
