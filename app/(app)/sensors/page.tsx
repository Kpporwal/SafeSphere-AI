'use client';

import * as React from 'react';
import { Radio, Download, Cpu, Activity, Gauge, Thermometer, Wind, Zap, Battery, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterSelect } from '@/components/shared/filter-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import type { SensorReading, Machine } from '@/types/database';

const statusOptions = [
  { label: 'Online', value: 'online' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
  { label: 'Offline', value: 'offline' },
];

const typeOptions = [
  { label: 'Gas', value: 'gas' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Pressure', value: 'pressure' },
  { label: 'Humidity', value: 'humidity' },
  { label: 'Smoke', value: 'smoke' },
  { label: 'Voltage', value: 'voltage' },
  { label: 'Battery', value: 'battery' },
];

const sensorTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  gas: { icon: <Wind className="h-5 w-5" />, color: 'text-chart-5', label: 'Gas' },
  temperature: { icon: <Thermometer className="h-5 w-5" />, color: 'text-warning', label: 'Temperature' },
  pressure: { icon: <Gauge className="h-5 w-5" />, color: 'text-primary', label: 'Pressure' },
  humidity: { icon: <Wind className="h-5 w-5" />, color: 'text-chart-4', label: 'Humidity' },
  smoke: { icon: <Zap className="h-5 w-5" />, color: 'text-destructive', label: 'Smoke' },
  voltage: { icon: <Zap className="h-5 w-5" />, color: 'text-chart-3', label: 'Voltage' },
  battery: { icon: <Battery className="h-5 w-5" />, color: 'text-success', label: 'Battery' },
};

const statusGlow: Record<string, string> = {
  online: 'shadow-[0_0_12px_hsl(var(--success)/0.4)]',
  warning: 'shadow-[0_0_12px_hsl(var(--warning)/0.4)]',
  critical: 'shadow-[0_0_12px_hsl(var(--destructive)/0.4)]',
  offline: '',
};

export default function SensorsPage() {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const { data: sensors, isLoading } = useSupabaseQuery<SensorReading>({
    table: 'sensor_data',
    order: { column: 'recorded_at', ascending: false },
    limit: 1000,
  });
  const { data: machines } = useSupabaseQuery<Machine>({
    table: 'machines',
    limit: 1000,
  });

  const machineMap = React.useMemo(() => {
    const m = new Map<string, string>();
    machines?.forEach((mac) => m.set(mac.id, mac.name));
    return m;
  }, [machines]);

  const filtered = React.useMemo(() => {
    return (sensors ?? []).filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.sensor_type !== typeFilter) return false;
      return true;
    });
  }, [sensors, statusFilter, typeFilter]);

  const onlineCount = sensors?.filter((s) => s.status === 'online').length ?? 0;
  const warningCount = sensors?.filter((s) => s.status === 'warning').length ?? 0;
  const criticalCount = sensors?.filter((s) => s.status === 'critical').length ?? 0;
  const offlineCount = sensors?.filter((s) => s.status === 'offline').length ?? 0;

  // Get latest reading per sensor for cards
  const sensorCards = React.useMemo(() => {
    const seen = new Set<string>();
    const result: SensorReading[] = [];
    (sensors ?? []).forEach((s) => {
      if (!seen.has(s.sensor_id)) {
        seen.add(s.sensor_id);
        result.push(s);
      }
    });
    return result.slice(0, 8);
  }, [sensors]);

  const columns: Column<SensorReading>[] = [
    {
      key: 'sensor_id',
      header: 'Sensor ID',
      sortable: true,
      sortAccessor: (s) => s.sensor_id,
      cell: (s) => (
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium font-mono">{s.sensor_id}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (s) => {
        const config = sensorTypeConfig[s.sensor_type] ?? sensorTypeConfig.temperature;
        return (
          <Badge variant="outline" className={`text-xs ${config.color}`}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
        );
      },
    },
    {
      key: 'machine',
      header: 'Machine',
      cell: (s) => (
        <span className="text-sm text-muted-foreground">
          {s.machine_id ? (machineMap.get(s.machine_id) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'reading',
      header: 'Reading',
      sortable: true,
      sortAccessor: (s) => Number(s.reading_value),
      cell: (s) => (
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium font-mono">
            {Number(s.reading_value).toFixed(2)} {s.unit}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <div className="flex items-center gap-2">
          {s.status === 'online' && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
          )}
          {s.status === 'warning' && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
            </span>
          )}
          {s.status === 'critical' && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
          )}
          {s.status === 'offline' && <span className="h-2 w-2 rounded-full bg-muted-foreground" />}
          <StatusBadge status={s.status} />
        </div>
      ),
    },
    {
      key: 'recorded_at',
      header: 'Recorded At',
      sortable: true,
      sortAccessor: (s) => s.recorded_at,
      cell: (s) => (
        <span className="text-sm text-muted-foreground">
          {new Date(s.recorded_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sensors"
        description="Real-time sensor monitoring and readings"
        icon={<Radio className="h-5 w-5 text-primary" />}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Online Sensors"
          value={onlineCount}
          icon={<Activity className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          title="Warning"
          value={warningCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          title="Critical"
          value={criticalCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="destructive"
        />
        <StatCard
          title="Offline"
          value={offlineCount}
          icon={<Cpu className="h-5 w-5" />}
          accent="primary"
        />
      </div>

      {/* Sensor Cards */}
      {!isLoading && sensorCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sensorCards.map((sensor) => {
            const config = sensorTypeConfig[sensor.sensor_type] ?? sensorTypeConfig.temperature;
            const statusColor = sensor.status === 'online' ? 'text-success' : sensor.status === 'warning' ? 'text-warning' : sensor.status === 'critical' ? 'text-destructive' : 'text-muted-foreground';
            return (
              <Card key={sensor.id} className={`glass-panel border-border/50 hover:border-border transition-all ${statusGlow[sensor.status] ?? ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 border border-border/50 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {sensor.status === 'online' && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                        </span>
                      )}
                      {sensor.status === 'warning' && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
                        </span>
                      )}
                      {sensor.status === 'critical' && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                        </span>
                      )}
                      {sensor.status === 'offline' && <span className="h-2 w-2 rounded-full bg-muted-foreground" />}
                      <span className={`text-xs font-medium ${statusColor}`}>{sensor.status}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">{sensor.sensor_id}</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {Number(sensor.reading_value).toFixed(1)}
                    <span className="text-sm text-muted-foreground ml-1">{sensor.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            searchPlaceholder="Search sensors by ID..."
            searchAccessor={(s) => s.sensor_id}
            getRowId={(s) => s.id}
            emptyTitle="No sensors found"
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
                  className="w-[140px]"
                />
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
