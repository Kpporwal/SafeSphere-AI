import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType =
  | 'active'
  | 'off_duty'
  | 'on_leave'
  | 'inactive'
  | 'operational'
  | 'maintenance'
  | 'offline'
  | 'fault'
  | 'online'
  | 'warning'
  | 'critical'
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'closed'
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'low'
  | 'medium'
  | 'high'
  | 'minor'
  | 'moderate'
  | 'serious'
  | 'scheduled'
  | 'completed'
  | 'failed'
  | 'acknowledged';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  off_duty: { label: 'Off Duty', className: 'bg-muted text-muted-foreground border-border' },
  on_leave: { label: 'On Leave', className: 'bg-warning/10 text-warning border-warning/20' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border' },
  operational: { label: 'Operational', className: 'bg-success/10 text-success border-success/20' },
  maintenance: { label: 'Maintenance', className: 'bg-warning/10 text-warning border-warning/20' },
  offline: { label: 'Offline', className: 'bg-muted text-muted-foreground border-border' },
  fault: { label: 'Fault', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  online: { label: 'Online', className: 'bg-success/10 text-success border-success/20' },
  warning: { label: 'Warning', className: 'bg-warning/10 text-warning border-warning/20' },
  critical: { label: 'Critical', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  open: { label: 'Open', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  investigating: { label: 'Investigating', className: 'bg-warning/10 text-warning border-warning/20' },
  resolved: { label: 'Resolved', className: 'bg-success/10 text-success border-success/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground border-border' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-primary/10 text-primary border-primary/20' },
  high: { label: 'High', className: 'bg-warning/10 text-warning border-warning/20' },
  minor: { label: 'Minor', className: 'bg-muted text-muted-foreground border-border' },
  moderate: { label: 'Moderate', className: 'bg-primary/10 text-primary border-primary/20' },
  serious: { label: 'Serious', className: 'bg-warning/10 text-warning border-warning/20' },
  scheduled: { label: 'Scheduled', className: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  acknowledged: { label: 'Acknowledged', className: 'bg-primary/10 text-primary border-primary/20' },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium capitalize',
        config.className,
        className
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? config.label}
    </Badge>
  );
}
