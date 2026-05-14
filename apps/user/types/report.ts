export type ReportTargetType =
  | "VIDEO"
  | "VIDEO_POST"
  | "COMMENT"
  | "USER"
  | "MESSAGE"
  | "LIVE";

export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

export interface ReportReason {
  id: number;
  code: string;
  label: string;
  description?: string | null;
  policyTitle?: string | null;
  policyBullets?: string[];
  hasChildren: boolean;
  children?: ReportReason[];
}

export interface ReportPolicy {
  reasonId: number;
  code: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reasonId: number;
  additionalNote?: string | null;
}

export interface ReportResponse {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reasonId: number;
  reasonCode: string;
  reasonLabel: string;
  status: ReportStatus;
  createdAt: string;
}
