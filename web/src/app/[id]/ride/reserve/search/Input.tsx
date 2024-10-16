import { useEffect, useRef } from "react";

interface InputProps {
    placeholder: string;
    value: string;
    setValue: (v: string) => void;
}
export default function Input({ placeholder, value, setValue }: InputProps) {
    const ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        ref.current?.select();
    }, []);
    return (
        <input
            ref={ref}
            className="w-full bg-transparent text-white outline-none"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
        />
    );
}
