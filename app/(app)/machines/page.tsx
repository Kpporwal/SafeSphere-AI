'use client';

import * as React from 'react';
import { Cpu, Plus, Download, MapPin, Wrench, Clock, Heart, Activity } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterSelect } from '@/components/shared/filter-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import type { Machine, Department } from '@/types/database';

const statusOptions = [
  { label: 'Operational', value: 'operational' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Offline', value: 'offline' },
  { label: 'Fault', value: 'fault' },
];

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  if (score >= 40) return 'text-primary';
  return 'text-destructive';
}

function getHealthBarColor(score: number): string {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  if (score >= 40) return 'bg-primary';
  return 'bg-destructive';
}

export default function MachinesPage() {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const { data: machines, isLoading } = useSupabaseQuery<Machine>({
    table: 'machines',
    limit: 1000,
  });
  const { data: departments } = useSupabaseQuery<Department>({
    table: 'departments',
    limit: 100,
  });

  const deptMap = React.useMemo(() => {
    const m = new Map<string, string>();
    departments?.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [departments]);

  const typeOptions = React.useMemo(() => {
    const types = new Set(machines?.map((m) => m.type) ?? []);
    return Array.from(types).map((t) => ({ label: t, value: t }));
  }, [machines]);

  const filtered = React.useMemo(() => {
    return (machines ?? []).filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      return true;
    });
  }, [machines, statusFilter, typeFilter]);

  const operationalCount = machines?.filter((m) => m.status === 'operational').length ?? 0;
  const maintenanceCount = machines?.filter((m) => m.status === 'maintenance').length ?? 0;
  const faultCount = machines?.filter((m) => m.status === 'fault').length ?? 0;
  const avgHealth = machines && machines.length > 0
    ? Math.round(machines.reduce((sum, m) => sum + (m.health_score ?? 85), 0) / machines.length)
    : 0;

  const columns: Column<Machine>[] = [
    {
      key: 'name',
      header: 'Machine',
      sortable: true,
      sortAccessor: (m) => m.name,
      cell: (m) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Cpu className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{m.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{m.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (m) => <span className="text-sm">{m.type}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      cell: (m) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {m.location}
        </span>
      ),
    },
    {
      key: 'health',
      header: 'Health %',
      sortable: true,
      sortAccessor: (m) => m.health_score ?? 0,
      cell: (m) => {
        const score = m.health_score ?? 85;
        return (
          <div className="w-28">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${getHealthColor(score)}`}>{score}%</span>
              <Heart className={`h-3 w-3 ${getHealthColor(score)}`} />
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getHealthBarColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'hours',
      header: 'Running Hours',
      sortable: true,
      sortAccessor: (m) => m.operating_hours,
      cell: (m) => (
        <span className="text-sm font-mono">{m.operating_hours.toLocaleString()}h</span>
      ),
    },
    {
      key: 'maintenance',
      header: 'Last Maintenance',
      cell: (m) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Wrench className="h-3 w-3" />
          {m.last_maintenance ? new Date(m.last_maintenance).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'next_maintenance',
      header: 'Next Maintenance',
      cell: (m) => {
        if (!m.next_maintenance) return <span className="text-sm text-muted-foreground">—</span>;
        const days = Math.ceil((new Date(m.next_maintenance).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <div className="text-sm">
            <span className="text-muted-foreground">{new Date(m.next_maintenance).toLocaleDateString()}</span>
            <span className={`ml-2 text-xs ${days <= 7 ? 'text-destructive' : days <= 30 ? 'text-warning' : 'text-muted-foreground'}`}>
              ({days <= 0 ? 'Overdue' : `${days}d`})
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (m) => <StatusBadge status={m.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Machines"
        description="Track equipment status and maintenance schedules"
        icon={<Cpu className="h-5 w-5 text-primary" />}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Machines"
          value={machines?.length ?? 0}
          icon={<Cpu className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          title="Operational"
          value={operationalCount}
          icon={<Activity className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          title="In Maintenance"
          value={maintenanceCount}
          icon={<Wrench className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          title="Avg Health Score"
          value={`${avgHealth}%`}
          icon={<Heart className="h-5 w-5" />}
          accent={avgHealth >= 80 ? 'success' : avgHealth >= 60 ? 'warning' : 'destructive'}
        />
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            searchPlaceholder="Search machines by name or code..."
            searchAccessor={(m) => `${m.name} ${m.code} ${m.type} ${m.manufacturer ?? ''}`}
            getRowId={(m) => m.id}
            emptyTitle="No machines found"
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
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={typeOptions}
                  placeholder="All Types"
                  className="w-[160px]"
                />
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
