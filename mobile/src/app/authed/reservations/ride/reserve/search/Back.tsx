import { ButtonIcon } from "@/components";

interface BackProps {
    onPress: () => void;
}
export default function Back({ onPress }: BackProps) {
    return <ButtonIcon size={35} icon="arrow-left" onPress={onPress} />;
}
