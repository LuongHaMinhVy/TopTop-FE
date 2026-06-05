"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createShop,
  updateShop,
  getMyShop,
  getShopBySlug,
  getShopById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getMyProducts,
  getPublicProducts,
  getPublicProductsByShop,
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  selectCartItems,
  previewCheckout,
  placeOrder,
  getOrderById,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
  payOrder,
  cancelOrder,
  createReview,
  getProductReviews,
  linkProductsToVideo,
  getProductsByVideo,
  pinProductToLivestream,
  unpinProductFromLivestream,
  getProductsByLivestream,
  getCategoriesTree
} from "@/services/shop-api-service";

// --- Shop Hooks ---
export function useCreateShopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop"] });
    }
  });
}

export function useUpdateShopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop"] });
    }
  });
}

export function useMyShopQuery(enabled = true) {
  return useQuery({
    queryKey: ["my-shop"],
    queryFn: getMyShop,
    enabled,
    retry: false
  });
}

export function useShopBySlugQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["shop", slug],
    queryFn: () => getShopBySlug(slug),
    enabled: enabled && !!slug
  });
}

export function useShopByIdQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: ["shop-id", id],
    queryFn: () => getShopById(id),
    enabled: enabled && !!id
  });
}

// --- Product Hooks ---
export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    }
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    }
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    }
  });
}

export function useProductByIdQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: enabled && !!id
  });
}

export function useMyProductsQuery(page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: ["my-products", page, size],
    queryFn: () => getMyProducts(page, size),
    enabled
  });
}

export function usePublicProductsQuery(keyword?: string, categoryId?: number, page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: ["public-products", keyword, categoryId, page, size],
    queryFn: () => getPublicProducts(keyword, categoryId, page, size),
    enabled
  });
}

export function usePublicProductsByShopQuery(shopSlug: string, page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: ["shop-products", shopSlug, page, size],
    queryFn: () => getPublicProductsByShop(shopSlug, page, size),
    enabled: enabled && !!shopSlug
  });
}

// --- Cart Hooks ---
export function useMyCartQuery(enabled = true) {
  return useQuery({
    queryKey: ["cart"],
    queryFn: getMyCart,
    enabled
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItem(itemId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}

export function useSelectCartItemsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemIds, selected }: { itemIds: number[]; selected: boolean }) =>
      selectCartItems(itemIds, selected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}

export function usePreviewCheckoutQuery(itemIds: number[], enabled = true) {
  return useQuery({
    queryKey: ["checkout-preview", itemIds],
    queryFn: () => previewCheckout(itemIds),
    enabled: enabled && itemIds.length > 0
  });
}

// --- Order Hooks ---
export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    }
  });
}

export function useOrderByIdQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
    enabled: enabled && !!id
  });
}

export function useMyOrdersQuery(page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: ["my-orders", page, size],
    queryFn: () => getMyOrders(page, size),
    enabled
  });
}

export function useShopOrdersQuery(page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: ["shop-orders", page, size],
    queryFn: () => getShopOrders(page, size),
    enabled
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    }
  });
}

export function usePayOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: { provider: string; transactionId?: string } }) =>
      payOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    }
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    }
  });
}

// --- Review Hooks ---
export function useCreateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    }
  });
}

export function useProductReviewsQuery(productId: number, page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: ["product-reviews", productId, page, size],
    queryFn: () => getProductReviews(productId, page, size),
    enabled: enabled && !!productId
  });
}

// --- Linking / Pinning Hooks ---
export function useLinkProductsToVideoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, productIds }: { videoId: number; productIds: number[] }) =>
      linkProductsToVideo(videoId, productIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["video-products", variables.videoId] });
    }
  });
}

export function useProductsByVideoQuery(videoId: number, enabled = true) {
  return useQuery({
    queryKey: ["video-products", videoId],
    queryFn: () => getProductsByVideo(videoId),
    enabled: enabled && !!videoId
  });
}

export function usePinProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ livestreamId, productId }: { livestreamId: number; productId: number }) =>
      pinProductToLivestream(livestreamId, productId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["livestream-products", variables.livestreamId] });
    }
  });
}

export function useUnpinProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ livestreamId, productId }: { livestreamId: number; productId: number }) =>
      unpinProductFromLivestream(livestreamId, productId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["livestream-products", variables.livestreamId] });
    }
  });
}

export function useProductsByLivestreamQuery(livestreamId: number, enabled = true) {
  return useQuery({
    queryKey: ["livestream-products", livestreamId],
    queryFn: () => getProductsByLivestream(livestreamId),
    enabled: enabled && !!livestreamId
  });
}

export function useCategoriesTreeQuery(enabled = true) {
  return useQuery({
    queryKey: ["categories-tree"],
    queryFn: getCategoriesTree,
    enabled
  });
}
