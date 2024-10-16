import { ArrowLeftIcon } from "lucide-react";

interface BackProps {
    onClick: () => void;
}
export default function Back({ onClick }: BackProps) {
    return <button className="bg-zinc-950 rounded-full p-2" onClick={onClick}>
        <ArrowLeftIcon size={30} />
    </button>
}
