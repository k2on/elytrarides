import { mdiArrowLeft } from "@mdi/js";
import Icon from "@mdi/react";

interface BackProps {
    onPress: () => void;
}
export default function Back({ onPress }: BackProps) {
    return (
        <button onClick={onPress}>
            <Icon
                className="text-white active:text-gray-400"
                size={1.2}
                path={mdiArrowLeft}
            />
        </button>
    );
}
