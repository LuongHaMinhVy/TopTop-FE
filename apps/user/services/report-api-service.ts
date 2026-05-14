import api from '@/utils/axios-instance';
import type {
  CreateReportRequest,
  ReportPolicy,
  ReportReason,
  ReportResponse,
} from '@/types/report';

export const reportApiService = {
  async getReasonTree(): Promise<ReportReason[]> {
    const response = await api.get('/reports/reasons/tree');
    return response.data.data;
  },

  async getReasonPolicy(reasonId: number): Promise<ReportPolicy> {
    const response = await api.get(`/reports/reasons/${reasonId}/policy`);
    return response.data.data;
  },

  async createReport(payload: CreateReportRequest): Promise<ReportResponse> {
    const response = await api.post('/reports', payload);
    return response.data.data;
  },
};
