import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  House,
  Info,
  LockKeyhole,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

const icons = {
  home: House,
  pulse: Activity,
  file: FileText,
  calendar: CalendarDays,
  user: UserRound,
  users: UsersRound,
  shield: ShieldCheck,
  brain: Brain,
  audit: ClipboardList,
  plus: Plus,
  search: Search,
  chevron: ChevronRight,
  check: Check,
  alert: AlertTriangle,
  info: Info,
  clock: Clock3,
  menu: Menu,
  moon: Moon,
  sun: Sun,
  close: X,
  logout: LogOut,
  login: LogIn,
  lock: LockKeyhole,
  doctor: Stethoscope,
} as const;

export type IconName = keyof typeof icons;

/** Decorative icons are hidden from assistive technology. */
export function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const Component = icons[name];
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" focusable="false" />;
}
