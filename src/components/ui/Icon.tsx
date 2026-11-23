import type { ReactNode } from 'react';

/** Icon set from the Pocket Doc design (stroke icons on a 24×24 grid). */
export type IconName =
  | 'home'
  | 'pulse'
  | 'file'
  | 'calendar'
  | 'user'
  | 'users'
  | 'shield'
  | 'brain'
  | 'audit'
  | 'plus'
  | 'search'
  | 'chevron'
  | 'check'
  | 'alert'
  | 'info'
  | 'clock'
  | 'menu'
  | 'close'
  | 'logout'
  | 'lock'
  | 'doctor'
  | 'login';

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </>
  ),
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h4M9 13h6M9 17h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.5M16 14a5 5 0 0 1 4.5 5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5c0 4.6 3.1 8.8 7.5 10 4.4-1.2 7.5-5.4 7.5-10V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  brain: (
    <path d="M9.5 4.5A3 3 0 0 0 5 7a3 3 0 0 0 .5 5.8A3.5 3.5 0 0 0 9 18.5V5ZM14.5 4.5A3 3 0 0 1 19 7a3 3 0 0 1-.5 5.8 3.5 3.5 0 0 1-3.5 5.7V5ZM9 9h2M13 13h2" />
  ),
  audit: (
    <>
      <path d="M5 3h14v18H5z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  alert: (
    <>
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v5M12 17.4v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />,
  login: <path d="M14 5h5v14h-5M10 8l-4 4 4 4M6 12h9" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  doctor: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2M9 14.7V18l3 2 3-2v-3.3" />
    </>
  ),
};

/** Decorative icon; always hidden from assistive technology. */
export function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
