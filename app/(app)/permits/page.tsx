'use client';

import * as React from 'react';
import { FileCheck, Plus, Download, MapPin, Calendar, AlertCircle } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterSelect } from '@/components/shared/filter-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import type { Department, Permit, Worker } from '@/types/database';
import AddPermitDialog from '@/components/permits/AddPermitDialog';
import PermitDetailsDrawer from '@/components/permits/PermitDetailsDrawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin as MapPinIcon, Download as DownloadIcon, Calendar as CalendarIcon, AlertCircle as AlertCircleIcon } from 'lucide-react';

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
  { label: 'Active', value: 'active' },
];

const typeOptions = [
  { label: 'Hot Work', value: 'hot_work' },
  { label: 'Confined Space', value: 'confined_space' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Height Work', value: 'height_work' },
  { label: 'Excavation', value: 'excavation' },
  { label: 'Lifting', value: 'lifting' },
  { label: 'Chemical', value: 'chemical' },
];

const typeLabels: Record<string, string> = {
  hot_work: 'Hot Work',
  confined_space: 'Confined Space',
  electrical: 'Electrical',
  height_work: 'Height Work',
  excavation: 'Excavation',
  lifting: 'Lifting',
  chemical: 'Chemical',
};

export default function PermitsPage() {
  const [openAddPermit, setOpenAddPermit] = React.useState(false);
  const [openEditPermit, setOpenEditPermit] = React.useState(false);
  const [selectedPermit, setSelectedPermit] = React.useState<Permit | null>(null);
  // (kept for parity with other modules; current implementation uses PermitDetailsDrawer sheet)
  const [drawerOpen, setDrawerOpen] = React.useState(false);


  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');

  const { toast } = useToast();

  const { data: permits, isLoading } = useSupabaseQuery<Permit>({
    table: 'permits',
    order: { column: 'created_at', ascending: false },
    limit: 1000,
    queryKey: ['permits'],
  });

  const { data: departments } = useSupabaseQuery<Department>({
    table: 'departments',
    limit: 200,
    queryKey: ['departments'],
  });

  const deptMap = React.useMemo(() => {
    const m = new Map<string, string>();
    (departments ?? []).forEach((d) => m.set(d.id, d.name));
    return m;
  }, [departments]);

  const filtered = React.useMemo(() => {
    return (permits ?? []).filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      const pDept = (p as any).department_id ?? null;
      if (deptFilter !== 'all' && pDept !== deptFilter) return false;
      return true;
    });
  }, [permits, statusFilter, typeFilter, deptFilter]);

  const pendingCount = filtered.filter((p) => p.status === 'pending').length;
  const approvedCount = filtered.filter((p) => p.status === 'approved').length;
  const activeCount = filtered.filter((p) => p.status === 'active').length;
  const expiredCount = filtered.filter((p) => p.status === 'expired').length;

  const openEditDialog = (permit: Permit) => {
    setSelectedPermit(permit);
    setOpenEditPermit(true);
  };


  const columns: Column<Permit>[] = [
    {
      key: 'permit_number',
      header: 'Permit #',
      sortable: true,
      sortAccessor: (p) => p.permit_number,
      cell: (p) => (
        <span className="text-sm font-medium font-mono">{p.permit_number}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      cell: (p) => (
        <div>
          <p className="text-sm font-medium">{p.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (p) => (
        <Badge variant="outline" className="text-xs">
          {typeLabels[p.type] ?? p.type}
        </Badge>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (p) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {p.location}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Duration',
      cell: (p) => (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(p.start_date).toLocaleString()}
          </p>
          <p>to {new Date(p.end_date).toLocaleString()}</p>
        </div>
      ),
    },
    {
      key: 'hazards',
      header: 'Hazards',
      cell: (p) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {p.hazards?.slice(0, 2).map((h, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">
              <AlertCircle className="mr-1 h-2 w-2" />
              {h}
            </Badge>
          ))}
          {p.hazards && p.hazards.length > 2 && (
            <Badge variant="outline" className="text-[10px]">
              +{p.hazards.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <AddPermitDialog
        open={openAddPermit}
        onOpenChange={setOpenAddPermit}
        mode="add"
      />
      <PageHeader
        title="Permits"
        description="Manage work permits and approval workflows"
        icon={<FileCheck className="h-5 w-5 text-primary" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  const rows = filtered ?? [];
                  const headers = [
                    'permit_number',
                    'title',
                    'type',
                    'department',
                    'worker',
                    'issued_by',
                    'start_date',
                    'expiry_date',
                    'status',
                    'description',
                    'notes',
                  ];

                  const csvEscape = (v: unknown) => {
                    const s = v === null || v === undefined ? '' : String(v);
                    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                    return s;
                  };

                  const csv = [
                    headers.join(','),
                    ...rows.map((p) => {
                      const deptName = (p as any).department_id ? deptMap.get((p as any).department_id) ?? '—' : '—';
                      const workerName = (p as any).worker_id ? (p as any).worker_id : '—';
                      const notes = (p.precautions ?? []).join('|');
                      return [
                        p.permit_number,
                        p.title,
                        p.type,
                        deptName,
                        workerName,
                        p.requested_by,
                        p.start_date,
                        p.end_date,
                        p.status,
                        p.description,
                        notes,
                      ]
                        .map(csvEscape)
                        .join(',');
                    }),
                  ].join('\n');

                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `permits-${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Failed to export CSV.';
                  toast({
                    variant: 'destructive',
                    title: 'Export failed',
                    description: message,
                  });
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedPermit(null);
                setOpenAddPermit(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Permit
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Permits"
          value={permits?.length ?? 0}
          icon={<FileCheck className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          title="Pending Approval"
          value={pendingCount}
          icon={<FileCheck className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<FileCheck className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          title="Expired"
          value={expiredCount}
          icon={<FileCheck className="h-5 w-5" />}
          accent="destructive"
        />
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            searchPlaceholder="Search permits by number or title..."
            searchAccessor={(p) => `${p.permit_number} ${p.title}`}
            getRowId={(p) => p.id}
            emptyTitle="No permits found"
            emptyDescription="Try adjusting your filters or search query."
            toolbar={
              <>
                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  placeholder="All Statuses"
                  className="w-[140px]"
                />
                <FilterSelect
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={typeOptions}
                  placeholder="All Types"
                  className="w-[160px]"
                />
                <FilterSelect
                  value={deptFilter}
                  onChange={setDeptFilter}
                  options={(departments ?? []).map((d) => ({ label: d.name, value: d.id }))}
                  placeholder="All Departments"
                  className="w-[180px]"
                />
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
