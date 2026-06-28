'use client';

import * as React from 'react';
import { Users, UserPlus, Download, Mail, Phone, MapPin, HardHat, Clock, ShieldCheck, ShieldAlert, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterSelect } from '@/components/shared/filter-select';
import { Button } from '@/components/ui/button';
import AddWorkerDialog from "@/components/workers/AddWorkerDialog";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import type { Worker, Department } from '@/types/database';

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Off Duty', value: 'off_duty' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Inactive', value: 'inactive' },
];

const shiftOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Night', value: 'night' },
  { label: 'Rotating', value: 'rotating' },
];

const ppeOptions = [
  { label: 'Compliant', value: 'compliant' },
  { label: 'Non-Compliant', value: 'non_compliant' },
  { label: 'Expired', value: 'expired' },
  { label: 'Partial', value: 'partial' },
];

const ppeStatusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  compliant: { label: 'Compliant', className: 'bg-success/10 text-success border-success/20', icon: <ShieldCheck className="h-3 w-3" /> },
  non_compliant: { label: 'Non-Compliant', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: <ShieldAlert className="h-3 w-3" /> },
  expired: { label: 'Expired', className: 'bg-warning/10 text-warning border-warning/20', icon: <ShieldAlert className="h-3 w-3" /> },
  partial: { label: 'Partial', className: 'bg-warning/10 text-warning border-warning/20', icon: <ShieldAlert className="h-3 w-3" /> },
};

function PPEBadge({ status }: { status: string }) {
  const config = ppeStatusConfig[status] ?? ppeStatusConfig.compliant;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  );
}

export default function WorkersPage() {
  const [openAddWorker, setOpenAddWorker] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [shiftFilter, setShiftFilter] = React.useState('all');
  const [ppeFilter, setPpeFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');
  const [selectedWorker, setSelectedWorker] = React.useState<Worker | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const { data: workers, isLoading } = useSupabaseQuery<Worker>({
    table: 'workers',
    limit: 1000,
  });
  console.log("Workers:", workers);
console.log("Loading:", isLoading);

  const { data: departments } = useSupabaseQuery<Department>({
    table: 'departments',
    limit: 100,
  });

  const deptMap = React.useMemo(() => {
    const m = new Map<string, string>();
    departments?.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [departments]);

  const filtered = React.useMemo(() => {
    return (workers ?? []).filter((w) => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (shiftFilter !== 'all' && w.shift !== shiftFilter) return false;
      if (ppeFilter !== 'all' && w.ppe_status !== ppeFilter) return false;
      if (deptFilter !== 'all' && w.department_id !== deptFilter) return false;
      return true;
    });
  }, [workers, statusFilter, shiftFilter, ppeFilter, deptFilter]);

  const activeCount = workers?.filter((w) => w.status === 'active').length ?? 0;
  const onLeaveCount = workers?.filter((w) => w.status === 'on_leave').length ?? 0;
  const ppeCompliant = workers?.filter((w) => w.ppe_status === 'compliant').length ?? 0;
  const ppeNonCompliant = workers?.filter((w) => w.ppe_status !== 'compliant').length ?? 0;

  const handleRowClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setDrawerOpen(true);
  };

  const columns: Column<Worker>[] = [
    {
      key: 'name',
      header: 'Worker',
      sortable: true,
      sortAccessor: (w) => w.full_name,
      cell: (w) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            {w.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-sm font-medium">{w.full_name}</p>
            <p className="text-xs text-muted-foreground">{w.employee_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      cell: (w) => <span className="text-sm">{w.position}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      cell: (w) => (
        <span className="text-sm text-muted-foreground">
          {w.department_id ? (deptMap.get(w.department_id) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      cell: (w) => (
        <Badge variant="outline" className="text-xs">
          <Clock className="mr-1 h-3 w-3" />
          {w.shift ? w.shift.charAt(0).toUpperCase() + w.shift.slice(1) : '—'}
        </Badge>
      ),
    },
    {
      key: 'ppe',
      header: 'PPE Status',
      cell: (w) => <PPEBadge status={w.ppe_status} />,
    },
    {
      key: 'location',
      header: 'Location',
      cell: (w) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {w.location ?? '—'}
        </span>
      ),
    },
    {
      key: 'training',
      header: 'Training Expiry',
      sortable: true,
      sortAccessor: (w) => w.safety_training_expiry ?? '',
      cell: (w) => {
        if (!w.safety_training_expiry) return <span className="text-sm text-muted-foreground">—</span>;
        const expiry = new Date(w.safety_training_expiry);
        const expired = expiry < new Date();
        return (
          <span className={`text-sm ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
            {expiry.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (w) => <StatusBadge status={w.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workers"
        description="Manage your workforce and track safety training"
        icon={<Users className="h-5 w-5 text-primary" />}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
  size="sm"
  onClick={() => setOpenAddWorker(true)}
>
  <UserPlus className="mr-2 h-4 w-4" />
  Add Worker
</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Workers"
          value={workers?.length ?? 0}
          icon={<Users className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Users className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          title="PPE Compliant"
          value={ppeCompliant}
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          title="PPE Issues"
          value={ppeNonCompliant}
          icon={<ShieldAlert className="h-5 w-5" />}
          accent="destructive"
        />
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            searchPlaceholder="Search workers by name or ID..."
            searchAccessor={(w) => `${w.full_name} ${w.employee_id} ${w.position}`}
            onRowClick={handleRowClick}
            getRowId={(w) => w.id}
            emptyTitle="No workers found"
            emptyDescription="Try adjusting your filters or search query."
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  placeholder="All Statuses"
                  className="w-[130px]"
                />
                <FilterSelect
                  value={shiftFilter}
                  onChange={setShiftFilter}
                  options={shiftOptions}
                  placeholder="All Shifts"
                  className="w-[120px]"
                />
                <FilterSelect
                  value={ppeFilter}
                  onChange={setPpeFilter}
                  options={ppeOptions}
                  placeholder="PPE Status"
                  className="w-[140px]"
                />
                <FilterSelect
                  value={deptFilter}
                  onChange={setDeptFilter}
                  options={(departments ?? []).map((d) => ({ label: d.name, value: d.id }))}
                  placeholder="All Departments"
                  className="w-[160px]"
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Worker Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedWorker && (
            <>
              <SheetHeader className="pb-4 border-b border-border/50">
                <SheetTitle className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-base font-medium text-primary">
                    {selectedWorker.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{selectedWorker.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedWorker.employee_id}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="p-6 space-y-6">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedWorker.status} />
                  <PPEBadge status={selectedWorker.ppe_status} />
                  <Badge variant="outline" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    {selectedWorker.shift ? selectedWorker.shift.charAt(0).toUpperCase() + selectedWorker.shift.slice(1) : '—'} Shift
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedWorker.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWorker.email}</span>
                      </div>
                    )}
                    {selectedWorker.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWorker.phone}</span>
                      </div>
                    )}
                    {selectedWorker.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWorker.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Employment Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Employment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Position</p>
                      <p className="text-sm font-medium">{selectedWorker.position}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">
                        {selectedWorker.department_id ? (deptMap.get(selectedWorker.department_id) ?? '—') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Hire Date</p>
                      <p className="text-sm font-medium">{new Date(selectedWorker.hire_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Training Expiry</p>
                      <p className={`text-sm font-medium ${selectedWorker.safety_training_expiry && new Date(selectedWorker.safety_training_expiry) < new Date() ? 'text-destructive' : ''}`}>
                        {selectedWorker.safety_training_expiry ? new Date(selectedWorker.safety_training_expiry).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* PPE Items */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <HardHat className="h-4 w-4" />
                    PPE Equipment
                  </h4>
                  {selectedWorker.ppe_items && selectedWorker.ppe_items.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedWorker.ppe_items.map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <ShieldCheck className="mr-1 h-3 w-3 text-success" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No PPE items recorded</p>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <AddWorkerDialog
  open={openAddWorker}
  onOpenChange={setOpenAddWorker}
/>
    </div>
  );
}
