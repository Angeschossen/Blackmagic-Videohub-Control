"use client"

import { IVideohubActivity } from "@/app/interfaces/videohub";
import { ActivityItem, Icon, Link, mergeStyleSets, Text } from '@fluentui/react';
import { useRouter } from "next/navigation";

const classNames = mergeStyleSets({
    exampleRoot: {
      marginTop: '20px',
    },
    nameText: {
      fontWeight: '500',
    },
  });

export const Activities = (props: { items: IVideohubActivity[] }) => {
    const router = useRouter();

    return <div>
        {props.items.map((item, _key) => (
            <ActivityItem activityIcon={<Icon iconName={item.icon} />} timeStamp={item.time.toLocaleDateString() + " " + item.time.toLocaleTimeString()}
                comments={[
                    <Link
                        key={item.id + "_videohub"}
                        onClick={(_event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>) => {
                            router.push(`../videohubs?videohub=${item.videohub_id}`);
                        }}
                    >{item.title}</Link>,
                ]} activityDescription={[<Text key={item.id + "_text"} className="font-semibold" >{item.description}</Text>]} key={item.id} className="mt-5"/>
        ))}
    </div>;
}