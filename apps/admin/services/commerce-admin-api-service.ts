import { get, patch } from "@/services/base-api-service";
import type { AdminCommerceOrder, AdminProduct, AdminShop } from "@/types/admin";

export const getAdminShops = async (params?: { status?: string; moderationStatus?: string; page?: number; size?: number }) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.moderationStatus) sp.set("moderationStatus", params.moderationStatus);
  sp.set("page", String(params?.page ?? 0));
  sp.set("size", String(params?.size ?? 20));
  return get<AdminShop[]>(`/admin/shops?${sp.toString()}`);
};

export const getAdminProducts = async (params?: { status?: string; moderationStatus?: string; page?: number; size?: number }) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.moderationStatus) sp.set("moderationStatus", params.moderationStatus);
  sp.set("page", String(params?.page ?? 0));
  sp.set("size", String(params?.size ?? 20));
  return get<AdminProduct[]>(`/admin/products?${sp.toString()}`);
};

export const getAdminOrders = async (params?: { page?: number; size?: number }) => {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 0));
  sp.set("size", String(params?.size ?? 20));
  return get<AdminCommerceOrder[]>(`/admin/orders?${sp.toString()}`);
};

export const approveAdminShop = async (shopId: number) => patch<AdminShop>(`/admin/shops/${shopId}/approve`);
export const rejectAdminShop = async (shopId: number) => patch<AdminShop>(`/admin/shops/${shopId}/reject`);
export const suspendAdminShop = async (shopId: number) => patch<AdminShop>(`/admin/shops/${shopId}/suspend`);
export const unsuspendAdminShop = async (shopId: number) => patch<AdminShop>(`/admin/shops/${shopId}/unsuspend`);
export const approveAdminProduct = async (productId: number) => patch<AdminProduct>(`/admin/products/${productId}/approve`);
export const rejectAdminProduct = async (productId: number) => patch<AdminProduct>(`/admin/products/${productId}/reject`);
export const banAdminProduct = async (productId: number) => patch<AdminProduct>(`/admin/products/${productId}/ban`);
