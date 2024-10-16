import DebugProvider from "./debug/provider";

export default function({ children }: { children: React.ReactNode }) {
    return <DebugProvider>{children}</DebugProvider>;
}
