'use client';

import * as React from 'react';
import {
  Cpu,
  Activity,
  Download,
  Radio,
  Battery,
  AlertTriangle,
  Gauge,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterSelect } from '@/components/shared/filter-select';
import { EmptyState } from '@/components/shared/empty-state';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Sheet } from '@/components/ui/sheet';

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

import { Input } from '@/components/ui/input';

import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

import type { Machine, Sensor, SensorStatus, SensorTypeExtended } from '@/types/database';

import AddSensorDialog from '@/components/sensors/AddSensorDialog';
import SensorDetailsDrawer from '@/components/sensors/SensorDetailsDrawer';
import { Clock, RefreshCw } from 'lucide-react';

const statusOptions: Array<{ label: string; value: SensorStatus }> = [
  { label: 'Online', value: 'online' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
  { label: 'Offline', value: 'offline' },
];

const sensorTypeOptions: Array<{ label: string; value: SensorTypeExtended }> = [
  { label: 'Gas', value: 'gas' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Humidity', value: 'humidity' },
  { label: 'Pressure', value: 'pressure' },
  { label: 'Smoke', value: 'smoke' },
  { label: 'Voltage', value: 'voltage' },
  { label: 'Battery', value: 'battery' },
  { label: 'Noise', value: 'noise' },
  { label: 'Vibration', value: 'vibration' },
  { label: 'Air Quality', value: 'air_quality' },
  { label: 'Wearable', value: 'wearable' },
];

type BatteryFilter = 'all' | 'low' | 'medium' | 'high';

function batteryLabel(v: BatteryFilter) {
  if (v === 'low') return 'Low (<20%)';
  if (v === 'medium') return 'Medium (20-50%)';
  if (v === 'high') return 'High (>50%)';
  return 'All Batteries';
}

function batteryBucket(percent: number) {
  if (percent < 20) return 'low';
  if (percent < 50) return 'medium';
  return 'high';
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function SensorsPage() {
  const [statusFilter, setStatusFilter] = React.useState<'all' | SensorStatus>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | SensorTypeExtended>('all');
  const [batteryFilter, setBatteryFilter] = React.useState<BatteryFilter>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedSensor, setSelectedSensor] = React.useState<Sensor | null>(null);
  const [sensorActionLoading, setSensorActionLoading] = React.useState<string | null>(null);

  const [openAddSensor, setOpenAddSensor] = React.useState(false);
  const [openEditSensor, setOpenEditSensor] = React.useState(false);

  const supabase = React.useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: machines } = useSupabaseQuery<Machine>({ table: 'machines', limit: 1000 });

  const { data: sensors, isLoading } = useSupabaseQuery<Sensor>({
    table: 'sensors',
    limit: 1000,
    order: { column: 'last_updated', ascending: false },
    queryKey: ['sensors', 'list'],
  });

  // Fetch latest readings for live table columns (optional/robust):
  // In this app architecture we show sensors master row fields, but ensure last_reading is fresh enough.
  const { data: readings } = useSupabaseQuery<any>({
    table: 'sensor_data',
    limit: 2000,
    order: { column: 'recorded_at', ascending: false },
    queryKey: ['sensor_data', 'latest'],
  });

  const latestBySensorId = React.useMemo(() => {
    const m = new Map<string, { last_reading: number; unit?: string; recorded_at?: string; status?: SensorStatus }>();
    (readings ?? []).forEach((r) => {
      const sid = r.sensor_id as string;
      if (!m.has(sid)) {
        m.set(sid, {
          last_reading: Number(r.reading_value),
          unit: r.unit as string,
          recorded_at: r.recorded_at as string,
          status: r.status as SensorStatus,
        });
      }
    });
    return m;
  }, [readings]);

  const machineMap = React.useMemo(() => {
    const map = new Map<string, Machine>();
    (machines ?? []).forEach((m) => map.set(m.id, m));
    return map;
  }, [machines]);

  const filteredSensors = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (sensors ?? []).filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && (s.sensor_type as SensorTypeExtended) !== typeFilter) return false;
      if (batteryFilter !== 'all') {
        const bucket = batteryBucket(Number(s.battery_percent));
        if (bucket !== batteryFilter) return false;
      }
      if (q) {
        const hay = `${s.sensor_name} ${s.sensor_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sensors, statusFilter, typeFilter, batteryFilter, searchTerm]);

  // Statistics cards (update with current filtered set, like Workers/Machines)
  const totalSensors = filteredSensors.length;
  const activeSensors = filteredSensors.filter((s) => s.status === 'online').length;
  const offlineSensors = filteredSensors.filter((s) => s.status === 'offline').length;
  const lowBatterySensors = filteredSensors.filter((s) => Number(s.battery_percent) < 20).length;

  const sensorRows = React.useMemo(() => {
    // Merge latest reading info into sensor rows (without changing stored sensor master data)
    return filteredSensors.map((s) => {
      const latest = latestBySensorId.get(s.sensor_id);
      if (!latest) return s;
      const merged: Sensor = {
        ...s,
        last_reading: latest.last_reading ?? s.last_reading,
        last_updated: latest.recorded_at ? new Date(latest.recorded_at).toISOString() : s.last_updated,
        status: latest.status ?? s.status,
      };
      return merged;
    });
  }, [filteredSensors, latestBySensorId]);

  const columns: Column<Sensor>[] = [
    {
      key: 'sensor_name',
      header: 'Sensor',
      sortable: true,
      sortAccessor: (s) => s.sensor_name,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Cpu className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{s.sensor_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{s.sensor_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'sensor_type',
      header: 'Type',
      cell: (s) => <span className="text-sm">{s.sensor_type}</span>,
    },
    {
      key: 'assigned_machine_id',
      header: 'Machine',
      cell: (s) => (
        <span className="text-sm text-muted-foreground">{s.assigned_machine_id ? machineMap.get(s.assigned_machine_id)?.name ?? '—' : '—'}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (s) => <span className="text-sm text-muted-foreground">{s.location}</span>,
    },
    {
      key: 'battery_percent',
      header: 'Battery %',
      sortable: true,
      sortAccessor: (s) => s.battery_percent,
      cell: (s) => {
        const batt = Number(s.battery_percent);
        const tone = batt < 20 ? 'text-destructive' : batt < 50 ? 'text-warning' : 'text-success';
        return (
          <div className="flex items-center gap-2">
            <Battery className={`h-4 w-4 ${tone}`} />
            <span className={`text-sm font-mono ${tone}`}>{batt}%</span>
          </div>
        );
      },
    },
    {
      key: 'last_reading',
      header: 'Last Reading',
      sortable: true,
      sortAccessor: (s) => s.last_reading ?? 0,
      cell: (s) => (
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono">{s.last_reading ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'last_updated',
      header: 'Last Updated',
      sortable: true,
      sortAccessor: (s) => s.last_updated ?? '',
      cell: (s) => (
        <span className="text-sm text-muted-foreground">{s.last_updated ? new Date(s.last_updated).toLocaleString() : '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (s) => (
        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Edit sensor"
            disabled={sensorActionLoading !== null}
            onClick={() => {
              setSelectedSensor(s);
              setOpenEditSensor(true);
            }}
          >
            <span className="text-xs">✎</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Delete sensor"
                disabled={sensorActionLoading !== null}
              >
                <span className="text-xs">🗑</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete sensor?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {s.sensor_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogCancel disabled={sensorActionLoading === `delete-${s.id}`}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={sensorActionLoading === `delete-${s.id}` || sensorActionLoading !== null}
                onClick={async (e) => {
                  e.preventDefault();
                  const actionKey = `delete-${s.id}`;
                  setSensorActionLoading(actionKey);
                  try {
                    const { error } = await supabase.from('sensors').delete().eq('id', s.id);
                    if (error) throw error;

                    toast({ title: 'Sensor deleted', description: s.sensor_name });
                    setDrawerOpen(false);
                    setSelectedSensor(null);
                    queryClient.invalidateQueries({ queryKey: ['sensors'] });
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to delete sensor.';
                    toast({ variant: 'destructive', title: 'Could not delete sensor', description: message });
                  } finally {
                    setSensorActionLoading(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const handleExport = React.useCallback(() => {
    try {
      const rows = sensorRows;
      const headers = [
        'sensor_id',
        'sensor_name',
        'sensor_type',
        'location',
        'assigned_machine_id',
        'status',
        'battery_percent',
        'last_reading',
        'installation_date',
        'last_updated',
      ];

      const csv = [
        headers.join(','),
        ...rows.map((s) =>
          [
            s.sensor_id,
            s.sensor_name,
            s.sensor_type,
            s.location,
            s.assigned_machine_id ?? '',
            s.status,
            s.battery_percent,
            s.last_reading ?? '',
            s.installation_date,
            s.last_updated ?? '',
          ]
            .map(csvEscape)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sensors-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'Export started', description: 'Sensors CSV downloaded.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export CSV.';
      toast({ variant: 'destructive', title: 'Export failed', description: message });
    }
  }, [sensorRows, toast]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sensors"
        description="Manage sensors, live readings, and device health"
        icon={<Radio className="h-5 w-5 text-primary" />}
        actions={
          <>
            <Button variant="outline" size="sm" disabled={isLoading} onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setOpenAddSensor(true);
                setOpenEditSensor(false);
              }}
              disabled={isLoading}
            >
              <span className="mr-2">＋</span>
              Add Sensor
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sensors" value={totalSensors} icon={<Cpu className="h-5 w-5" />} accent="primary" />
        <StatCard title="Active Sensors" value={activeSensors} icon={<Activity className="h-5 w-5" />} accent="success" />
        <StatCard title="Offline Sensors" value={offlineSensors} icon={<AlertTriangle className="h-5 w-5" />} accent="destructive" />
        <StatCard title="Low Battery Sensors" value={lowBatterySensors} icon={<Battery className="h-5 w-5" />} accent="warning" />
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as any)}
                options={statusOptions as any}
                placeholder="All Statuses"
                className="w-[130px]"
              />

              <FilterSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as any)}
                options={sensorTypeOptions as any}
                placeholder="All Types"
                className="w-[160px]"
              />

              <FilterSelect
                value={batteryFilter}
                onChange={(v) => setBatteryFilter(v as BatteryFilter)}
                options={[
                  { label: batteryLabel('all'), value: 'all' },
                  { label: batteryLabel('low'), value: 'low' },
                  { label: batteryLabel('medium'), value: 'medium' },
                  { label: batteryLabel('high'), value: 'high' },
                ]}
                placeholder="Battery Level"
                className="w-[170px]"
              />
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Input
                placeholder="Search by sensor name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-muted/30"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={sensorRows}
            loading={isLoading}
            searchPlaceholder=""
            getRowId={(s) => s.id}
            emptyTitle="No sensors found"
            emptyDescription="Try adjusting filters or search." 
            onRowClick={(s) => {
              setSelectedSensor(s);
              setDrawerOpen(true);
            }}
            toolbar={
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['sensors'] });
                    queryClient.invalidateQueries({ queryKey: ['sensor_data'] });
                    toast({ title: 'Refreshing', description: 'Updating sensor list...' });
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>

      <SensorDetailsDrawer
        open={drawerOpen}
        onOpenChange={(next) => {
          setDrawerOpen(next);
          if (!next) setSelectedSensor(null);
        }}
        sensor={
          selectedSensor
            ? {
                ...selectedSensor,
                assigned_machine_id: selectedSensor.assigned_machine_id,
              }
            : null
        }
        machines={machines}
        onEdit={() => {
          if (!selectedSensor) return;
          setDrawerOpen(false);
          setOpenEditSensor(true);
        }}
        onViewHistory={() => {
          toast({ title: 'Sensor history', description: 'History view is not implemented in this module yet.' });
        }}
      />

      <AddSensorDialog
        open={openAddSensor}
        onOpenChange={(next) => setOpenAddSensor(next)}
        mode="add"
        initialSensor={null}
      />

      <AddSensorDialog
        open={openEditSensor}
        onOpenChange={(next) => {
          setOpenEditSensor(next);
          if (!next) {
            setSelectedSensor(null);
          }
        }}
        mode="edit"
        initialSensor={selectedSensor}
        onSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ['sensors'] });
          queryClient.invalidateQueries({ queryKey: ['sensor_data'] });
          setOpenEditSensor(false);
        }}
      />
    </div>
  );
}

