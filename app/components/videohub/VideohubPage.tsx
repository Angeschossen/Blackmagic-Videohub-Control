import { VideohubFooter } from "../VideohubFooter";
import { IVideohub } from "@/app/interfaces/videohub";

export const VideohubPage = (p: {
    children: React.ReactNode,
    videohub?: IVideohub,
}) => {
    return (
        <div>
            <VideohubFooter videohub={p.videohub} />
            {p.children}
        </div>
    )
}