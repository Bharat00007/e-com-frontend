export type PetCategory = 'cats' | 'dogs' | 'both';
export type ProductCategory = 'cat-litter' | 'grooming' | 'home-care';

export interface ProductVariant {
  id: string;
  sku: string;
  label: string;
  price: number;
  originalPrice?: number;
  pricePerUnit?: string;
  stockQuantity: number;
  isAvailable: boolean;
  isDefault?: boolean;
  badge?: string;
  image?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  kicker: string;
  subtitle: string;
  description: string;
  petCategory: PetCategory;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  unitLabel: string;
  defaultVariantId: string;
  stockQuantity: number;
  badge?: string;
  secondaryBadge?: string;
  rating: number;
  reviewCount: number;
  image: string;
  gallery?: string[];
  features: string[];
  variants: ProductVariant[];
  subscriptionDiscountPercent?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  image: string;
  unitPrice: number;
  quantity: number;
  isSubscription: boolean;
  frequencyWeeks?: number;
}

export interface CartTotals {
  subtotal: number;
  subscriptionDiscount: number;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  totalAmount: number;
  totalSavings: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  city: string;
  petName: string;
}
