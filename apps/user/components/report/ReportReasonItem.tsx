import { ChevronRight } from 'lucide-react';
import type { ReportReason } from '@/types/report';

interface ReportReasonItemProps {
  reason: ReportReason;
  onSelect: (reason: ReportReason) => void;
}

export function ReportReasonItem({ reason, onSelect }: ReportReasonItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(reason)}
      className="flex w-full items-center justify-between rounded-lg px-3 py-4 text-left text-[15px] font-medium text-white transition hover:bg-white/10"
    >
      <span>{reason.label}</span>
      <ChevronRight size={22} className="text-white/60" />
    </button>
  );
}
