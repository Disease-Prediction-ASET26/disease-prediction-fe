import type { IconName } from '../components/ui/Icon';
import type { Role } from '../domain/profile';
import { PATHS } from './paths';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/**
 * The sidebar of each workspace (Pocket Doc design). A user sees only the workspace of the role in
 * their profile; the backend decides the role, the UI never lets a user switch it.
 */
export const NAVIGATION: Record<Role, NavItem[]> = {
  PATIENT: [
    { to: PATHS.home, label: 'Overview', icon: 'home' },
    { to: PATHS.assessment, label: 'New assessment', icon: 'pulse' },
    { to: PATHS.reports, label: 'My reports', icon: 'file' },
    { to: PATHS.appointments, label: 'Appointments', icon: 'calendar' },
    { to: PATHS.account, label: 'Account', icon: 'user' },
  ],
  DOCTOR: [
    { to: PATHS.home, label: 'Dashboard', icon: 'home' },
    { to: PATHS.doctorAssessments, label: 'Assessments', icon: 'file' },
    { to: PATHS.doctorSchedule, label: 'Schedule', icon: 'calendar' },
    { to: PATHS.doctorProfile, label: 'Doctor profile', icon: 'doctor' },
    { to: PATHS.account, label: 'Account', icon: 'user' },
  ],
  ADMIN: [
    { to: PATHS.home, label: 'Overview', icon: 'home' },
    { to: PATHS.adminDoctors, label: 'Doctors', icon: 'doctor' },
    { to: PATHS.adminUsers, label: 'Users', icon: 'users' },
    { to: PATHS.adminModel, label: 'AI model', icon: 'brain' },
    { to: PATHS.adminAudit, label: 'Access audit', icon: 'audit' },
    { to: PATHS.account, label: 'Account', icon: 'user' },
  ],
};

/** Before sign-in (or while the profile loads): the public pages only. */
export const PUBLIC_NAVIGATION: NavItem[] = [
  { to: PATHS.home, label: 'Home', icon: 'home' },
  { to: PATHS.login, label: 'Sign in', icon: 'login' },
];

export const ROLE_LABELS: Record<Role, string> = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  ADMIN: 'Administrator',
};

/** "Alex Morgan" → "AM"; falls back to the first letter of the email. */
export function initialsOf(fullName: string, email: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.[0];
  return (letters ?? email[0] ?? '?').toUpperCase();
}
