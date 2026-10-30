import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, strokeWidth = 2, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const ArrowLeft = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const Check = (p: IconProps) => (
  <Icon strokeWidth={2.6} {...p}>
    <path d="M5 12l5 5L20 7" />
  </Icon>
);

export const AlertCircle = (p: IconProps) => (
  <Icon strokeWidth={2.4} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.5" />
  </Icon>
);

export const Sparkle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
  </Icon>
);

export const Chat = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
  </Icon>
);

export const ChevronDown = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const Refresh = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
  </Icon>
);

export const Clock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const ListCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M11 6h9M11 12h9M11 18h9M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5 2.5-2.5" />
  </Icon>
);

export const Grid = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Icon>
);

export const Phone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Icon>
);

export const Mail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Icon>
);

// Biểu tượng cho từng lĩnh vực
export const Flag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 21V4M4 4h12l-2 4 2 4H4" />
  </Icon>
);
export const Heart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Icon>
);
export const Chart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h16M7 16v-5M12 16V8M17 16v-8" />
  </Icon>
);
export const Star = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l2.2 5.4L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.6z" />
  </Icon>
);
export const Book = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6.5C5.5 5 8.5 5 12 7c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z" />
    <path d="M12 7v12.5" />
  </Icon>
);
export const Code = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />
  </Icon>
);
export const Wrench = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.3-6.3a4 4 0 0 1-5-5L13 5zM3 21l6-6" />
  </Icon>
);
export const Cross = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
  </Icon>
);
export const Megaphone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12" />
  </Icon>
);
export const Briefcase = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
  </Icon>
);

export function SunLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E0532B" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="#FFC93C" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}
