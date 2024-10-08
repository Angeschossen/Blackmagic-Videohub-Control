import { IUser } from "@/app/authentification/interfaces"
import { SignOut } from "./SignOut";
import { useTranslations } from "next-intl";

export const UserHeader = (props: { user: IUser }) => {
    const t = useTranslations('Header');

    return <div className="flex justify-between items-center py-2 px-3 rounded-md border shadow-md">
        <p className="font-bold">{t("welcome", { user: props.user.username })}</p>
        <div className="group relative">
            <div className="inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-300 rounded-full">
                <span className="font-medium text-black">{props.user.username.substring(0, 1)}</span>
            </div>
            <div className="group-hover:opacity-100 mt-1 opacity-0 absolute w-max right-0 text-base bg-white border shadow-md divide-y divide-gray-200 rounded-md">
                <div className="px-4 py-3 text-sm text-black">
                    <p>{t("user.name", {user: props.user.username})}</p>
                    <p>{t("user.role", {role: props.user.role?.name})}</p>
                </div>
                <ul className="text-sm text-gray-700">
                    <li className="block px-4 py-2 hover:bg-gray-100">
                        <SignOut />
                    </li>
                </ul>
            </div>
        </div>
    </div>;
}