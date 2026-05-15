export interface VideoCollection {
  id: number;
  name: string;
  description?: string | null;
  videoCount: number;
  coverUrl?: string | null;
  isPublic: boolean;
  ownerUsername?: string;
  createdAt: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}
