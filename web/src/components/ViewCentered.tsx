import View from "./View";

interface ViewCenteredProps {
    children: React.ReactNode;
    className?: string;
}
export default function ViewCentered({
    children,
    className,
}: ViewCenteredProps) {
    return (
        <View className={`grid place-items-center h-screen ${className}`} style={{ height: "-webkit-fill-available" }}>
            {children}
        </View>
    );
}
