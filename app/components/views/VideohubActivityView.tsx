"use client"

import { IVideohubActivity } from '@/app/interfaces/videohub';
import { ActivityItem, Icon, Link, mergeStyleSets, Text } from '@fluentui/react';
import { redirect, useRouter } from 'next/navigation';
import * as React from 'react';

const classNames = mergeStyleSets({
  exampleRoot: {
    marginTop: '20px',
  },
  nameText: {
    fontWeight: '500',
  },
});

export const VideohubActivityView = (p: { activityItems: IVideohubActivity[] | null }) => {
  const router = useRouter();

  return (
    <div>
      <h1 className='text-3xl font-bold'>Recent Activity of Videohubs</h1>
      {p.activityItems == null || p.activityItems.length == 0 ?
        <p>No activities yet.</p> :
        <div>
          {p.activityItems.map((item, _key) => (
            <ActivityItem activityIcon={<Icon iconName={item.icon} />} timeStamp={item.time.toLocaleDateString() + " " + item.time.toLocaleTimeString()}
              comments={[
                <Link
                  key={item.id + "_videohub"}
                  onClick={(_event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>) => {
                    router.push(`../videohubs?videohub=${item.videohub_id}`);
                  }}
                >{item.title}</Link>,
              ]} activityDescription={[<Text key={item.id + "_text"} className={classNames.nameText}>{item.description}</Text>]} key={item.id} className={classNames.exampleRoot} />
          ))}
        </div>}
    </div>
  );
};
