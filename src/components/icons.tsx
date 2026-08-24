import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P): P => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const IconFlame = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21c3.9 0 6.5-2.5 6.5-6.1 0-2.5-1.4-4.4-2.7-6C14.5 7.3 13 5.4 13 3c-3 1.5-4.3 4-3.9 6.6-.9-.3-1.7-1-2.1-2.1-1.2 1.5-1.5 3.4-1.5 4.9C5.5 18.5 8.1 21 12 21Z" />
    <path d="M12 21c1.8 0 3-1.3 3-3 0-1.6-1.1-2.6-3-4-1.9 1.4-3 2.4-3 4 0 1.7 1.2 3 3 3Z" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 6.5C10.4 4.9 8 4.5 5.5 4.5c-.8 0-1.5.1-2 .2v14.1c.5-.1 1.2-.2 2-.2 2.5 0 4.9.5 6.5 2 1.6-1.5 4-2 6.5-2 .8 0 1.5.1 2 .2V4.7c-.5-.1-1.2-.2-2-.2-2.5 0-4.9.4-6.5 2Z" />
    <path d="M12 6.5v14.1" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconGauge = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 17.5a8.5 8.5 0 1 1 15 0" />
    <path d="M12 13.5 15.5 9" />
    <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconStar = ({ filled = true, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.6}>
    <path d="m12 3.4 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16l-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7L12 3.4Z" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </svg>
);

export const IconTrendUp = (p: P) => (
  <svg {...base(p)}>
    <path d="m3.5 17 5.5-5.5 3.5 3.5L20.5 7" />
    <path d="M15 7h5.5V12.5" />
  </svg>
);

export const IconTrendDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m3.5 7 5.5 5.5L12.5 9l8 8" />
    <path d="M20.5 12v5.5H15" />
  </svg>
);

export const IconBookmark = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 4h10a1 1 0 0 1 1 1v15.5l-6-4.2-6 4.2V5a1 1 0 0 1 1-1Z" />
  </svg>
);

export const IconFeather = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.5 4.5c-5.5-1.5-11 1-13.5 5.5-1.6 2.9-1.6 6.5-1 9 2.5.6 6.1.6 9-1 4.5-2.5 7-8 5.5-13.5Z" />
    <path d="M5 19.5 15 9.5M9.5 15.5H15M12 12h5" />
  </svg>
);

export const IconArrowUpRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export const IconLibrary = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 4.5v15M9 4.5v15M13.5 4.5v15" />
    <path d="m17 5.5 3.5 13.5" />
    <path d="M2.5 19.5h19" />
  </svg>
);

export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconSparkle = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5c.6 3.9 2 5.9 6.5 6.5-4.5.6-5.9 2.6-6.5 6.5-.6-3.9-2-5.9-6.5-6.5 4.5-.6 5.9-2.6 6.5-6.5Z" />
    <path d="M18.5 15.5c.3 1.8 1 2.7 3 3-2 .3-2.7 1.2-3 3-.3-1.8-1-2.7-3-3 2-.3 2.7-1.2 3-3Z" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 5.5 6.5 6.5L9 18.5" />
  </svg>
);

export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m15 5.5-6.5 6.5L15 18.5" />
  </svg>
);

export const IconFileText = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14.5 3.5Z" />
    <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
  </svg>
);

export const IconHourglass = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 3.5h10M7 20.5h10" />
    <path d="M8 3.5v3.2c0 2.5 4 3.6 4 5.3s-4 2.8-4 5.3v3.2M16 3.5v3.2c0 2.5-4 3.6-4 5.3s4 2.8 4 5.3v3.2" />
  </svg>
);
