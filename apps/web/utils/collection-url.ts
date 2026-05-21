import type { VideoCollection } from "@/types/collection";

export function collectionSlug(collection: Pick<VideoCollection, "id" | "name">): string {
  const encodedName = encodeURIComponent(collection.name.trim() || "collection");

  return `${encodedName}-${collection.id}`;
}

export function collectionPath(username: string, collection: Pick<VideoCollection, "id" | "name">): string {
  return `/@${username}/collection/${collectionSlug(collection)}`;
}

export function collectionIdFromSlug(slug: string): number {
  const lastDashIndex = slug.lastIndexOf("-");
  if (lastDashIndex < 0 || lastDashIndex === slug.length - 1) return NaN;

  const idPart = slug.slice(lastDashIndex + 1);
  return /^\d+$/.test(idPart) ? Number(idPart) : NaN;
}
