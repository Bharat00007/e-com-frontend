import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { shippingService } from '../services/storeServices';

type CategoryPill = 'all' | 'cats' | 'dogs' | 'cat-litter' | 'grooming';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') as CategoryPill) || 'all';

  const [activeCategory, setActiveCategory] = useState<CategoryPill>(initialCategory);
  const [sortBy, setSortBy] = useState<string>('Featured');
  const [petFilter, setPetFilter] = useState<{ cats: boolean; dogs: boolean; dual: boolean }>({
    cats: true,
    dogs: true,
    dual: false,
  });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(1200);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [litterPackVariant, setLitterPackVariant] = useState<'5 kg' | '10 kg'>('5 kg');
  const [pincode, setPincode] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const { products, productsLoading, addToCart, wishlist, toggleWishlist, apiStatus, apiErrorMessage, retryConnection } = useStore();

  useEffect(() => {
    const paramCat = (searchParams.get('category') as CategoryPill) || 'all';
    const allowed: CategoryPill[] = ['all', 'cats', 'dogs', 'cat-litter', 'grooming'];
    setActiveCategory(allowed.includes(paramCat) ? paramCat : 'all');
  }, [searchParams]);

  const { catsCount, dogsCount, dualCount } = useMemo(() => {
    let cats = 0;
    let dogs = 0;
    let dual = 0;
    for (const p of products) {
      if (p.petCategory === 'cats' || p.petCategory === 'both') cats += 1;
      if (p.petCategory === 'dogs' || p.petCategory === 'both') dogs += 1;
      if (p.petCategory === 'both') dual += 1;
    }
    return { catsCount: cats, dogsCount: dogs, dualCount: dual };
  }, [products]);

  const handleCategoryChange = (cat: CategoryPill) => {
    setActiveCategory(cat);
    if (cat === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const clearAllFilters = () => {
    setActiveCategory('all');
    setSearchParams({});
    setPetFilter({ cats: true, dogs: true, dual: false });
    setSelectedSize(null);
    setMaxPrice(1200);
    setSelectedFeatures([]);
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory === 'cats') {
      list = list.filter((p) => p.petCategory === 'cats' || p.petCategory === 'both');
    } else if (activeCategory === 'dogs') {
      list = list.filter((p) => p.petCategory === 'dogs' || p.petCategory === 'both');
    } else if (activeCategory === 'cat-litter') {
      list = list.filter((p) => p.category === 'cat-litter');
    } else if (activeCategory === 'grooming') {
      list = list.filter((p) => p.category === 'grooming' || p.category === 'home-care');
    }

    if (petFilter.dual) {
      list = list.filter((p) => p.petCategory === 'both');
    } else {
      list = list.filter((p) => {
        if (p.petCategory === 'cats') return petFilter.cats;
        if (p.petCategory === 'dogs') return petFilter.dogs;
        return petFilter.cats || petFilter.dogs;
      });
    }

    if (selectedSize) {
      list = list.filter((p) => p.unitLabel.toLowerCase() === selectedSize.toLowerCase());
    }

    list = list.filter((p) => p.price <= maxPrice);

    if (selectedFeatures.length > 0) {
      list = list.filter((p) => selectedFeatures.every((f) => p.features.includes(f)));
    }

    if (sortBy === 'Price: Low to High') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Bestsellers') {
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return list;
  }, [products, activeCategory, petFilter, selectedSize, maxPrice, selectedFeatures, sortBy]);

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* Top Breadcrumb & Hero Title Section */}
      <section className="max-w-[1280px] w-full mx-auto px-margin pt-8 pb-8">
        <nav className="flex items-center gap-space-xs text-on-surface-variant text-label-md pb-4 tracking-wider uppercase">
          <Link className="hover:text-primary transition-colors" to="/">
            Home
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-semibold">Shop All</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container-high pb-8">
          <div className="max-w-2xl">
            <span className="inline-block uppercase tracking-widest text-primary-container text-label-sm font-bold bg-surface-container-high px-3 py-1 rounded-full mb-3">
              Conscious Formulations
            </span>
            <h1 className="text-display-hero-mobile md:text-display-hero text-primary tracking-tight leading-tight">
              All Products
            </h1>
            <p className="text-body-lg text-secondary mt-3">
              Clean, low-dust clumping litter and gentle plant-powered grooming essentials
              formulated for sensitive pet noses.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-surface-container-low px-5 py-3 rounded-2xl shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                eco
              </span>
              <span className="text-label-md font-semibold text-primary">100% Pet-Safe</span>
            </div>
            <div className="w-px h-6 bg-surface-variant" />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                verified
              </span>
              <span className="text-label-md font-semibold text-primary">Made in India</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Products Container */}
      <section className="max-w-[1280px] w-full mx-auto px-margin pb-space-xl">
        {/* Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md pb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {(
              [
                { id: 'all', label: `All Products (${products.length})` },
                { id: 'cats', label: 'Cats' },
                { id: 'dogs', label: 'Dogs' },
                { id: 'cat-litter', label: 'Cat Litter' },
                { id: 'grooming', label: 'Grooming' },
              ] as const
            ).map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleCategoryChange(tab.id)}
                  className={
                    active
                      ? 'bg-primary-container text-on-primary text-label-md px-5 py-2.5 rounded-full font-bold shadow-sm transition-all hover:bg-primary shrink-0'
                      : 'bg-surface-container text-on-surface text-label-md px-5 py-2.5 rounded-full hover:bg-surface-container-high transition-colors font-medium shrink-0'
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <label className="text-label-md text-secondary" htmlFor="sort-select">
              Sort by:
            </label>
            <div className="relative inline-block">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface-container-low text-on-surface text-title-sm pl-4 pr-10 py-2 rounded-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option>Featured</option>
                <option>Bestsellers</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar (3 cols) & Product Matrix (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Faceted Sidebar Filters */}
          <aside className="hidden lg:flex flex-col lg:col-span-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <h2 className="text-title-sm text-on-surface font-bold uppercase tracking-wider">
                Filters
              </h2>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-secondary hover:text-primary text-label-sm uppercase tracking-wider underline"
              >
                Clear all
              </button>
            </div>

            {/* Pet Type */}
            <div className="flex flex-col gap-3">
              <span className="text-title-sm font-semibold text-on-surface">Pet Type</span>
              <div className="flex flex-col gap-2 text-body-md text-on-surface-variant">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={petFilter.cats}
                    onChange={(e) => setPetFilter((p) => ({ ...p, cats: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#104332]"
                    type="checkbox"
                  />
                  <span className="group-hover:text-primary transition-colors">
                    Cats ({catsCount})
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={petFilter.dogs}
                    onChange={(e) => setPetFilter((p) => ({ ...p, dogs: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#104332]"
                    type="checkbox"
                  />
                  <span className="group-hover:text-primary transition-colors">
                    Dogs ({dogsCount})
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={petFilter.dual}
                    onChange={(e) => setPetFilter((p) => ({ ...p, dual: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#104332]"
                    type="checkbox"
                  />
                  <span className="group-hover:text-primary transition-colors">
                    Dual-Pet Friendly ({dualCount})
                  </span>
                </label>
              </div>
            </div>

            <div className="w-full h-px bg-surface-container" />

            {/* Size & Volume */}
            <div className="flex flex-col gap-3">
              <span className="text-title-sm font-semibold text-on-surface">Size &amp; Volume</span>
              <div className="flex flex-wrap gap-2">
                {['5 kg', '10 kg', '200 ml', '150 ml', '80 wipes'].map((sz) => {
                  const active = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(active ? null : sz)}
                      className={
                        active
                          ? 'px-3.5 py-1.5 rounded-full text-label-md bg-primary-container text-on-primary font-semibold'
                          : 'px-3.5 py-1.5 rounded-full text-label-md bg-surface-container-high text-on-surface hover:bg-surface-variant font-semibold'
                      }
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-surface-container" />

            {/* Price Range */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-title-sm font-semibold text-on-surface">Price Range</span>
                <span className="text-label-md text-secondary font-medium">
                  ₹299 - ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                className="w-full accent-[#104332] cursor-pointer"
                max={1200}
                min={299}
                type="range"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
              <div className="flex justify-between text-label-sm text-outline">
                <span>₹299</span>
                <span>₹1,200</span>
              </div>
            </div>

            <div className="w-full h-px bg-surface-container" />

            {/* Formula Features */}
            <div className="flex flex-col gap-3">
              <span className="text-title-sm font-semibold text-on-surface">Formula Features</span>
              <div className="flex flex-col gap-2 text-body-md text-on-surface-variant">
                {['Activated Carbon', 'Fragrance Free', 'No-Rinse / Waterless', 'Biodegradable'].map(
                  (feat) => (
                    <label key={feat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feat)}
                        onChange={() => toggleFeature(feat)}
                        className="w-4 h-4 rounded accent-[#104332]"
                      />
                      <span className="group-hover:text-primary transition-colors">{feat}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Subscription Discount Callout */}
            <Link
              to="/account"
              className="bg-primary-container text-on-primary p-4 rounded-xl flex items-start gap-3 mt-2 hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-primary-fixed text-[24px]">
                autorenew
              </span>
              <div>
                <p className="text-title-sm font-bold text-on-primary">Subscribe &amp; Save 15%</p>
                <p className="text-body-sm text-on-primary-container mt-0.5">
                  Flexible litter &amp; grooming delivery schedule. Cancel anytime.
                </p>
              </div>
            </Link>
          </aside>

          {/* Products Matrix */}
          <div className="col-span-1 lg:col-span-9 flex flex-col gap-8">
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-surface-container-lowest rounded-2xl p-4 h-96 animate-pulse" />
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const isWishlisted = wishlist.includes(product.id);
                const isFirstLitter = product.slug === 'clumping-cat-litter';
                const activeVariant = isFirstLitter
                  ? product.variants.find((v) => v.label === litterPackVariant) ?? product.variants[0]
                  : product.variants[0];
                const displayPrice = activeVariant?.price ?? product.price;
                const displayVariant = activeVariant?.label ?? product.unitLabel;
                const isOutOfStock = activeVariant
                  ? !activeVariant.isAvailable || activeVariant.stockQuantity <= 0
                  : product.stockQuantity <= 0;

                return (
                  <article
                    key={product.id}
                    className="bg-surface-container-lowest rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group relative"
                  >
                    <button
                      type="button"
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className={`absolute top-6 right-6 z-10 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur flex items-center justify-center transition-all shadow-xs hover:scale-110 ${
                        isWishlisted ? 'text-error' : 'text-on-surface hover:text-error'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        favorite
                      </span>
                    </button>

                    <div className="flex flex-col">
                      <Link
                        to={`/product/${product.slug}`}
                        className="w-full aspect-[4/5] bg-surface-container-low rounded-xl overflow-hidden relative flex items-center justify-center p-4"
                      >
                        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                          {product.badge && (
                            <span
                              className={`text-label-sm uppercase px-2.5 py-1 rounded-full font-bold ${
                                product.badge === 'Best Value'
                                  ? 'bg-primary text-on-primary'
                                  : product.badge === 'Odour Control'
                                    ? 'bg-primary-container text-on-primary'
                                    : product.badge === 'Biodegradable'
                                      ? 'bg-secondary-container text-on-secondary-fixed'
                                      : 'bg-on-surface text-surface'
                              }`}
                            >
                              {product.badge}
                            </span>
                          )}
                          {product.secondaryBadge && (
                            <span
                              className={`text-label-sm uppercase px-2.5 py-0.5 rounded-full font-bold ${
                                product.secondaryBadge === 'Save ₹200'
                                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                  : 'bg-primary-fixed text-on-primary-fixed'
                              }`}
                            >
                              {product.secondaryBadge}
                            </span>
                          )}
                        </div>
                        <img
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          decoding="async"
                          loading="lazy"
                          src={product.image}
                        />
                      </Link>

                      <div className="pt-4 flex flex-col gap-1.5">
                        <span className="text-label-md uppercase tracking-wider text-on-surface-variant font-bold">
                          {product.kicker}
                        </span>
                        <Link to={`/product/${product.slug}`}>
                          <h3 className="text-headline-sm text-primary leading-tight font-medium hover:underline">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1.5 text-on-surface text-body-sm mt-0.5">
                          <div className="flex items-center text-[#d97706]">
                            {[1, 2, 3, 4].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[16px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                            ))}
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {product.rating >= 4.9 ? 'star' : 'star_half'}
                            </span>
                          </div>
                          <span className="text-label-md font-bold">{product.rating}</span>
                          <span className="text-secondary text-body-sm">
                            ({product.reviewCount} reviews)
                          </span>
                        </div>

                        {isFirstLitter ? (
                          <div className="flex items-center gap-2 pt-2">
                            {(['5 kg', '10 kg'] as const).map((variant) => (
                              <button
                                key={variant}
                                type="button"
                                onClick={() => setLitterPackVariant(variant)}
                                className={
                                  litterPackVariant === variant
                                    ? 'px-3 py-1 text-label-sm rounded-full bg-on-surface text-surface font-bold'
                                    : 'px-3 py-1 text-label-sm rounded-full bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors'
                                }
                              >
                                {variant}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-body-sm text-secondary pt-1 line-clamp-1">
                            {product.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-2 flex items-center justify-between border-t border-surface-container">
                      <div>
                        <span className="text-headline-sm font-bold text-on-surface">
                          ₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-label-sm text-outline">
                          {product.slug === 'clumping-cat-litter-10kg'
                            ? '₹120 / kg'
                            : 'Incl. of all taxes'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={async () => {
                          if (isOutOfStock) return;
                          try {
                            await addToCart(product, {
                              variantId: activeVariant?.id,
                              variantLabel: displayVariant,
                              unitPrice: displayPrice,
                            });
                            setAddedId(product.id);
                            setTimeout(() => setAddedId(null), 1500);
                          } catch {
                            // Ignore stock limit error cleanly without unhandled rejection
                          }
                        }}
                        className="bg-primary-container text-on-primary hover:bg-primary text-title-sm px-5 py-2.5 rounded-full font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isOutOfStock ? 'block' : addedId === product.id ? 'check' : 'add'}
                        </span>
                        <span>{isOutOfStock ? 'Sold out' : addedId === product.id ? 'Added' : 'Add'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            )}

            {filteredProducts.length === 0 && (
              apiStatus === 'offline' ? (
                <div
                  className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container"
                  data-purpose="offline-catalog-state"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">cloud_off</span>
                  </div>
                  <p className="text-headline-sm text-on-surface mb-2 font-bold">Backend Connection Unavailable</p>
                  <p className="text-body-md text-secondary mb-2 max-w-md mx-auto">
                    {apiErrorMessage || 'Unable to connect to the backend API or PostgreSQL database.'}
                  </p>
                  <p className="text-body-sm text-outline mb-6">
                    Check that the backend server is running on port 4000.
                  </p>
                  <button
                    type="button"
                    onClick={() => retryConnection()}
                    className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-title-sm font-semibold hover:bg-tertiary transition-colors shadow-sm inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    <span>Retry Connection</span>
                  </button>
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container">
                  <p className="text-headline-sm text-primary mb-2">No matching products</p>
                  <p className="text-body-md text-secondary mb-6">
                    Try clearing some filters to see our full range of pet wellness essentials.
                  </p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="bg-primary-container text-on-primary px-6 py-2.5 rounded-full text-title-sm"
                  >
                    Reset Filters
                  </button>
                </div>
              )
            )}

            {/* Pagination Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-surface-container">
              <span className="text-body-sm text-secondary">
                Showing 1–{filteredProducts.length} of {filteredProducts.length} essentials
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-outline opacity-50 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-container text-on-primary font-bold text-label-md"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-outline opacity-50 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance & Value Strip */}
      <section className="w-full bg-primary-container text-on-primary py-16 my-8">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-fixed mb-2">
                <span className="material-symbols-outlined text-[26px]">local_shipping</span>
              </div>
              <h4 className="text-title-md font-bold text-on-primary">Free Delivery &gt; ₹499</h4>
              <p className="text-body-sm text-on-primary-container">
                Swift direct dispatch across all pin codes in India. Cash on delivery readily
                available.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-fixed mb-2">
                <span className="material-symbols-outlined text-[26px]">filter_alt</span>
              </div>
              <h4 className="text-title-md font-bold text-on-primary">Activated Carbon</h4>
              <p className="text-body-sm text-on-primary-container">
                Micro-porous natural charcoal traps pungent ammonia odors instead of simply masking
                them.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-fixed mb-2">
                <span className="material-symbols-outlined text-[26px]">air</span>
              </div>
              <h4 className="text-title-md font-bold text-on-primary">99.9% Dust-Free</h4>
              <p className="text-body-sm text-on-primary-container">
                Multi-stage dedusted bentonite protects feline respiratory tracts and keeps floors
                clean.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-fixed mb-2">
                <span className="material-symbols-outlined text-[26px]">pets</span>
              </div>
              <h4 className="text-title-md font-bold text-on-primary">Veterinary Approved</h4>
              <p className="text-body-sm text-on-primary-container">
                Formulated strictly without artificial fragrances, bleach, harsh sulfates, or
                phthalates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pincode Checker */}
      <section className="max-w-[1280px] w-full mx-auto px-margin py-8 mb-8">
        <div className="bg-surface-container-low rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-label-md uppercase tracking-wider text-primary font-bold">
              Fast Fulfillment
            </span>
            <h3 className="text-headline-md text-on-surface mt-1">
              Check delivery availability to your doorstep
            </h3>
            <p className="text-body-md text-secondary mt-2">
              Enter your 6-digit pin code to check next-day dispatch and COD availability.
            </p>
          </div>
          <div className="w-full lg:w-auto flex-1 max-w-md">
            <form
              className="flex items-center gap-2 bg-surface-container-lowest p-1.5 rounded-full shadow-sm"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!/^[0-9]{6}$/.test(pincode)) return;
                try {
                  const res = await shippingService.checkPincode(pincode);
                  setPinMessage(
                    res.serviceable
                      ? `Delivery in ${res.estimatedDays} available for ${res.pincode}. ${res.codAvailable ? 'COD & Free shipping > ₹499 eligible!' : ''}`
                      : `PIN code ${res.pincode} is currently not serviceable.`
                  );
                } catch {
                  setPinMessage('Unable to verify PIN code right now.');
                }
              }}
            >
              <input
                className="flex-1 bg-transparent px-4 text-body-md text-on-surface focus:outline-none placeholder:text-outline"
                pattern="[0-9]{6}"
                placeholder="Enter 6-digit Pincode"
                required
                type="text"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value);
                  setPinMessage(null);
                }}
              />
              <button
                className="bg-on-surface text-surface hover:bg-primary px-6 py-3 rounded-full text-title-sm font-semibold transition-colors"
                type="submit"
              >
                Check
              </button>
            </form>
            {pinMessage && (
              <p className="mt-3 text-label-md text-on-primary-fixed-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary-container">
                  check_circle
                </span>
                {pinMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
