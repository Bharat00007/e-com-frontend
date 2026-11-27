import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    productService,
    cartService,
    authService,
    wishlistService,
    BackendCustomer,
} from '../services/storeServices';
import {
    ApiError,
    API_BASE_URL,
    purgeLegacyClientAuthAndCartCaches,
    resetInMemoryCsrfToken,
} from '../services/apiClient';
import type {
    Product,
    ProductVariant,
    CartItem,
    CartTotals,
    PetCategory,
    ProductCategory,
} from '../types/store';

export type { Product, ProductVariant, CartItem, CartTotals };

export interface BackendProduct {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    kicker?: string | null;
    subtitle?: string | null;
    description?: string | null;
    petCategory?: string | null;
    category?: { name: string; slug?: string } | null;
    price: number;
    originalPrice?: number | null;
    ratingAverage: number;
    ratingCount: number;
    images?: Array<{ id?: string; url: string; isPrimary?: boolean; sortOrder?: number }>;
    features?: string[];
    benefits?: string[];
    ingredients?: string | null;
    usageInstructions?: string | null;
    variants?: Array<{
        id: string;
        sku?: string;
        packSizeLabel: string;
        price: number;
        salePrice?: number | null;
        isAvailable: boolean;
        stockQuantity: number;
        isDefault?: boolean;
    }>;
    isBestseller: boolean;
    isFeatured: boolean;
    badgeLabel?: string | null;
    badge?: string | null;
    secondaryBadge?: string | null;
    subscriptionDiscountPercent: number;
}

interface BackendCartPayload {
    id: string | null;
    couponCode: string | null;
    items: Array<{
        id: string;
        variantId: string;
        quantity: number;
        isSubscription: boolean;
        frequencyWeeks?: number;
        variant: {
            id: string;
            label?: string;
            packSizeLabel?: string;
            price: number;
            salePrice?: number | null;
            product: {
                id: string;
                name: string;
                images: Array<{ url: string }>;
            };
        };
    }>;
    totals: CartTotals;
}

function mapBackendProduct(bp: BackendProduct): Product {
    const primaryImg = bp.images?.find((img) => img.isPrimary)?.url;
    const firstImg = bp.images?.[0]?.url;
    const defaultVariant = bp.variants?.[0];
    const unitLabel = defaultVariant?.packSizeLabel ?? 'Standard';

    const petCategory: PetCategory =
        bp.petCategory?.toLowerCase() === 'dogs'
            ? 'dogs'
            : bp.petCategory?.toLowerCase() === 'both'
            ? 'both'
            : 'cats';

    const categorySlug =
        bp.category?.slug ??
        bp.category?.name?.toLowerCase().replace(/\s+/g, '-') ??
        'cat-litter';
    const category: ProductCategory = categorySlug.includes('groom')
        ? 'grooming'
        : categorySlug.includes('home')
        ? 'home-care'
        : 'cat-litter';

    return {
        id: bp.id,
        slug: bp.slug,
        name: bp.name,
        shortName: bp.shortName,
        kicker:
            bp.kicker ??
            (petCategory === 'cats' ? 'For Cats · Low-dust' : 'For Dogs · Natural'),
        subtitle: bp.subtitle ?? (bp.description ? bp.description.slice(0, 100) : ''),
        description: bp.description ?? '',
        petCategory,
        category,
        price: defaultVariant?.price ?? bp.price,
        originalPrice: bp.originalPrice ?? undefined,
        unitLabel,
        defaultVariantId: defaultVariant?.id ?? '',
        stockQuantity: defaultVariant?.stockQuantity ?? 100,
        badge: bp.badge ?? bp.badgeLabel ?? (bp.isBestseller ? 'Bestseller' : undefined),
        secondaryBadge: bp.secondaryBadge ?? 'Made in India',
        rating: bp.ratingAverage,
        reviewCount: bp.ratingCount,
        image: primaryImg ?? firstImg ?? '/placeholder-product.png',
        gallery: bp.images?.map((img) => img.url) ?? [],
        images: bp.images?.map((img) => img.url) ?? [],
        features:
            Array.isArray(bp.features) && bp.features.length > 0
                ? bp.features
                : ['Natural Formula', 'Safe & Tested'],
        keyBenefits: Array.isArray(bp.benefits) ? bp.benefits : [],
        ingredients: bp.ingredients ?? '',
        usageInstructions: bp.usageInstructions ?? '',
        variants: (bp.variants ?? []).map((v) => ({
            id: v.id,
            sku: v.sku ?? `SKU-${v.id.slice(-6)}`,
            label: v.packSizeLabel,
            price: v.price,
            originalPrice: v.salePrice ? v.price : undefined,
            isAvailable: v.isAvailable,
            stockQuantity: v.stockQuantity,
            isDefault: v.isDefault,
        })),
        isBestseller: bp.isBestseller,
        isFeatured: bp.isFeatured,
        subscriptionDiscountPercent: bp.subscriptionDiscountPercent,
    };
}

function mapBackendCartItems(payload: BackendCartPayload): CartItem[] {
    if (!payload || !Array.isArray(payload.items)) return [];
    return payload.items.map((item) => {
        const v = item.variant;
        const p = v.product;
        const img = p.images?.[0]?.url ?? '/placeholder-product.png';
        const unitPrice = v.salePrice ?? v.price;
        return {
            id: item.id,
            productId: p.id,
            variantId: item.variantId,
            name: p.name,
            variantLabel: v.packSizeLabel ?? v.label ?? '',
            image: img,
            unitPrice,
            quantity: item.quantity,
            isSubscription: item.isSubscription,
            frequencyWeeks: item.frequencyWeeks,
        };
    });
}

export type AuthStatus =
    | 'initializing'
    | 'unauthenticated'
    | 'authenticating'
    | 'authenticated'
    | 'session_expired'
    | 'error';

export interface StoreContextValue {
    products: Product[];
    productsLoading: boolean;
    cart: CartItem[];
    couponCode: string | null;
    cartTotals: CartTotals;
    wishlist: string[];
    customer: BackendCustomer | null;
    authStatus: AuthStatus;
    authLoading: boolean;
    cartSyncError: string | null;
    setCustomer: (customer: BackendCustomer | null) => Promise<void>;
    completeAuthenticatedLogin: (
        customer: BackendCustomer,
        options?: { alreadyMergedOnLogin?: boolean }
    ) => Promise<{ sessionVerified: boolean; cartSyncError?: string }>;
    logout: () => Promise<void>;
    refreshCart: () => Promise<void>;
    retryCartMerge: () => Promise<void>;
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
            variantId?: string;
            variantLabel?: string;
            unitPrice?: number;
            quantity?: number;
            isSubscription?: boolean;
            frequencyWeeks?: number;
        }
    ) => Promise<void>;
    updateQuantity: (itemId: string, delta: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    toggleItemSubscription: (itemId: string) => Promise<void>;
    applyCouponCode: (code: string) => Promise<void>;
    clearCart: () => Promise<void>;
    isItemUpdating: (itemId: string) => boolean;
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
    purgeLegacyClientAuthAndCartCaches();

    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [cartTotals, setCartTotals] = useState<CartTotals>(EMPTY_TOTALS);
    const [wishlist, setWishlist] = useState<string[]>(() => getGuestWishlist());
    const [customer, setCustomer] = useState<BackendCustomer | null>(null);
    const [authStatus, setAuthStatus] = useState<AuthStatus>('initializing');
    const [cartSyncError, setCartSyncError] = useState<string | null>(null);
    const authLoading = authStatus === 'initializing';
    const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
    const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [updatingItemIds, setUpdatingItemIds] = useState<Set<string>>(new Set());

    // In-flight mutex to prevent duplicate Add to Cart triggers
    const inFlightAddRef = useRef<Set<string>>(new Set());

    // Monotonic cart version counter — incremented on every mutation so background GET /cart
    // responses never overwrite newer add/update/remove/merge state.
    const cartVersionRef = useRef<number>(0);

    const isItemUpdating = useCallback((itemId: string) => updatingItemIds.has(itemId), [updatingItemIds]);

    const syncCartPayload = useCallback((payload: BackendCartPayload, isMutation = false) => {
        if (!payload || !Array.isArray(payload.items)) return;
        const mappedItems = mapBackendCartItems(payload);
        setCart(mappedItems);
        setCouponCode(payload.couponCode ?? null);
        setCartTotals(payload.totals ?? EMPTY_TOTALS);
        setCartSyncError(null);
        if (isMutation) {
            cartVersionRef.current += 1;
        }
    }, []);

    const refreshCart = useCallback(async () => {
        const versionAtStart = cartVersionRef.current;
        try {
            const payload = (await cartService.getCart()) as BackendCartPayload;
            if (cartVersionRef.current === versionAtStart) {
                syncCartPayload(payload);
            }
        } catch (err) {
            // Retain existing valid cart state; do not replace with empty cart on transient failure
            if (err instanceof ApiError && err.status === 401) {
                setAuthStatus('session_expired');
            }
        }
    }, [syncCartPayload]);

    const productsLoadedRef = useRef(false);

    const loadProducts = useCallback(async (forceLoading = false) => {
        if (forceLoading || !productsLoadedRef.current) {
            setProductsLoading(true);
        }
        try {
            const rawProducts = (await productService.getAll()) as BackendProduct[];
            if (Array.isArray(rawProducts) && rawProducts.length > 0) {
                setProducts(rawProducts.map(mapBackendProduct));
                productsLoadedRef.current = true;
            }
            setApiStatus('connected');
            setApiErrorMessage(null);
        } catch (err) {
            if (!productsLoadedRef.current) {
                setApiStatus('offline');
                if (err instanceof ApiError) {
                    if (err.code === 'NETWORK_ERROR' || err.status === 0) {
                        setApiErrorMessage(
                            'Backend server is currently offline or unreachable. Please verify your connection.'
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

    const retryCartMerge = useCallback(async () => {
        try {
            setCartSyncError(null);
            const payload = (await cartService.merge()) as BackendCartPayload;
            syncCartPayload(payload, true);
        } catch (err) {
            setCartSyncError(
                err instanceof ApiError
                    ? err.message
                    : 'Unable to synchronize cart with your account. Please retry.'
            );
            throw err;
        }
    }, [syncCartPayload]);

    useEffect(() => {
        let active = true;

        const initializeSessionAndCart = async () => {
            try {
                const session = await authService.getSession();
                if (!active) return;

                if (session.authenticated && session.customer) {
                    setCustomer(session.customer);
                    setAuthStatus('authenticated');

                    // Synchronize guest wishlist if present, then load customer wishlist & cart
                    const guestWishlistItems = getGuestWishlist();
                    if (guestWishlistItems.length > 0) {
                        try {
                            await wishlistService.merge(guestWishlistItems);
                            localStorage.removeItem(GUEST_WISHLIST_KEY);
                        } catch {
                            // Preserve session if wishlist merge fails transiently
                        }
                    }

                    await Promise.all([
                        wishlistService
                            .get()
                            .then((wl) => {
                                const parsed = wl as { items?: Array<{ productId: string }> };
                                if (active && parsed?.items) {
                                    setWishlist(parsed.items.map((i) => i.productId));
                                }
                            })
                            .catch(() => undefined),
                        refreshCart(),
                    ]);
                } else {
                    setCustomer(null);
                    setAuthStatus('unauthenticated');
                    setWishlist(getGuestWishlist());
                    // Only load guest cart AFTER /auth/session established isolated GuestSession cookie
                    await refreshCart();
                }
            } catch {
                if (active) {
                    setCustomer(null);
                    setAuthStatus('error');
                    setWishlist(getGuestWishlist());
                }
            }
        };

        void Promise.all([initializeSessionAndCart(), loadProducts()]);

        return () => {
            active = false;
        };
    }, [loadProducts, refreshCart]);

    const completeAuthenticatedLogin = useCallback(
        async (
            expectedCustomer: BackendCustomer,
            options?: { alreadyMergedOnLogin?: boolean }
        ): Promise<{ sessionVerified: boolean; cartSyncError?: string }> => {
            setAuthStatus('authenticating');
            setCartSyncError(null);

            // 1. Verify that backend server session (HttpOnly cookie) is active & accepted by browser
            let session: { authenticated: boolean; customer: BackendCustomer | null };
            try {
                session = await authService.getSession();
            } catch (err) {
                setAuthStatus('error');
                throw new ApiError(
                    err instanceof ApiError
                        ? err.message
                        : 'Unable to verify authentication session with server.',
                    err instanceof ApiError ? err.status : 0,
                    'SESSION_VERIFY_FAILED'
                );
            }

            if (!session.authenticated || !session.customer || session.customer.id !== expectedCustomer.id) {
                setCustomer(null);
                setAuthStatus('unauthenticated');
                throw new ApiError(
                    'Login credentials matched, but your browser did not establish a valid session cookie. Please allow cookies and try again.',
                    401,
                    'SESSION_COOKIE_NOT_ACCEPTED'
                );
            }

            // 2. Session verified: transition central authentication state to authenticated
            setCustomer(session.customer);
            setAuthStatus('authenticated');

            // 3. Synchronize wishlist safely without jeopardizing auth session
            const guestWishlistItems = getGuestWishlist();
            if (guestWishlistItems.length > 0) {
                try {
                    await wishlistService.merge(guestWishlistItems);
                    localStorage.removeItem(GUEST_WISHLIST_KEY);
                } catch {
                    // Non-fatal
                }
            }
            try {
                const wl = (await wishlistService.get()) as { items?: Array<{ productId: string }> };
                if (wl?.items) {
                    setWishlist(wl.items.map((i) => i.productId));
                }
            } catch {
                // Non-fatal
            }

            // 4. Synchronize / retrieve final authoritative cart cleanly (never logs out on merge error)
            let mergeErrMessage: string | undefined;
            try {
                if (options?.alreadyMergedOnLogin) {
                    const payload = (await cartService.getCart()) as BackendCartPayload;
                    syncCartPayload(payload, true);
                } else {
                    const payload = (await cartService.merge()) as BackendCartPayload;
                    syncCartPayload(payload, true);
                }
            } catch (err) {
                mergeErrMessage =
                    err instanceof ApiError
                        ? err.message
                        : 'Signed in cleanly, though your previous guest cart could not be synced automatically.';
                setCartSyncError(mergeErrMessage);
                await refreshCart();
            }

            return { sessionVerified: true, cartSyncError: mergeErrMessage };
        },
        [syncCartPayload, refreshCart]
    );

    const handleSetCustomer = useCallback(
        async (newCustomer: BackendCustomer | null) => {
            if (!newCustomer) {
                setCustomer(null);
                setAuthStatus('unauthenticated');
                setWishlist(getGuestWishlist());
                return;
            }
            await completeAuthenticatedLogin(newCustomer);
        },
        [completeAuthenticatedLogin]
    );

    // Background auto-reconnect polling when offline
    useEffect(() => {
        if (apiStatus !== 'offline') return;
        const healthUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '/health');
        const timer = setInterval(async () => {
            try {
                const res = await fetch(healthUrl).catch(() => null);
                if (res && res.ok) {
                    void Promise.all([loadProducts(), refreshCart()]);
                }
            } catch {
                // Next interval
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [apiStatus, loadProducts, refreshCart]);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            // Proceed to reset client session state even if network call fails
        }
        resetInMemoryCsrfToken();
        purgeLegacyClientAuthAndCartCaches();
        setCustomer(null);
        setAuthStatus('unauthenticated');
        setCartSyncError(null);
        cartVersionRef.current += 1;
        setCart([]);
        setCouponCode(null);
        setCartTotals(EMPTY_TOTALS);
        try {
            localStorage.removeItem(GUEST_WISHLIST_KEY);
        } catch {
            // Ignore storage error
        }
        setWishlist([]);
        // Initialize a fresh isolated guest session after logout
        await authService.getSession().catch(() => undefined);
    }, []);

    const addToCart: StoreContextValue['addToCart'] = useCallback(
        async (product, options) => {
            const chosenVariant =
                product.variants.find((v) => v.id === options?.variantId || v.label === options?.variantLabel) ??
                product.variants[0];
            const variantId = chosenVariant?.id ?? product.defaultVariantId;
            const quantity = options?.quantity ?? 1;
            const isSubscription = options?.isSubscription ?? false;
            const frequencyWeeks = options?.frequencyWeeks ?? 4;
            // Enforce mutation lock to prevent duplicate Add to Cart calls from rapid clicks
            const lockKey = `${variantId}:${isSubscription}`;
            if (inFlightAddRef.current.has(lockKey)) {
                return;
            }
            inFlightAddRef.current.add(lockKey);

            const idempotencyKey = `add-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            try {
                const payload = (await cartService.addItem({
                    variantId,
                    quantity,
                    isSubscription,
                    frequencyWeeks,
                    idempotencyKey,
                })) as BackendCartPayload;
                syncCartPayload(payload, true);
                setIsCartDrawerOpen(true);
            } finally {
                inFlightAddRef.current.delete(lockKey);
            }
        },
        [syncCartPayload]
    );

    const removeFromCart = useCallback(
        async (itemId: string) => {
            const existing = cart.find((i) => i.id === itemId);
            if (!existing) return;

            setUpdatingItemIds((prev) => new Set(prev).add(itemId));
            const prevCart = cart;
            const prevTotals = cartTotals;

            const nextCart = cart.filter((i) => i.id !== itemId);
            setCart(nextCart);
            setCartTotals(computeOptimisticTotals(nextCart));

            const idToDelete = existing.id.startsWith('opt-') ? existing.variantId : existing.id;

            try {
                const payload = (await cartService.removeItem(idToDelete)) as BackendCartPayload;
                syncCartPayload(payload, true);
            } catch (err) {
                setCart(prevCart);
                setCartTotals(prevTotals);
                throw err;
            } finally {
                setUpdatingItemIds((prev) => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });
            }
        },
        [cart, cartTotals, syncCartPayload]
    );

    const updateQuantity = useCallback(
        async (itemId: string, delta: number) => {
            const existing = cart.find((i) => i.id === itemId);
            if (!existing) return;
            const nextQty = existing.quantity + delta;

            if (nextQty <= 0) {
                await removeFromCart(itemId);
                return;
            }

            setUpdatingItemIds((prev) => new Set(prev).add(itemId));
            const prevCart = cart;
            const prevTotals = cartTotals;

            const nextCart = cart.map((i) => (i.id === itemId ? { ...i, quantity: nextQty } : i));
            setCart(nextCart);
            setCartTotals(computeOptimisticTotals(nextCart));

            const idToUpdate = existing.id.startsWith('opt-') ? existing.variantId : existing.id;

            try {
                const payload = (await cartService.updateItem(idToUpdate, {
                    quantity: nextQty,
                })) as BackendCartPayload;
                syncCartPayload(payload, true);
            } catch (err) {
                setCart(prevCart);
                setCartTotals(prevTotals);
                throw err;
            } finally {
                setUpdatingItemIds((prev) => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });
            }
        },
        [cart, cartTotals, removeFromCart, syncCartPayload]
    );

    const toggleItemSubscription = useCallback(async (itemId: string) => {
        const existing = cart.find((i) => i.id === itemId);
        if (!existing) return;
        const idToUpdate = existing.id.startsWith('opt-') ? existing.variantId : existing.id;
        const payload = (await cartService.updateItem(idToUpdate, {
            isSubscription: !existing.isSubscription,
        })) as BackendCartPayload;
        syncCartPayload(payload, true);
    }, [cart, syncCartPayload]);

    const applyCouponCode = useCallback(async (code: string) => {
        const payload = (await cartService.applyCoupon(code)) as BackendCartPayload;
        syncCartPayload(payload, true);
    }, [syncCartPayload]);

    const clearCart = useCallback(async () => {
        cartVersionRef.current += 1;
        setCart([]);
        setCouponCode(null);
        setCartTotals(EMPTY_TOTALS);
        try {
            await cartService.clearCart();
        } catch {
            // Ignore error on clear
        }
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
            authStatus,
            authLoading,
            cartSyncError,
            setCustomer: handleSetCustomer,
            completeAuthenticatedLogin,
            logout,
            refreshCart,
            retryCartMerge,
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
            isItemUpdating,
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
            authStatus,
            authLoading,
            cartSyncError,
            handleSetCustomer,
            completeAuthenticatedLogin,
            logout,
            refreshCart,
            retryCartMerge,
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
            isItemUpdating,
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
