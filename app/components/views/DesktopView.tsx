import { desktopMinWidth } from "@/app/util/styles";
import { useMediaQuery } from "react-responsive";

export function useViewType() {
    return useMediaQuery({ query: `(min-width: ${desktopMinWidth})` });
}