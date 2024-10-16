import React from "react";

interface LogoProps {
    size?: number;
    className?: string;
}
export default function Logo({ size, className }: LogoProps) {
    const w = size || 80;
    const h = size || 80;

    return (
      <svg className={className} width={w} height={h} viewBox="0 0 562 562" xmlns="http://www.w3.org/2000/svg">
        <polygon fill="white" points="507,562 271,220 507,220" />
        <polygon fill="white" points="55,562 291,220 55,220" />
        <ellipse cx="281" cy="55" rx="160" ry="40" fill="none" stroke-width="30" stroke="yellow" />
  </svg>
    );
}
