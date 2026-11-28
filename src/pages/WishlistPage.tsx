import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { CircularLoader } from '../components/ui/CircularLoader';
import { PageTransitionLoader } from '../components/ui/PageTransitionLoader';

export const WishlistPage: React.FC = () => {
  const {
    products,
    productsLoading,
    wishlist,
    removeFromWishlist,
    addToCart,
    setIsCartDrawerOpen,
    isProductAdding,
  } = useStore();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddToCart = async (product: Product) => {
    const chosenVariantLabel = selectedVariants[product.id];
    const variant = chosenVariantLabel
      ? product.variants.find((v) => v.label === chosenVariantLabel) ?? product.variants[0]
      : product.variants[0];

    try {
      await addToCart(product, {
        variantId: variant?.id,
        variantLabel: variant?.label,
        unitPrice: variant?.price ?? product.price,
      });
      setAddedId(product.id);
      setIsCartDrawerOpen(true);
      setTimeout(() => setAddedId(null), 1800);
    } catch {
      // Handled cleanly
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface min-h-[70vh]">
      {/* Breadcrumb & Header */}
      <section className="max-w-[1280px] w-full mx-auto px-margin pt-8 pb-6">
        <nav className="flex items-center gap-space-xs text-on-surface-variant text-label-md pb-4 tracking-wider uppercase">
          <Link className="hover:text-primary transition-colors" to="/">
            Home
          </Link>
          <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
          <span className="text-on-surface font-semibold">Wishlist</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-container">
          <div>
            <h1 className="font-heading-syne text-headline-lg font-bold text-on-surface tracking-tight">
              My Saved Essentials
            </h1>
            <p className="text-body-md text-secondary mt-1">
              Curated items ready for fast reordering and regular delivery.
            </p>
          </div>
          <span className="text-title-sm text-outline font-semibold bg-surface-container-low px-4 py-1.5 rounded-full self-start sm:self-auto">
            {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'} saved
          </span>
        </div>
      </section>

      {/* Main Wishlist Content */}
      <main className="max-w-[1280px] w-full mx-auto px-margin pb-20">
        {productsLoading && products.length === 0 ? (
          <PageTransitionLoader variant="section" message="Loading your saved essentials..." />
        ) : wishlistedProducts.length === 0 ? (
          <div
            className="bg-surface-container-lowest rounded-3xl p-12 sm:p-16 text-center border border-surface-container max-w-2xl mx-auto my-6 shadow-xs"
            data-purpose="empty-wishlist-state"
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-3xl">favorite_border</span>
            </div>
            <h2 className="font-heading-syne text-headline-sm font-bold text-on-surface mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-body-md text-secondary mb-8 max-w-md mx-auto leading-relaxed">
              Explore our bentonite clumping litter, hypoallergenic dog shampoos, and activated
              carbon sprays. Save your favorite products here for easy reordering.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#104332] hover:bg-[#0c3326] text-white px-8 py-3.5 rounded-full text-title-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
            >
              <span>Explore All Essentials</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {wishlistedProducts.map((product) => {
              const selectedVariantLabel =
                selectedVariants[product.id] ?? product.variants[0]?.label ?? product.unitLabel;
              const activeVariant =
                product.variants.find((v) => v.label === selectedVariantLabel) ??
                product.variants[0];
              const displayPrice = activeVariant?.price ?? product.price;
              const isOutOfStock = activeVariant
                ? !activeVariant.isAvailable || activeVariant.stockQuantity <= 0
                : product.stockQuantity <= 0;

              return (
                <article
                  key={product.id}
                  className="bg-surface-container-lowest rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group relative border border-surface-container"
                  data-purpose="wishlist-item-card"
                >
                  {/* Remove Button */}
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    title="Remove from wishlist"
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-7 right-7 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur text-error hover:bg-error-container hover:text-on-error-container flex items-center justify-center transition-colors shadow-xs"
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </button>

                  <div>
                    {/* Image Container with Badges */}
                    <Link
                      to={`/product/${product.slug}`}
                      className="w-full aspect-[4/3] bg-surface-container-low rounded-2xl overflow-hidden relative flex items-center justify-center p-4 mb-4 block group"
                    >
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {product.badge && (
                          <span className="bg-primary text-on-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {product.badge}
                          </span>
                        )}
                        <span className="bg-surface-container-highest text-on-surface text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                          {product.petCategory === 'cats'
                            ? 'Cats'
                            : product.petCategory === 'dogs'
                              ? 'Dogs'
                              : 'Dual Pet'}
                        </span>
                      </div>
                      <img
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        src={product.image}
                        decoding="async"
                      />
                    </Link>

                    {/* Product Details */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1">
                        {product.kicker || 'Wellness Essential'}
                      </span>
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="font-heading-syne text-title-md font-bold text-on-surface hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-body-sm text-secondary line-clamp-2 mt-1">
                        {product.subtitle}
                      </p>
                    </div>

                    {/* Variant Selector (if multi-variant) */}
                    {product.variants.length > 1 && (
                      <div className="mt-4 pt-3 border-t border-surface-container">
                        <label className="text-label-sm text-outline font-semibold block mb-1.5 uppercase tracking-wide">
                          Pack Size
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {product.variants.map((variant) => (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() =>
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  [product.id]: variant.label,
                                }))
                              }
                              className={`px-3 py-1 text-label-sm font-semibold rounded-full border transition-all ${
                                selectedVariantLabel === variant.label
                                  ? 'bg-[#104332] text-white border-[#104332]'
                                  : 'bg-surface-container-low text-secondary border-surface-container hover:border-outline'
                              }`}
                            >
                              {variant.label} · ₹{variant.price}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-surface-container flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-headline-sm font-bold text-on-surface">
                          ₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-label-sm text-outline">
                          {selectedVariantLabel} · Incl. taxes
                        </span>
                      </div>
                      <span
                        className={`text-label-sm font-semibold px-2.5 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-primary-fixed text-on-primary-fixed'
                        }`}
                      >
                        {isOutOfStock ? 'Out of stock' : 'In Stock'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/product/${product.slug}`}
                        className="py-2.5 px-3 rounded-full border border-surface-container-high text-center text-label-md font-semibold text-secondary hover:text-on-surface hover:border-outline transition-colors"
                      >
                        View Details
                      </Link>
                      <button
                        type="button"
                        disabled={isOutOfStock || isProductAdding(product.id)}
                        onClick={() => handleAddToCart(product)}
                        className="py-2.5 px-3 rounded-full bg-[#104332] hover:bg-[#0c3326] text-white text-label-md font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                      >
                        {isProductAdding(product.id) ? (
                          <CircularLoader size="xs" color="white" label="Adding to bag..." />
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">
                              {addedId === product.id ? 'check' : 'shopping_bag'}
                            </span>
                            <span>{addedId === product.id ? 'Added ✓' : 'Add to Bag'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
