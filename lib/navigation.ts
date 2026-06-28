import {
  LayoutDashboard,
  Users,
  Radio,
  Cpu,
  FileCheck,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and safety metrics',
  },
  {
    label: 'Workers',
    href: '/workers',
    icon: Users,
    description: 'Workforce management',
  },
  {
    label: 'Sensors',
    href: '/sensors',
    icon: Radio,
    description: 'Real-time sensor monitoring',
  },
  {
    label: 'Machines',
    href: '/machines',
    icon: Cpu,
    description: 'Equipment and machinery',
  },
  {
    label: 'Permits',
    href: '/permits',
    icon: FileCheck,
    description: 'Work permits and approvals',
  },
  {
    label: 'Incidents',
    href: '/incidents',
    icon: AlertTriangle,
    description: 'Incident reporting and tracking',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Safety analytics and trends',
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'Generate and manage reports',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Platform configuration',
  },
];
