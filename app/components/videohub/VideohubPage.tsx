import { VideohubFooter } from "../VideohubFooter";
import { IVideohub } from "@/app/interfaces/videohub";

interface InputProps {
    children: React.ReactNode,
    videohub?: IVideohub,
}

export const videohubPageStyle = { paddingBottom: '1vh', paddingTop: '1vh', paddingLeft: '2vh', paddingRight: '2vh' };

export const VideohubPage = (p: InputProps) => {
    return (
        <div>
            <VideohubFooter videohub={p.videohub} />
            {p.children}
        </div>
    )
}