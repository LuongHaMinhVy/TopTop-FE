import { useMutation } from '@tanstack/react-query';
import { reportApiService } from '@/services/report-api-service';
import type { CreateReportRequest } from '@/types/report';

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload: CreateReportRequest) => reportApiService.createReport(payload),
  });
}
