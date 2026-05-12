'use client';

import UploadVideo from '@/components/video/UploadVideo';
import { useTranslations } from 'next-intl';

export default function StudioUploadPage() {
  const t = useTranslations('Studio.upload');
  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-zinc-500">{t('subtitle')}</p>
      </div>
      <UploadVideo />
    </div>
  );
}
