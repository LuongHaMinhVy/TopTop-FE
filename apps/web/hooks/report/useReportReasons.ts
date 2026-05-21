import { useQuery } from '@tanstack/react-query';
import { reportApiService } from '@/services/report-api-service';

export function useReportReasons() {
  return useQuery({
    queryKey: ['report-reasons-tree'],
    queryFn: reportApiService.getReasonTree,
    staleTime: 1000 * 60 * 10,
  });
}
