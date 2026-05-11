export interface ErrorResponse {
  field: string;
  message: string;
}

export interface Meta {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface ApiResponse<T = void> {
  message: string;
  data?: T;
  meta?: Meta;
  errors?: ErrorResponse[];
  status: number;
  timestamp: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface BaseQueryRequest {
  page?: number;
  size?: number;
  sort?: string;
}
