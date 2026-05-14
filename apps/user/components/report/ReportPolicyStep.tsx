import type { ReportReason } from '@/types/report';
import { useTranslations } from 'next-intl';

interface ReportPolicyStepProps {
  reason: ReportReason;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function ReportPolicyStep({ reason, isSubmitting, onSubmit }: ReportPolicyStepProps) {
  const t = useTranslations('Report');
  
  const title = reason.policyTitle || reason.label;
  
  return (
    <div>
      <div className="-mx-6 border-b border-white/10 bg-white/10 px-6 py-4 text-lg font-semibold">
        {title}
      </div>

      <div className="space-y-4 py-5 text-[15px] text-white/80">
        <p>{t('policyIntro')}</p>

        <ul className="list-disc space-y-3 pl-5">
          {(reason.policyBullets || []).map((bullet) => (
             <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      <div className="-mx-6 mt-4 flex justify-end border-t border-white/10 px-6 py-5">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-red-600 px-7 py-2 rounded-md font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isSubmitting ? t('loading') : t('submit')}
        </button>
      </div>
    </div>
  );
}
