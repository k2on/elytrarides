import { View } from "react-native";

interface ViewCenteredProps {
    children: React.ReactNode;
    className?: string;
}
export default function ViewCentered({
    children,
    className,
}: ViewCenteredProps) {
    return (
        <View className={`flex-1 justify-center ${className}`}>{children}</View>
    );
}
