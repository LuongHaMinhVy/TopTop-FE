import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { reportApiService } from '@/services/report-api-service';

export function useReportReasons() {
  const locale = useLocale();

  return useQuery({
    queryKey: ['report-reasons-tree', locale],
    queryFn: reportApiService.getReasonTree,
    staleTime: 1000 * 60 * 10,
  });
}
