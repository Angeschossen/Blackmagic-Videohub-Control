import { IVideohubActivity } from '@/app/interfaces/videohub';
import * as React from 'react';
import { Activities } from './Activities';


export const VideohubActivityView = (p: { activityItems: IVideohubActivity[] | null }) => {
  return (
    <div>
      <h1 className='text-3xl font-bold'>Recent Activity of Videohubs</h1>
      {p.activityItems == null || p.activityItems.length == 0 ?
        <p>No activities yet.</p> :
        <Activities items={p.activityItems} />}
    </div>
  );
};
