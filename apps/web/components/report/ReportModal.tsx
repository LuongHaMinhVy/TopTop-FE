'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import type { ReportReason, ReportTargetType } from '@/types/report';
import { useReportReasons } from '@/hooks/report/useReportReasons';
import { useCreateReport } from '@/hooks/report/useCreateReport';
import { ReportReasonList } from './ReportReasonList';
import { ReportPolicyStep } from './ReportPolicyStep';
import { useTranslations } from 'next-intl';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
}

type ReportStep = 'REASON_LIST' | 'POLICY' | 'SUCCESS';

function findReasonById(reasons: ReportReason[], reasonId: number): ReportReason | null {
  for (const reason of reasons) {
    if (reason.id === reasonId) return reason;
    const childMatch = findReasonById(reason.children || [], reasonId);
    if (childMatch) return childMatch;
  }

  return null;
}

function findReasonPath(
  reasons: ReportReason[],
  reasonId: number,
  path: ReportReason[][] = [],
): ReportReason[][] | null {
  for (const reason of reasons) {
    if (reason.id === reasonId) return [...path, reasons];
    const childPath = findReasonPath(reason.children || [], reasonId, [...path, reasons]);
    if (childPath) return childPath;
  }

  return null;
}

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const t = useTranslations('Report');
  const { data: reasonTree = [], isLoading, isError } = useReportReasons();
  const createReportMutation = useCreateReport();

  const [step, setStep] = useState<ReportStep>('REASON_LIST');
  const [reasonStack, setReasonStack] = useState<ReportReason[][]>([]);
  const [currentReasons, setCurrentReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);

  const visibleReasons = useMemo(() => {
    return currentReasons.length > 0 ? currentReasons : reasonTree;
  }, [currentReasons, reasonTree]);

  useEffect(() => {
    if (reasonTree.length === 0) return;

    startTransition(() => {
      setSelectedReason((current) => {
        if (!current) return current;
        return findReasonById(reasonTree, current.id) ?? current;
      });

      setCurrentReasons((current) => {
        const firstReason = current[0];
        if (!firstReason) return current;
        const path = findReasonPath(reasonTree, firstReason.id);
        return path && path.length > 0 ? path[path.length - 1] : current;
      });

      setReasonStack((current) => {
        const currentFirstReason = currentReasons[0];
        if (!currentFirstReason) return current;
        const path = findReasonPath(reasonTree, currentFirstReason.id);
        return path && path.length > 1 ? path.slice(0, -1) : [];
      });
    });
  }, [currentReasons, reasonTree]);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('REASON_LIST');
    setReasonStack([]);
    setCurrentReasons([]);
    setSelectedReason(null);
    onClose();
  };

  const handleSelectReason = (reason: ReportReason) => {
    if (reason.children && reason.children.length > 0) {
      setReasonStack((prev) => [...prev, visibleReasons]);
      setCurrentReasons(reason.children);
      return;
    }

    setSelectedReason(reason);
    setStep('POLICY');
  };

  const handleBack = () => {
    if (step === 'POLICY') {
      setStep('REASON_LIST');
      return;
    }

    const previous = reasonStack[reasonStack.length - 1];
    if (!previous) return;

    setCurrentReasons(previous);
    setReasonStack((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    await createReportMutation.mutateAsync({
      targetType,
      targetId,
      reasonId: selectedReason.id,
      additionalNote: null,
    });

    setStep('SUCCESS');
  };

  const canGoBack = step === 'POLICY' || reasonStack.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 py-4">
      <div className="modal-opacity-solid flex max-h-[85dvh] min-h-0 w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-[#121212] text-white shadow-2xl max-sm:h-[85dvh] max-sm:rounded-b-none max-sm:rounded-t-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button type="button" onClick={handleBack} className="rounded-full p-1 hover:bg-white/10">
                <ChevronLeft size={26} />
              </button>
            )}
            <h2 className="text-xl font-bold">{t('title')}</h2>
          </div>

          <button type="button" onClick={resetAndClose} className="rounded-full p-1 hover:bg-white/10">
            <X size={24} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {isLoading && <p className="text-white/70">{t('loading')}</p>}
          {isError && <p className="text-red-400">{t('loadError')}</p>}

          {!isLoading && !isError && step === 'REASON_LIST' && (
            <ReportReasonList reasons={visibleReasons} onSelect={handleSelectReason} />
          )}

          {step === 'POLICY' && selectedReason && (
            <ReportPolicyStep
              reason={selectedReason}
              isSubmitting={createReportMutation.isPending}
              onSubmit={handleSubmit}
            />
          )}

          {step === 'SUCCESS' && (
            <div className="py-10 text-center">
              <h3 className="text-xl font-bold">{t('successTitle')}</h3>
              <p className="mt-2 text-white/70">{t('successDescription')}</p>
              <button
                type="button"
                onClick={resetAndClose}
                className="mt-6 rounded-lg bg-red-600 px-6 py-2 font-semibold hover:bg-red-700 text-white"
              >
                {t('done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
