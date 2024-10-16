import Icon from "@mdi/react";

interface ButtonIconProps {
    icon: string;
    color?: string;
    colorPressed?: string;
    size?: number;
    className?: string;
    onPress: () => void;
}
export default function ButtonIcon({
    className,
    icon,
    size,
    onPress,
}: ButtonIconProps) {
    return (
        <button className={`clickable ${className}`} onClick={onPress}>
            <Icon path={icon} size={size || 1} />
        </button>
    );
}
