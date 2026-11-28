import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, User, ShoppingBag, X, Heart } from 'lucide-react';
import { STITCH_LOGO_URL } from '../../data/products';
import { useStore } from '../../context/StoreContext';

export const Header: React.FC = () => {
  const { products, cartCount, wishlistCount, isSearchOpen, setIsSearchOpen, setIsCartDrawerOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const navigate = useNavigate();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isSearchOpen && !mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, mobileMenuOpen, setIsSearchOpen]);

  const navItems = [
    { label: 'Cats', to: '/shop?category=cats' },
    { label: 'Dogs', to: '/shop?category=dogs' },
    { label: 'Cat Litter', to: '/shop?category=cat-litter' },
    { label: 'Grooming', to: '/shop?category=grooming' },
    { label: 'Our Story', to: '/our-story' },
  ];

  const filteredProducts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q) ||
            p.kicker.toLowerCase().includes(q)
        )
      : products.slice(0, 4);
  }, [products, deferredQuery]);

  return (
    <>
      {/* Top Announcement Bar */}
      <div
        className="w-full bg-[#0a271c] text-[#d6ede2] text-xs font-medium py-2.5 px-4 text-center tracking-wide border-b border-[#164a38]"
        data-purpose="announcement-bar"
      >
        Free delivery above ₹499 · Cash on delivery available · Made in India
      </div>

      {/* Main Sticky Header */}
      <header
        className="w-full bg-[#104332] text-white sticky top-0 z-50 transition-colors"
        data-purpose="navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Mobile Menu Button + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-white/90 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link className="flex items-center gap-3.5 group" to="/">
              <img
                src={STITCH_LOGO_URL}
                alt="The Sniff Co."
                className="h-9 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center space-x-9 text-sm font-medium text-white/90">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `hover:text-white transition-colors ${isActive && item.to === '/our-story' ? 'text-primary-fixed font-bold' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Icons (Search, Account, Cart) */}
          <div className="flex items-center space-x-5 sm:space-x-6 text-white/90">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setIsSearchOpen(true)}
              className="hover:text-white p-1 transition-colors"
            >
              <Search className="w-5 h-5" strokeWidth={1.8} />
            </button>

            <Link
              aria-label="Wishlist"
              to="/wishlist"
              className="hover:text-white relative p-1 flex items-center transition-colors"
              title="Saved Pet Essentials"
            >
              <Heart className="w-5 h-5" strokeWidth={1.8} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs animate-scale-in">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              aria-label="User Account"
              to="/account"
              className="hover:text-white p-1 transition-colors"
            >
              <User className="w-5 h-5" strokeWidth={1.8} />
            </Link>

            <button
              type="button"
              aria-label="Shopping Cart"
              onClick={() => setIsCartDrawerOpen(true)}
              className="hover:text-white relative p-1 flex items-center transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.8} />
              <span className="ml-1.5 text-xs font-semibold">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#104332] text-white h-full p-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/15">
                <img src={STITCH_LOGO_URL} alt="The Sniff Co." className="h-8 w-auto" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-white/80 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="mt-6 flex flex-col space-y-4 text-base font-medium">
                <Link
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 hover:text-primary-fixed transition-colors"
                >
                  Shop All Products
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1.5 hover:text-primary-fixed transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="pt-6 border-t border-white/15 flex flex-col gap-3 text-sm">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-4 rounded-full bg-white text-[#104332] font-semibold text-center"
              >
                Sign In / Register
              </Link>
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-4 rounded-full border border-white/30 text-white font-semibold text-center"
              >
                My Account &amp; Subscriptions
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 z-10">
            <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
              <Search className="w-5 h-5 text-neutral-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cat litter, dog shampoo, dry foam, wipes..."
                className="flex-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigate(`/product/${p.slug}`);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 text-left transition-colors"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover bg-neutral-100 border border-neutral-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{p.name}</p>
                    <p className="text-xs text-neutral-500">{p.kicker}</p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">₹ {p.price}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-neutral-500 py-6 text-center">
                  No products found matching &ldquo;{searchQuery}&rdquo;.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
