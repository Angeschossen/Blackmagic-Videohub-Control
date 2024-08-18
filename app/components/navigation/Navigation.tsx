"use client"

import {
    Hamburger,
    NavDivider,
    NavDrawer,
    NavDrawerBody,
    NavDrawerHeader,
    NavItem,
} from "@fluentui/react-nav-preview";
import * as React from "react";

import {
    Tooltip,
    makeStyles,
    tokens,
} from "@fluentui/react-components";
import {
    ContactCard20Filled,
    ContactCard20Regular,
    MegaphoneLoud20Filled,
    MegaphoneLoud20Regular,
    VideoSwitch20Filled,
    VideoSwitch20Regular,
    bundleIcon,
} from "@fluentui/react-icons";
import { usePathname, useRouter } from 'next/navigation';
import { useMediaQuery } from "react-responsive";
import { useClientSession } from "@/app/authentification/client-auth";
import { PERMISSION_ROLE_EDIT, PERMISSION_USER_EDIT } from "@/app/authentification/permissions";


const Videohubs = bundleIcon(VideoSwitch20Filled, VideoSwitch20Regular);
const Home = bundleIcon(MegaphoneLoud20Filled, MegaphoneLoud20Regular);
const Administration = bundleIcon(ContactCard20Filled, ContactCard20Regular);

export function useNavViewType() {
    return useMediaQuery({ query: `(min-width: 1025px)` });
}

type LayoutProps = {
    children: React.ReactNode
}

export const Navigation = (props: LayoutProps) => {
    const canEditRoles = React.useRef(useClientSession(PERMISSION_ROLE_EDIT))
    const canEditUsers = React.useRef(useClientSession(PERMISSION_USER_EDIT))
    const isDesktop = useNavViewType()
    const [isOpen, setIsOpen] = React.useState(isDesktop);
    const [selected, setSelected] = React.useState(usePathname())
    const router = useRouter();
    //const [isMounted, setIsMounted] = useState(false);

    /*
    useEffect(() => {
        setIsMounted(true);
    }, []);
    */

    const renderHamburgerWithToolTip = () => {
        return (
            <Tooltip content="Navigation" relationship="label">
                <Hamburger onClick={() => setIsOpen(!isOpen)} />
            </Tooltip>
        );
    };

    /*
    if (!isMounted) {
        return <></>
    } */

    return (
        <>
            <div className="h-100">
                <NavDrawer
                    selectedValue={selected}
                    open={isOpen}
                    type={isDesktop ? "inline" : "overlay"}
                    onNavItemSelect={e => {
                        e.preventDefault()

                        const item: any = e.target
                        const id: string = item?.id
                        router.push(`..${id}`)
                        setSelected(id);

                        if (!isDesktop) {
                            setIsOpen(false)
                        }
                    }}
                >
                    <NavDrawerHeader>{renderHamburgerWithToolTip()}</NavDrawerHeader>
                    <NavDrawerBody>
                        <NavItem icon={<Home />} value="/" id="/">
                            Home
                        </NavItem>
                        <NavItem icon={<Videohubs />} value="/videohubs" id="/videohubs">
                            Videohubs
                        </NavItem>
                        {canEditRoles.current && canEditUsers.current &&
                            <>
                                < NavDivider />
                                <NavItem icon={<Administration />} value="/admin" id="/admin">
                                    Administration
                                </NavItem>
                            </>
                        }
                    </NavDrawerBody>
                </NavDrawer>
            </div>
            <div className="flex-1 justify-items-center md:justify-items-start items-start m-5">
                {!isOpen && renderHamburgerWithToolTip()}
                <div>
                    {props.children}
                </div>
            </div>
        </>
    );
};