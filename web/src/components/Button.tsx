interface ButtonProps {
    title: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}
export default function Button({ title, disabled, className, onClick }: ButtonProps) {
    return (
        <button
            onClick={onClick}
            className={className + ` w-full py-1 rounded-sm
        ${disabled ? "bg-zinc-800 text-gray-500" : "bg-purple-800 text-white"}`}
            disabled={disabled}
        >
            {title}
        </button>
    );
}
