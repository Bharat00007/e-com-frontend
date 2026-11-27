import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, CartTotals, Product, PetCategory, ProductCategory } from '../types/store';
import { ApiError } from '../services/apiClient';
import {
    BackendCustomer,
    authService,
    cartService,
    productService,
    wishlistService,
} from '../services/storeServices';

interface BackendProduct {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    kicker: string;
    subtitle: string;
    description: string;
    petCategory: 'CATS' | 'DOGS' | 'BOTH';
    badge?: string | null;
    secondaryBadge?: string | null;
    features: string[];
    ratingAverage: number;
    reviewCount: number;
    subscriptionDiscountPercent: number;
    category?: { slug: string };
    images?: Array<{ url: string; isPrimary: boolean }>;
    variants: Array<{
        id: string;
        sku: string;
        packSizeLabel: string;
        price: number;
        salePrice?: number | null;
        pricePerUnit?: string | null;
        stockQuantity: number;
        isAvailable: boolean;
        isDefault: boolean;
    }>;
}

interface BackendCartPayload {
    id: string;
    couponCode: string | null;
    items: Array<{
        id: string;
        variantId: string;
        quantity: number;
        isSubscription: boolean;
        frequencyWeeks?: number | null;
        variant: {
            id: string;
            packSizeLabel: string;
            price: number;
            salePrice?: number | null;
            product: {
                id: string;
                name: string;
                images?: Array<{ url: string }>;
            };
        };
    }>;
    totals: CartTotals;
}

function mapBackendProduct(p: BackendProduct): Product {
    const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
    const petCat: PetCategory =
        p.petCategory === 'CATS' ? 'cats' : p.petCategory === 'DOGS' ? 'dogs' : 'both';
    const catSlug = (p.category?.slug ?? 'cat-litter') as ProductCategory;
    const primaryImg = p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url ?? '';

    return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        shortName: p.shortName,
        kicker: p.kicker,
        subtitle: p.subtitle,
        description: p.description,
        petCategory: petCat,
        category: catSlug,
        price: defaultVariant ? (defaultVariant.salePrice ?? defaultVariant.price) : 0,
        unitLabel: defaultVariant?.packSizeLabel ?? '',
        defaultVariantId: defaultVariant?.id ?? '',
        stockQuantity: defaultVariant?.stockQuantity ?? 0,
        badge: p.badge ?? undefined,
        secondaryBadge: p.secondaryBadge ?? undefined,
        rating: p.ratingAverage,
        reviewCount: p.reviewCount,
        image: primaryImg,
        gallery: p.images?.map((i) => i.url) ?? [],
        features: p.features ?? [],
        variants: p.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            label: v.packSizeLabel,
            price: v.salePrice ?? v.price,
            pricePerUnit: v.pricePerUnit ?? undefined,
            stockQuantity: v.stockQuantity,
            isAvailable: v.isAvailable,
            isDefault: v.isDefault,
        })),
        subscriptionDiscountPercent: p.subscriptionDiscountPercent,
    };
}

function mapBackendCartItems(payload: BackendCartPayload): CartItem[] {
    return payload.items.map((item) => ({
        id: item.id,
        productId: item.variant.product.id,
        variantId: item.variantId,
        name: item.variant.product.name,
        variantLabel: item.variant.packSizeLabel,
        image: item.variant.product.images?.[0]?.url ?? '',
        unitPrice: item.variant.salePrice ?? item.variant.price,
        quantity: item.quantity,
        isSubscription: item.isSubscription,
        frequencyWeeks: item.frequencyWeeks ?? 4,
    }));
}

interface StoreContextValue {
    products: Product[];
    productsLoading: boolean;
    cart: CartItem[];
    couponCode: string | null;
    cartTotals: CartTotals;
    wishlist: string[];
    customer: BackendCustomer | null;
    authLoading: boolean;
    setCustomer: (customer: BackendCustomer | null) => void;
    logout: () => Promise<void>;
    refreshCart: () => Promise<void>;
    apiStatus: 'checking' | 'connected' | 'offline';
    apiErrorMessage: string | null;
    retryConnection: () => Promise<void>;
    isSearchOpen: boolean;
    setIsSearchOpen: (open: boolean) => void;
    isCartDrawerOpen: boolean;
    setIsCartDrawerOpen: (open: boolean) => void;
    addToCart: (
        product: Product,
        options?: {
            quantity?: number;
            variantId?: string;
            variantLabel?: string;
            unitPrice?: number;
            isSubscription?: boolean;
            frequencyWeeks?: number;
        }
    ) => Promise<void>;
    updateQuantity: (itemId: string, delta: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    toggleItemSubscription: (itemId: string) => Promise<void>;
    applyCouponCode: (code: string) => Promise<void>;
    clearCart: () => void;
    toggleWishlist: (productId: string) => Promise<void>;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    wishlistCount: number;
    cartCount: number;
    subtotal: number;
    subscriptionDiscount: number;
    shippingFee: number;
    total: number;
}

const EMPTY_TOTALS: CartTotals = {
    subtotal: 0,
    subscriptionDiscount: 0,
    couponDiscount: 0,
    shippingCharge: 0,
    taxAmount: 0,
    totalAmount: 0,
    totalSavings: 0,
};

function computeOptimisticTotals(items: CartItem[]): CartTotals {
    const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const subscriptionDiscount = items.reduce((acc, item) => {
        if (!item.isSubscription) return acc;
        return acc + Math.round(item.unitPrice * item.quantity * 0.15);
    }, 0);
    const shippingCharge = subtotal >= 499 || items.length === 0 ? 0 : 49;
    const totalAmount = Math.max(0, subtotal - subscriptionDiscount + shippingCharge);
    return {
        subtotal,
        subscriptionDiscount,
        couponDiscount: 0,
        shippingCharge,
        taxAmount: 0,
        totalAmount,
        totalSavings: subscriptionDiscount,
    };
}

const GUEST_WISHLIST_KEY = 'sniff_co_guest_wishlist';

function getGuestWishlist(): string[] {
    try {
        const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveGuestWishlist(ids: string[]) {
    try {
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
    } catch {
        // Ignore quota error
    }
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [cartTotals, setCartTotals] = useState<CartTotals>(EMPTY_TOTALS);
    const [wishlist, setWishlist] = useState<string[]>(() => getGuestWishlist());
    const [customer, setCustomer] = useState<BackendCustomer | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
    const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

    const syncCartPayload = useCallback((payload: BackendCartPayload) => {
        setCart(mapBackendCartItems(payload));
        setCouponCode(payload.couponCode);
        setCartTotals(payload.totals);
    }, []);

    const refreshCart = useCallback(async () => {
        try {
            const payload = (await cartService.getCart()) as BackendCartPayload;
            syncCartPayload(payload);
        } catch {
            // Keep current state if cart fetch fails
        }
    }, [syncCartPayload]);

    const loadProducts = useCallback(async () => {
        try {
            setProductsLoading(true);
            const rawProducts = (await productService.getAll()) as BackendProduct[];
            if (Array.isArray(rawProducts)) {
                setProducts(rawProducts.map(mapBackendProduct));
            }
            setApiStatus('connected');
            setApiErrorMessage(null);
        } catch (err) {
            setApiStatus('offline');
            if (err instanceof ApiError) {
                if (err.code === 'NETWORK_ERROR' || err.status === 0) {
                    setApiErrorMessage(
                        'Backend server is currently offline or unreachable on http://localhost:4000. Start the backend server to continue.'
                    );
                } else if (err.status === 503) {
                    setApiErrorMessage(
                        'PostgreSQL database is currently disconnected. Please verify your database connection.'
                    );
                } else {
                    setApiErrorMessage(err.message || 'Unable to load products from backend API.');
                }
            } else {
                setApiErrorMessage('Unable to connect to backend service.');
            }
        } finally {
            setProductsLoading(false);
        }
    }, []);

    const retryConnection = useCallback(async () => {
        setApiStatus('checking');
        setApiErrorMessage(null);
        await Promise.all([loadProducts(), refreshCart()]);
    }, [loadProducts, refreshCart]);

    useEffect(() => {
        let active = true;

        const loadSession = async () => {
            try {
                const session = await authService.getSession();
                if (active) {
                    setCustomer(session.customer);
                    if (session.authenticated && session.customer) {
                        const guestItems = getGuestWishlist();
                        if (guestItems.length > 0) {
                            try {
                                await wishlistService.merge(guestItems);
                                localStorage.removeItem(GUEST_WISHLIST_KEY);
                            } catch {
                                // Ignore merge error
                            }
                        }
                        const wl = (await wishlistService.get()) as { items?: Array<{ productId: string }> };
                        if (active && wl?.items) {
                            setWishlist(wl.items.map((i) => i.productId));
                        }
                    } else {
                        setWishlist(getGuestWishlist());
                    }
                }
            } catch {
                if (active) {
                    setCustomer(null);
                    setWishlist(getGuestWishlist());
                }
            } finally {
                if (active) setAuthLoading(false);
            }
        };

        void Promise.all([loadSession(), loadProducts(), refreshCart()]);

        return () => {
            active = false;
        };
    }, [loadProducts, refreshCart]);

    const handleSetCustomer = useCallback(async (newCustomer: BackendCustomer | null) => {
        setCustomer(newCustomer);
        if (newCustomer) {
            const guestItems = getGuestWishlist();
            if (guestItems.length > 0) {
                try {
                    await wishlistService.merge(guestItems);
                    localStorage.removeItem(GUEST_WISHLIST_KEY);
                } catch {
                    // Ignore merge error
                }
            }
            try {
                const wl = (await wishlistService.get()) as { items?: Array<{ productId: string }> };
                if (wl?.items) {
                    setWishlist(wl.items.map((i) => i.productId));
                }
            } catch {
                // Ignore error
            }
        } else {
            setWishlist(getGuestWishlist());
        }
    }, []);

    // Background auto-reconnect polling when offline
    useEffect(() => {
        if (apiStatus !== 'offline') return;
        const timer = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:4000/api/health').catch(() => null);
                if (res && res.ok) {
                    void Promise.all([loadProducts(), refreshCart()]);
                }
            } catch {
                // Next interval
            }
        }, 3000);
        return () => clearInterval(timer);
    }, [apiStatus, loadProducts, refreshCart]);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            // Ignore error
        }
        setCustomer(null);
        setWishlist(getGuestWishlist());
        await refreshCart();
    }, [refreshCart]);

    const addToCart: StoreContextValue['addToCart'] = useCallback(
        async (product, options) => {
            const chosenVariant =
                product.variants.find((v) => v.id === options?.variantId || v.label === options?.variantLabel) ??
                product.variants[0];
            const variantId = chosenVariant?.id ?? product.defaultVariantId;
            const quantity = options?.quantity ?? 1;
            const isSubscription = options?.isSubscription ?? false;
            const frequencyWeeks = options?.frequencyWeeks ?? 4;
            const unitPrice =
                options?.unitPrice ?? chosenVariant?.price ?? product.price;

            // Snapshot prior state for atomic rollback on network error
            const prevCart = cart;
            const prevTotals = cartTotals;

            // Check if item already exists in cart
            const existingIdx = cart.findIndex(
                (i) => i.variantId === variantId && i.isSubscription === isSubscription
            );

            let nextCart: CartItem[];
            if (existingIdx > -1) {
                nextCart = cart.map((item, idx) =>
                    idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                const optimisticItem: CartItem = {
                    id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    productId: product.id,
                    variantId,
                    name: product.name,
                    variantLabel: chosenVariant?.label ?? product.unitLabel ?? '',
                    image: product.image,
                    unitPrice,
                    quantity,
                    isSubscription,
                    frequencyWeeks,
                };
                nextCart = [optimisticItem, ...cart];
            }

            // Immediately update visible cart state & totals, and pop open the right-side drawer
            setCart(nextCart);
            setCartTotals(computeOptimisticTotals(nextCart));
            setIsCartDrawerOpen(true);

            try {
                const payload = (await cartService.addItem({
                    variantId,
                    quantity,
                    isSubscription,
                    frequencyWeeks,
                })) as BackendCartPayload;
                syncCartPayload(payload);
            } catch (err) {
                setCart(prevCart);
                setCartTotals(prevTotals);
                throw err;
            }
        },
        [cart, cartTotals, syncCartPayload]
    );

    const updateQuantity = useCallback(
        async (itemId: string, delta: number) => {
            const existing = cart.find((i) => i.id === itemId);
            if (!existing) return;
            const nextQty = existing.quantity + delta;

            const prevCart = cart;
            const prevTotals = cartTotals;

            let nextCart: CartItem[];
            if (nextQty <= 0) {
                nextCart = cart.filter((i) => i.id !== itemId);
            } else {
                nextCart = cart.map((i) => (i.id === itemId ? { ...i, quantity: nextQty } : i));
            }

            setCart(nextCart);
            setCartTotals(computeOptimisticTotals(nextCart));

            try {
                const payload = (await cartService.updateItem(itemId, {
                    quantity: nextQty,
                })) as BackendCartPayload;
                syncCartPayload(payload);
            } catch (err) {
                setCart(prevCart);
                setCartTotals(prevTotals);
                throw err;
            }
        },
        [cart, cartTotals, syncCartPayload]
    );

    const removeFromCart = useCallback(
        async (itemId: string) => {
            const prevCart = cart;
            const prevTotals = cartTotals;

            const nextCart = cart.filter((i) => i.id !== itemId);
            setCart(nextCart);
            setCartTotals(computeOptimisticTotals(nextCart));

            try {
                const payload = (await cartService.removeItem(itemId)) as BackendCartPayload;
                syncCartPayload(payload);
            } catch (err) {
                setCart(prevCart);
                setCartTotals(prevTotals);
                throw err;
            }
        },
        [cart, cartTotals, syncCartPayload]
    );

    const toggleItemSubscription = useCallback(async (itemId: string) => {
        const existing = cart.find((i) => i.id === itemId);
        if (!existing) return;
        const payload = (await cartService.updateItem(itemId, {
            isSubscription: !existing.isSubscription,
        })) as BackendCartPayload;
        syncCartPayload(payload);
    }, [cart, syncCartPayload]);

    const applyCouponCode = useCallback(async (code: string) => {
        const payload = (await cartService.applyCoupon(code)) as BackendCartPayload;
        syncCartPayload(payload);
    }, [syncCartPayload]);

    const clearCart = useCallback(() => {
        setCart([]);
        setCouponCode(null);
        setCartTotals(EMPTY_TOTALS);
    }, []);

    const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

    const addToWishlist = useCallback(async (productId: string) => {
        if (wishlist.includes(productId)) return;
        const next = [...wishlist, productId];
        setWishlist(next);

        if (customer) {
            try {
                await wishlistService.add(productId);
            } catch (err) {
                setWishlist(wishlist);
                throw err;
            }
        } else {
            saveGuestWishlist(next);
        }
    }, [customer, wishlist]);

    const removeFromWishlist = useCallback(async (productId: string) => {
        if (!wishlist.includes(productId)) return;
        const next = wishlist.filter((id) => id !== productId);
        setWishlist(next);

        if (customer) {
            try {
                await wishlistService.remove(productId);
            } catch (err) {
                setWishlist(wishlist);
                throw err;
            }
        } else {
            saveGuestWishlist(next);
        }
    }, [customer, wishlist]);

    const toggleWishlist = useCallback(async (productId: string) => {
        const isPresent = wishlist.includes(productId);
        const next = isPresent
            ? wishlist.filter((id) => id !== productId)
            : [...new Set([...wishlist, productId])];
        setWishlist(next);

        if (customer) {
            try {
                const res = await wishlistService.toggle(productId);
                setWishlist((current) =>
                    res.added ? [...new Set([...current, productId])] : current.filter((id) => id !== productId)
                );
            } catch (err) {
                setWishlist(wishlist);
                throw err;
            }
        } else {
            saveGuestWishlist(next);
        }
    }, [customer, wishlist]);

    const cartCount = useMemo(
        () => cart.reduce((acc, item) => acc + item.quantity, 0),
        [cart]
    );

    const contextValue = useMemo<StoreContextValue>(
        () => ({
            products,
            productsLoading,
            cart,
            couponCode,
            cartTotals,
            wishlist,
            customer,
            authLoading,
            setCustomer: handleSetCustomer,
            logout,
            refreshCart,
            apiStatus,
            apiErrorMessage,
            retryConnection,
            isSearchOpen,
            setIsSearchOpen,
            isCartDrawerOpen,
            setIsCartDrawerOpen,
            addToCart,
            updateQuantity,
            removeFromCart,
            toggleItemSubscription,
            applyCouponCode,
            clearCart,
            toggleWishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            wishlistCount: wishlist.length,
            cartCount,
            subtotal: cartTotals.subtotal,
            subscriptionDiscount: cartTotals.subscriptionDiscount,
            shippingFee: cartTotals.shippingCharge,
            total: cartTotals.totalAmount,
        }),
        [
            products,
            productsLoading,
            cart,
            couponCode,
            cartTotals,
            wishlist,
            customer,
            authLoading,
            handleSetCustomer,
            logout,
            refreshCart,
            apiStatus,
            apiErrorMessage,
            retryConnection,
            isSearchOpen,
            isCartDrawerOpen,
            addToCart,
            updateQuantity,
            removeFromCart,
            toggleItemSubscription,
            applyCouponCode,
            clearCart,
            toggleWishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            cartCount,
        ]
    );

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
        </StoreContext.Provider>
    );
};

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be used inside StoreProvider');
    return ctx;
}
