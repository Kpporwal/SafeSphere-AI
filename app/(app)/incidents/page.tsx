'use client';

import * as React from 'react';
import { AlertTriangle, Plus, Download, MapPin, Clock, User, Camera, FileText, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterSelect } from '@/components/shared/filter-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import AddIncidentDialog from '@/components/incidents/AddIncidentDialog';
import IncidentDetailsDrawer from '@/components/incidents/IncidentDetailsDrawer';


import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import type { Incident, Profile } from '@/types/database';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Investigating', value: 'investigating' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const severityOptions = [
  { label: 'Minor', value: 'minor' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Serious', value: 'serious' },
  { label: 'Critical', value: 'critical' },
];

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [severityFilter, setSeverityFilter] = React.useState('all');
  const [selectedIncident, setSelectedIncident] = React.useState<Incident | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const [addOpen, setAddOpen] = React.useState(false);


  const { data: incidents, isLoading } = useSupabaseQuery<Incident>({
    table: 'incidents',
    order: { column: 'occurred_at', ascending: false },
    limit: 1000,
  });
  const { data: profiles } = useSupabaseQuery<Profile>({
    table: 'profiles',
    limit: 100,
  });

  const profileMap = React.useMemo(() => {
    const m = new Map<string, string>();
    profiles?.forEach((p) => m.set(p.id, p.full_name));
    return m;
  }, [profiles]);

  const filtered = React.useMemo(() => {
    return (incidents ?? []).filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, statusFilter, severityFilter]);

  const openCount = incidents?.filter((i) => i.status === 'open').length ?? 0;
  const investigatingCount = incidents?.filter((i) => i.status === 'investigating').length ?? 0;
  const resolvedCount = incidents?.filter((i) => i.status === 'resolved').length ?? 0;
  const criticalCount = incidents?.filter((i) => i.severity === 'critical').length ?? 0;

  const handleRowClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDrawerOpen(true);
  };

  const columns: Column<Incident>[] = [
    {
      key: 'incident_number',
      header: 'Incident #',
      sortable: true,
      sortAccessor: (i) => i.incident_number,
      cell: (i) => (
        <span className="text-sm font-medium font-mono">{i.incident_number}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      cell: (i) => (
        <div>
          <p className="text-sm font-medium">{i.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{i.description}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (i) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {i.location}
        </span>
      ),
    },
    {
      key: 'assigned',
      header: 'Assigned Officer',
      cell: (i) => (
        <span className="text-sm text-muted-foreground">
          {i.assigned_to ? (profileMap.get(i.assigned_to) ?? 'Unknown') : 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'occurred_at',
      header: 'Occurred',
      sortable: true,
      sortAccessor: (i) => i.occurred_at,
      cell: (i) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(i.occurred_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'injuries',
      header: 'Injuries',
      sortable: true,
      sortAccessor: (i) => i.injuries,
      cell: (i) => (
        <span className={`text-sm font-medium ${i.injuries > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {i.injuries}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (i) => <StatusBadge status={i.severity} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (i) => <StatusBadge status={i.status} />,
    },
  ];

  // Build timeline for selected incident
  const timeline = React.useMemo(() => {
    if (!selectedIncident) return [];
    const events: { time: string; title: string; description: string; icon: React.ReactNode; color: string }[] = [];
    events.push({
      time: new Date(selectedIncident.occurred_at).toLocaleString(),
      title: 'Incident Reported',
      description: selectedIncident.description,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-destructive/10 text-destructive',
    });
    if (selectedIncident.status !== 'open') {
      events.push({
        time: 'Investigation started',
        title: 'Investigation Opened',
        description: 'Assigned officer began investigating the incident',
        icon: <Activity className="h-4 w-4" />,
        color: 'bg-warning/10 text-warning',
      });
    }
    if (selectedIncident.root_cause) {
      events.push({
        time: 'Root cause identified',
        title: 'Root Cause Analysis',
        description: selectedIncident.root_cause,
        icon: <FileText className="h-4 w-4" />,
        color: 'bg-primary/10 text-primary',
      });
    }
    if (selectedIncident.corrective_actions && selectedIncident.corrective_actions.length > 0) {
      events.push({
        time: 'Corrective actions taken',
        title: 'Corrective Actions',
        description: selectedIncident.corrective_actions.join(', '),
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'bg-success/10 text-success',
      });
    }
    if (selectedIncident.resolved_at) {
      events.push({
        time: new Date(selectedIncident.resolved_at).toLocaleString(),
        title: 'Incident Resolved',
        description: 'The incident has been resolved and closed',
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'bg-success/10 text-success',
      });
    }
    return events;
  }, [selectedIncident]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Track and investigate safety incidents"
        icon={<AlertTriangle className="h-5 w-5 text-primary" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  const rows = filtered ?? [];
                  const headers = [
                    'incident_number',
                    'title',
                    'description',
                    'severity',
                    'status',
                    'category',
                    'department',
                    'worker',
                    'machine',
                    'sensor',
                    'occurred_at',
                    'reported_by',
                    'location',
                    'root_cause',
                    'corrective_action',
                    'notes',
                  ];

                  const csvEscape = (v: unknown) => {
                    const s = v === null || v === undefined ? '' : String(v);
                    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                    return s;
                  };

                  const csv = [
                    headers.join(','),
                    ...rows.map((i) => {
                      const anyI = i as any;
                      const corrective = (anyI.corrective_actions ?? [])
                        .join('|');
                      return [
                        anyI.incident_number,
                        anyI.title,
                        anyI.description,
                        anyI.severity,
                        anyI.status,
                        anyI.category ?? '',
                        anyI.department_id ?? '',
                        anyI.worker_id ?? '',
                        anyI.machine_id ?? '',
                        anyI.sensor_id ?? '',
                        anyI.occurred_at,
                        anyI.reported_by ?? '',
                        anyI.location,
                        anyI.root_cause ?? '',
                        corrective,
                        anyI.notes ?? '',
                      ]
                        .map(csvEscape)
                        .join(',');
                    }),
                  ].join('\n');

                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                } catch {
                  // keep UI unchanged; toasts live in dialog modules in this page
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedIncident(null);
                setAddOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Button>

          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Incidents"
          value={incidents?.length ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          title="Open"
          value={openCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="destructive"
        />
        <StatCard
          title="Investigating"
          value={investigatingCount}
          icon={<User className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          title="Critical"
          value={criticalCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="destructive"
        />
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            searchPlaceholder="Search incidents by number or title..."
            searchAccessor={(i) => `${i.incident_number} ${i.title}`}
            onRowClick={handleRowClick}
            getRowId={(i) => i.id}
            emptyTitle="No incidents found"
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
                  value={severityFilter}
                  onChange={setSeverityFilter}
                  options={severityOptions}
                  placeholder="All Severities"
                  className="w-[140px]"
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <IncidentDetailsDrawer
        open={drawerOpen}
        onOpenChange={(next) => {
          setDrawerOpen(next);
          if (!next) setSelectedIncident(null);
        }}
        incident={selectedIncident}
        profiles={profiles}
        onEdit={() => {
          // Edit dialog not wired yet in this page; keep behavior unchanged for now.
        }}
      />

      <AddIncidentDialog
        open={addOpen}
        onOpenChange={(next) => setAddOpen(next)}
        mode="add"
        initialIncident={null}
      />
      {/* Incident Details Drawer with Timeline */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>

        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedIncident && (
            <>
              <SheetHeader className="pb-4 border-b border-border/50">
                <SheetTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{selectedIncident.incident_number}</p>
                    <p className="text-xs text-muted-foreground">{selectedIncident.title}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="p-6 space-y-6">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedIncident.severity} />
                  <StatusBadge status={selectedIncident.status} />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
                  <p className="text-sm text-foreground leading-relaxed">{selectedIncident.description}</p>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedIncident.location}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Occurred At</p>
                    <p className="text-sm font-medium">{new Date(selectedIncident.occurred_at).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Assigned Officer</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedIncident.assigned_to ? (profileMap.get(selectedIncident.assigned_to) ?? 'Unknown') : 'Unassigned'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Reported By</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedIncident.reported_by ? (profileMap.get(selectedIncident.reported_by) ?? 'Unknown') : 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Injuries</p>
                    <p className={`text-sm font-medium ${selectedIncident.injuries > 0 ? 'text-destructive' : ''}`}>
                      {selectedIncident.injuries}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Property Damage</p>
                    <p className="text-sm font-medium">${Number(selectedIncident.property_damage).toLocaleString()}</p>
                  </div>
                </div>

                <Separator />

                {/* Photos Placeholder */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Incident Photos
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square rounded-lg border border-dashed border-border/50 bg-muted/20 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Investigation Timeline</h4>
                  <div className="space-y-4 pt-2">
                    {timeline.map((event, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${event.color}`}>
                            {event.icon}
                          </div>
                          {i < timeline.length - 1 && <div className="w-px h-full bg-border/50 mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.time}</p>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedIncident.root_cause && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Root Cause</h4>
                      <p className="text-sm">{selectedIncident.root_cause}</p>
                    </div>
                  </>
                )}

                {selectedIncident.corrective_actions && selectedIncident.corrective_actions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Corrective Actions</h4>
                      <div className="space-y-2">
                        {selectedIncident.corrective_actions.map((action, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <p className="text-sm">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">Update Status</Button>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Report
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
