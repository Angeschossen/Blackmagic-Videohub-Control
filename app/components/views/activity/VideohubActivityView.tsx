import { IVideohubActivity } from '@/app/interfaces/videohub';
import * as React from 'react';
import { Activities } from './Activities';
import { useTranslations } from 'next-intl';


export const VideohubActivityView = (p: { activityItems: IVideohubActivity[] | null }) => {
  const t = useTranslations('VideohubActivities');

  return (
    <div>
      {p.activityItems == null || p.activityItems.length == 0 ?
        <p>{t("none")}</p> :
        <Activities items={p.activityItems} />}
    </div>
  );
};
