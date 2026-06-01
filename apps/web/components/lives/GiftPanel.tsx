"use client";

import { useState } from "react";
import { Button, Modal } from "@repo/ui";
import { Gift, Loader2 } from "lucide-react";
import { useGiftCatalog, useSendGift } from "@/hooks/live-hooks";

interface GiftPanelProps {
  livestreamId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftPanel({ livestreamId, isOpen, onClose }: GiftPanelProps) {
  const [sendError, setSendError] = useState("");
  const { data, isLoading, isError } = useGiftCatalog();
  const sendGift = useSendGift();
  const gifts = data?.data || [];

  const handleSendGift = async (giftId: number) => {
    try {
      setSendError("");
      await sendGift.mutateAsync({
        id: livestreamId,
        data: { giftId, quantity: 1 },
      });
      onClose();
    } catch (error: unknown) {
      const maybeError = error as { response?: { data?: { message?: string } } };
      setSendError(maybeError.response?.data?.message || "Could not send this gift.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send a gift" className="max-w-[560px]">
      {isLoading && (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      )}

      {isError && (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
          <Gift className="h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-muted">Gift catalog is unavailable.</p>
        </div>
      )}

      {!isLoading && !isError && gifts.length === 0 && (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
          <Gift className="h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-muted">No gifts are available right now.</p>
        </div>
      )}

      {!isLoading && !isError && gifts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gifts.map((gift) => (
            <button
              key={gift.id}
              type="button"
              onClick={() => handleSendGift(gift.id)}
              disabled={sendGift.isPending}
              className="flex min-h-36 flex-col items-center justify-between rounded-lg border border-elevated bg-surface p-4 text-center transition-colors hover:bg-hover disabled:pointer-events-none disabled:opacity-60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gift.iconUrl}
                alt={gift.name}
                className="h-14 w-14 object-contain"
              />
              <div>
                <p className="text-sm font-bold text-text-primary">{gift.name}</p>
                <p className="text-xs text-text-muted">{gift.coinPrice} coins</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {sendError && (
        <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-brand">{sendError}</p>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
