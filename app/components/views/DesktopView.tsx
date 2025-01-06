import { useMediaQuery } from "react-responsive";

const desktopMinWidth = '600px';
export function useViewType() {
    return useMediaQuery({ query: `(min-width: ${desktopMinWidth})` });
}