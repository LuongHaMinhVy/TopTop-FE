import api from "@/utils/axios-instance";
import type { ApiResponse } from "@/types/api";
import type {
  Shop,
  Product,
  Cart,
  CheckoutPreview,
  Order,
  ProductReview,
  Category
} from "@/types/shop";

// --- Shop Operations ---
export const createShop = async (payload: {
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}): Promise<ApiResponse<Shop>> => {
  const res = await api.post<ApiResponse<Shop>>("/shops", payload);
  return res.data;
};

export const updateShop = async (payload: {
  name?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}): Promise<ApiResponse<Shop>> => {
  const res = await api.put<ApiResponse<Shop>>("/shops/me", payload);
  return res.data;
};

export const getMyShop = async (): Promise<ApiResponse<Shop>> => {
  const res = await api.get<ApiResponse<Shop>>("/shops/me");
  return res.data;
};

export const getShopBySlug = async (slug: string): Promise<ApiResponse<Shop>> => {
  const res = await api.get<ApiResponse<Shop>>(`/shops/slug/${slug}`);
  return res.data;
};

export const getShopById = async (id: number): Promise<ApiResponse<Shop>> => {
  const res = await api.get<ApiResponse<Shop>>(`/shops/${id}`);
  return res.data;
};

// --- Product Operations ---
export const createProduct = async (payload: {
  title: string;
  description?: string;
  categoryId?: number;
  basePrice: number;
  stockQuantity: number;
  currency?: string;
  media?: Array<{ url: string; mediaType: 'IMAGE' | 'VIDEO'; sortOrder?: number }>;
  variants?: Array<{ name: string; sku?: string; price: number; stockQuantity: number }>;
}): Promise<ApiResponse<Product>> => {
  const res = await api.post<ApiResponse<Product>>("/products", payload);
  return res.data;
};

export const updateProduct = async (
  id: number,
  payload: Partial<{
    title: string;
    description: string;
    categoryId: number;
    basePrice: number;
    stockQuantity: number;
    currency: string;
    media: Array<{ url: string; mediaType: 'IMAGE' | 'VIDEO'; sortOrder?: number }>;
    variants: Array<{ name: string; sku?: string; price: number; stockQuantity: number }>;
  }>
): Promise<ApiResponse<Product>> => {
  const res = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
  return res.data;
};

export const deleteProduct = async (id: number): Promise<ApiResponse<void>> => {
  const res = await api.delete<ApiResponse<void>>(`/products/${id}`);
  return res.data;
};

export const getProductById = async (id: number): Promise<ApiResponse<Product>> => {
  const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data;
};

export const getMyProducts = async (page = 0, size = 10): Promise<ApiResponse<Product[]>> => {
  const res = await api.get<ApiResponse<Product[]>>("/products/me", { params: { page, size } });
  return res.data;
};

export const getPublicProducts = async (
  keyword?: string,
  categoryId?: number,
  page = 0,
  size = 10,
): Promise<ApiResponse<Product[]>> => {
  const res = await api.get<ApiResponse<Product[]>>("/products/public", {
    params: { keyword, categoryId, page, size },
  });
  return res.data;
};

export const getPublicProductsByShop = async (shopSlug: string, page = 0, size = 10): Promise<ApiResponse<Product[]>> => {
  const res = await api.get<ApiResponse<Product[]>>(`/products/public/shop/${shopSlug}`, { params: { page, size } });
  return res.data;
};

// --- Cart Operations ---
export const getMyCart = async (): Promise<ApiResponse<Cart>> => {
  const res = await api.get<ApiResponse<Cart>>("/carts");
  return res.data;
};

export const addToCart = async (payload: {
  productId: number;
  variantId?: number;
  quantity: number;
}): Promise<ApiResponse<Cart>> => {
  const res = await api.post<ApiResponse<Cart>>("/carts/items", payload);
  return res.data;
};

export const updateCartItem = async (itemId: number, payload: { quantity: number }): Promise<ApiResponse<Cart>> => {
  const res = await api.put<ApiResponse<Cart>>(`/carts/items/${itemId}`, payload);
  return res.data;
};

export const removeCartItem = async (itemId: number): Promise<ApiResponse<Cart>> => {
  const res = await api.delete<ApiResponse<Cart>>(`/carts/items/${itemId}`);
  return res.data;
};

export const selectCartItems = async (itemIds: number[], selected: boolean): Promise<ApiResponse<Cart>> => {
  const res = await api.put<ApiResponse<Cart>>("/carts/items/select", null, {
    params: { itemIds: itemIds.join(","), selected }
  });
  return res.data;
};

export const previewCheckout = async (itemIds: number[]): Promise<ApiResponse<CheckoutPreview>> => {
  const res = await api.get<ApiResponse<CheckoutPreview>>("/carts/checkout/preview", {
    params: { itemIds: itemIds.join(",") }
  });
  return res.data;
};

// --- Order Operations ---
export const placeOrder = async (payload: {
  cartItemIds: number[];
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  note?: string;
  paymentProvider?: string;
}): Promise<ApiResponse<Order>> => {
  const res = await api.post<ApiResponse<Order>>("/orders", payload);
  return res.data;
};

export const getOrderById = async (id: number): Promise<ApiResponse<Order>> => {
  const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data;
};

export const getMyOrders = async (page = 0, size = 10): Promise<ApiResponse<Order[]>> => {
  const res = await api.get<ApiResponse<Order[]>>("/orders/me", { params: { page, size } });
  return res.data;
};

export const getShopOrders = async (page = 0, size = 10): Promise<ApiResponse<Order[]>> => {
  const res = await api.get<ApiResponse<Order[]>>("/orders/shop", { params: { page, size } });
  return res.data;
};

export const updateOrderStatus = async (orderId: number, status: string): Promise<ApiResponse<Order>> => {
  const res = await api.put<ApiResponse<Order>>(`/orders/${orderId}/status`, null, { params: { status } });
  return res.data;
};

export const payOrder = async (orderId: number, payload: { provider: string; transactionId?: string }): Promise<ApiResponse<Order>> => {
  const res = await api.post<ApiResponse<Order>>(`/orders/${orderId}/pay`, payload);
  return res.data;
};

export const cancelOrder = async (orderId: number): Promise<ApiResponse<Order>> => {
  const res = await api.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`);
  return res.data;
};

// --- Review Operations ---
export const createReview = async (payload: {
  rating: number;
  content?: string;
  orderItemId: number;
}): Promise<ApiResponse<ProductReview>> => {
  const res = await api.post<ApiResponse<ProductReview>>("/products/reviews", payload);
  return res.data;
};

export const getProductReviews = async (productId: number, page = 0, size = 10): Promise<ApiResponse<ProductReview[]>> => {
  const res = await api.get<ApiResponse<ProductReview[]>>(`/products/${productId}/reviews`, { params: { page, size } });
  return res.data;
};

// --- Linking / Pinning Operations ---
export const linkProductsToVideo = async (videoId: number, productIds: number[]): Promise<ApiResponse<void>> => {
  const res = await api.post<ApiResponse<void>>(`/shop-links/video/${videoId}`, { productIds });
  return res.data;
};

export const getProductsByVideo = async (videoId: number): Promise<ApiResponse<Product[]>> => {
  const res = await api.get<ApiResponse<Product[]>>(`/shop-links/video/${videoId}`);
  return res.data;
};

export const pinProductToLivestream = async (livestreamId: number, productId: number): Promise<ApiResponse<void>> => {
  const res = await api.post<ApiResponse<void>>(`/shop-links/livestream/${livestreamId}/pin/${productId}`);
  return res.data;
};

export const unpinProductFromLivestream = async (livestreamId: number, productId: number): Promise<ApiResponse<void>> => {
  const res = await api.delete<ApiResponse<void>>(`/shop-links/livestream/${livestreamId}/pin/${productId}`);
  return res.data;
};

export const getProductsByLivestream = async (livestreamId: number): Promise<ApiResponse<Product[]>> => {
  const res = await api.get<ApiResponse<Product[]>>(`/shop-links/livestream/${livestreamId}`);
  return res.data;
};

export const getCategoriesTree = async (): Promise<ApiResponse<Category[]>> => {
  const res = await api.get<ApiResponse<Category[]>>("/categories/tree");
  return res.data;
};
