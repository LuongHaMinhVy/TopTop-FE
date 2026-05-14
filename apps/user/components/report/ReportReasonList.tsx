import type { ReportReason } from '@/types/report';
import { ReportReasonItem } from './ReportReasonItem';
import { useTranslations } from 'next-intl';

interface ReportReasonListProps {
  reasons: ReportReason[];
  onSelect: (reason: ReportReason) => void;
}

export function ReportReasonList({ reasons, onSelect }: ReportReasonListProps) {
  const t = useTranslations('Report');
  
  return (
    <div className="space-y-1">
      <p className="mb-2 text-sm text-white/70">{t('chooseSituation')}</p>
      {reasons.map((reason) => (
        <ReportReasonItem key={reason.id} reason={reason} onSelect={onSelect} />
      ))}
    </div>
  );
}
