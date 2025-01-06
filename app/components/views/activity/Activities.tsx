"use client"

import { IVideohubActivity } from "@/app/interfaces/videohub";
import { ActivityItem, Icon, Link, Text } from '@fluentui/react';
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export const Activities = (props: { items: IVideohubActivity[] }) => {
    const router = useRouter();
    const t = useTranslations('VideohubActivities');
    const format = useFormatter();

    // item.time.toLocaleDateString() + " " + item.time.toLocaleTimeString()
    return <div>
        {props.items.map((item, _key) => (
            <ActivityItem activityIcon={<Icon iconName={item.icon} />} timeStamp={`${format.dateTime(item.time)} ${format.dateTime(item.time, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}`}
                comments={[
                    <Link
                        key={item.id + "_videohub"}
                        onClick={(_event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>) => {
                            router.push(`../videohubs?videohub=${item.videohub_id}`);
                        }}
                    >{item.title}</Link>,
                ]} activityDescription={[<Text key={item.id + "_text"} className="font-semibold" >{t(item.description)}</Text>]} key={item.id} className="mt-5" />
        ))}
    </div>;
}