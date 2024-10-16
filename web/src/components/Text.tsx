interface TextProps {
    className?: string;
    children: React.ReactNode;
}
export default function Text({ children, className }: TextProps) {
    return <span className={className}>{children}</span>;
}
