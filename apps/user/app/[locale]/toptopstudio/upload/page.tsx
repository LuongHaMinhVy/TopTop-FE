'use client';

import React from 'react';
import UploadVideo from '@/components/video/UploadVideo';
import { useTranslations } from 'next-intl';
import { DocumentTitle } from '@/components/shared/DocumentTitle';

export default function StudioUploadPage() {
  const t = useTranslations('Studio.upload');

  return (
    <div className="w-full">
      <DocumentTitle title="Upload | TopTop Studio" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-text-secondary mt-1">{t('subtitle')}</p>
      </div>
      
      <UploadVideo />
    </div>
  );
}
