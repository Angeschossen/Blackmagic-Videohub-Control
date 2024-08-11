import { useSession } from "next-auth/react";

export function useGetClientId() {
    const { data: session }: any = useSession();
    return session?.user?.id
}

export function useClientSession(permission?: string) {
    const { data: session } = useSession();

    const obj: any = session;
    if (obj.user.role?.permissions == undefined) {
        return false;
    }

    if (permission == undefined) {
        return true;
    }

    for (const check of obj.user.role.permissions) {
        if (check === permission) {
            return true;
        }
    }

    return false;
}