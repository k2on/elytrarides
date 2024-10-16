import { CSSProperties } from "react";

interface ViewProps {
    id?: string;
    className?: string;
    children?: React.ReactNode;
    style?: CSSProperties;
    onClick?: () => void;
}
export default function View({ id, style, children, className, onClick }: ViewProps) {
    return (
        <div style={style} id={id} className={className} onClick={onClick}>
            {children}
        </div>
    );
}
