export interface Shop {
  id: number;
  ownerId: number;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_REVIEW';
}

export interface ProductMedia {
  id: number;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  sku?: string;
  name: string;
  optionValues?: string;
  price: number;
  stockQuantity: number;
  status: string;
}

export interface Product {
  id: number;
  shopId: number;
  title: string;
  slug: string;
  description: string;
  categoryId?: number;
  basePrice: number;
  currency: string;
  stockQuantity: number;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  status: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN' | 'BANNED';
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_REVIEW';
  media: ProductMedia[];
  variants: ProductVariant[];
}

export interface CartItem {
  id: number;
  productId: number;
  productTitle: string;
  productImageUrl?: string;
  variantId?: number;
  variantName?: string;
  price: number;
  quantity: number;
  selected: boolean;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

export interface ShopCheckoutGroup {
  shopId: number;
  shopName: string;
  items: CartItem[];
  subtotal: number;
}

export interface CheckoutPreview {
  shops: ShopCheckoutGroup[];
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId?: number;
  productTitle: string;
  variantName?: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderCode: string;
  buyerId: number;
  shopId: number;
  shopName: string;
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  commissionBaseAmount: number;
  shopPayoutRate: number;
  shopPayoutAmount: number;
  platformFeeAmount: number;
  commissionTier: 'UNPAID' | 'SMALL' | 'MEDIUM' | 'LARGE';
  currency: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'SELLER_CONFIRMING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUND_REQUESTED' | 'REFUNDED';
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  shippingStatus: 'NOT_SHIPPED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Payment {
  id: number;
  orderId: number;
  provider: string;
  providerTransactionId?: string;
  redirectUrl?: string;
  amount: number;
  currency: string;
  status: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt?: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  orderItemId: number;
  userId: number;
  username: string;
  userAvatarUrl?: string;
  rating: number;
  content?: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  sortOrder: number;
  children: Category[];
}
