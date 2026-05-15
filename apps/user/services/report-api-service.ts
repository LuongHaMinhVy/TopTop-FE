import api from '@/utils/axios-instance';
import { AxiosError } from "axios";
import { handleErrorResponse } from "./handle-error-response";
import type {
  CreateReportRequest,
  ReportPolicy,
  ReportReason,
  ReportResponse,
} from '@/types/report';

export const reportApiService = {
  async getReasonTree(): Promise<ReportReason[]> {
    try {
      const response = await api.get('/reports/reasons/tree');
      return response.data.data;
    } catch (error) {
      handleErrorResponse(error as AxiosError);
      throw error;
    }
  },

  async getReasonPolicy(reasonId: number): Promise<ReportPolicy> {
    try {
      const response = await api.get(`/reports/reasons/${reasonId}/policy`);
      return response.data.data;
    } catch (error) {
      handleErrorResponse(error as AxiosError);
      throw error;
    }
  },

  async createReport(payload: CreateReportRequest): Promise<ReportResponse> {
    try {
      const response = await api.post('/reports', payload);
      return response.data.data;
    } catch (error) {
      handleErrorResponse(error as AxiosError);
      throw error;
    }
  },
};
