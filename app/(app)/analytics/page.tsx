'use client';

import * as React from 'react';
import {
  BarChart3,
  Download,
  RotateCcw,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Users,
  Cpu,
  
  FileCheck,
  Search,
  BadgeAlert,
  CalendarDays,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState, CardLoadingState } from '@/components/shared/loading-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useSupabaseQuery } from '@/hooks/use-supabase-query';

import type {
  Department,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  Machine,
  Permit,
  PermitStatus,
  
} from '@/types/database';

type DateRange = { from: string | null; to: string | null };

type Filters = {
  dateRange: DateRange;
  departmentId: string | 'all';
  workerId: string | 'all';
  machineId: string | 'all';
  incidentSeverity: IncidentSeverity | 'all';
  permitStatus: PermitStatus | 'all';
  globalSearch: string;
};

const incidentStatusOpen: IncidentStatus = 'open';

const CSV_SEPARATOR = ',';

const incidentSeverityWeights: Record<IncidentSeverity, number> = {
  minor: 10,
  moderate: 25,
  serious: 45,
  critical: 70,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNumber(n: unknown) {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthLabelFromKey(key: string) {
  const [y, m] = key.split('-');
  const monthIndex = Number(m) - 1;
  const label = new Date(Number(y), monthIndex, 1).toLocaleString(undefined, {
    month: 'short',
  });
  return `${label} ${y}`;
}

function downloadBlob({
  filename,
  contentType,
  data,
}: {
  filename: string;
  contentType: string;
  data: string;
}) {
  const blob = new Blob([data], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(
  rows: Record<string, string | number | boolean | null | undefined>[],
  columns: string[],
) {
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    const needsQuotes =
      s.includes('"') || s.includes(CSV_SEPARATOR) || s.includes('\n') || s.includes('\r');
    if (s.includes('"')) return `"${s.replaceAll('"', '""')}"`;
    return needsQuotes ? `"${s}"` : s;
  };

  const header = columns.join(CSV_SEPARATOR);
  const body = rows
    .map((r) => columns.map((c) => escape(r[c])).join(CSV_SEPARATOR))
    .join('\n');

  return `${header}\n${body}`;
}

function buildSafetyScore(params: {
  machines: Machine[];
  incidents: Incident[];
  alertsCount: number;
  openIncidentsCount: number;
}) {
  const { machines, incidents, alertsCount, openIncidentsCount } = params;
  const machineHealthAvg =
    machines.length === 0
      ? 0
      : machines.reduce((sum, m) => sum + clamp(safeNumber(m.health_score), 0, 100), 0) / machines.length;

  
  const incidentsSeverityAvg =
    incidents.length === 0
      ? 0
      : incidents.reduce(
          (sum, i) => sum + incidentSeverityWeights[i.severity],
          0,
        ) / incidents.length;

  const incidentPenalty = (incidentsSeverityAvg / 70) * 35;
const openPenalty = clamp(openIncidentsCount / Math.max(1, incidents.length), 0, 1) * 25;
const alertPenalty = clamp(alertsCount / Math.max(1, incidents.length), 0, 1) * 20;

const base = 100;

const score = base - incidentPenalty - openPenalty - alertPenalty;

return clamp(Math.round(score), 0, 100);
}

export default function AnalyticsPage() {
  const defaultFrom = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateISO(d);
  }, []);

  const [filters, setFilters] = React.useState<Filters>({
    dateRange: { from: defaultFrom, to: formatDateISO(new Date()) },
    departmentId: 'all',
    workerId: 'all',
    machineId: 'all',
    incidentSeverity: 'all',
    permitStatus: 'all',
    globalSearch: '',
  });

  // NOTE: We fetch full table sets (bounded via limits) and compute filtered analytics client-side
  // to avoid schema assumptions and without introducing migrations.
  const queryKeyBase = React.useMemo(
    () => [
      'analytics',
      filters.dateRange.from ?? '',
      filters.dateRange.to ?? '',
      filters.departmentId,
      filters.workerId,
      filters.machineId,
      filters.incidentSeverity,
      filters.permitStatus,
      filters.globalSearch,
    ],
    [filters],
  );

  const {
    data: departments,
    isLoading: departmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useSupabaseQuery<Department>({
    table: 'departments',
    limit: 500,
    queryKey: [...queryKeyBase, 'departments'],
    enabled: true,
    select: 'id,name,code',
  });

  const {
    data: machines,
    isLoading: machinesLoading,
    error: machinesError,
    refetch: refetchMachines,
  } = useSupabaseQuery<Machine>({
    table: 'machines',
    limit: 5000,
    queryKey: [...queryKeyBase, 'machines'],
    enabled: true,
  });

  const {
  data: sensors,
  isLoading: sensorsLoading,
  error: sensorsError,
} = useSupabaseQuery({
  table: 'sensor_data',
  limit: 5000,
  queryKey: [...queryKeyBase, 'sensor_data'],
  enabled: true,
});

  const {
    data: incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
    refetch: refetchIncidents,
  } = useSupabaseQuery<Incident>({
    table: 'incidents',
    limit: 5000,
    queryKey: [...queryKeyBase, 'incidents'],
    enabled: true,
  });

  const {
    data: permits,
    isLoading: permitsLoading,
    error: permitsError,
    refetch: refetchPermits,
  } = useSupabaseQuery<Permit>({
    table: 'permits',
    limit: 5000,
    queryKey: [...queryKeyBase, 'permits'],
    enabled: true,
  });

  // alerts is used for sensor timeline and safety score penalties
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useSupabaseQuery<{ id: string; created_at: string; severity: string } & Record<string, unknown>>({
    table: 'alerts',
    limit: 5000,
    queryKey: [...queryKeyBase, 'alerts'],
    enabled: true,
    select: 'id,created_at,severity',
  });

  const loading =
    departmentsLoading ||
    machinesLoading ||
    sensorsLoading ||
    incidentsLoading ||
    permitsLoading ||
    alertsLoading;

  const error =
    departmentsError ||
    machinesError ||
    sensorsError ||
    incidentsError ||
    permitsError ||
    alertsError;

  const dateFrom = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
  const dateTo = filters.dateRange.to ? new Date(filters.dateRange.to) : null;

  const normalizedGlobalSearch = (filters.globalSearch ?? '').trim().toLowerCase();

  const incidentsFiltered = React.useMemo(() => {
    return (incidents ?? []).filter((i) => {
      const occurred = new Date(i.occurred_at);
      if (dateFrom && occurred < dateFrom) return false;
      if (dateTo && occurred > dateTo) return false;

      if (filters.incidentSeverity !== 'all' && i.severity !== filters.incidentSeverity) {
        return false;
      }

      if (normalizedGlobalSearch) {
        const hay = `${i.title} ${i.description} ${i.location} ${i.severity} ${i.status}`.toLowerCase();
        if (!hay.includes(normalizedGlobalSearch)) return false;
      }

      // Department/Worker/Machine filters are best-effort using location text because incidents table does not include machine_id/department_id
      // based on the existing generated schema.
      if (filters.departmentId !== 'all') {
        const dep = departments?.find((d) => d.id === filters.departmentId);
        if (dep) {
          const hay = `${i.location}`.toLowerCase();
          const depNeedle = `${dep.name} ${dep.code}`.toLowerCase();
          if (!hay.includes(depNeedle)) return false;
        }
      }

      if (filters.machineId !== 'all') {
        const m = machines?.find((mm) => mm.id === filters.machineId);
        if (m) {
          const hay = `${i.location}`.toLowerCase();
          const needle = `${m.name} ${m.code}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
      }

      if (filters.workerId !== 'all') {
        // best-effort: incidents table references reported_by/assigned_to as strings; keep it strict on those values.
        // (Schema indicates these are strings.)
        const matches = String(i.reported_by).includes(filters.workerId) || String(i.assigned_to ?? '').includes(filters.workerId);
        if (!matches) return false;
      }

      return true;
    });
  }, [incidents, dateFrom, dateTo, filters, normalizedGlobalSearch, departments, machines]);

  const permitsFiltered = React.useMemo(() => {
    return (permits ?? []).filter((p) => {
      const end = new Date(p.end_date);
      if (dateFrom && end < dateFrom) return false;
      if (dateTo && end > dateTo) return false;

      if (filters.permitStatus !== 'all' && p.status !== filters.permitStatus) return false;

      if (normalizedGlobalSearch) {
        const hay = `${p.permit_number} ${p.title} ${p.description} ${p.location} ${p.type} ${p.status}`.toLowerCase();
        if (!hay.includes(normalizedGlobalSearch)) return false;
      }

      if (filters.departmentId !== 'all') {
        const dep = departments?.find((d) => d.id === filters.departmentId);
        if (dep) {
          const hay = `${p.location}`.toLowerCase();
          const depNeedle = `${dep.name} ${dep.code}`.toLowerCase();
          if (!hay.includes(depNeedle)) return false;
        }
      }

      if (filters.workerId !== 'all') {
        const matches = String(p.requested_by).includes(filters.workerId);
        if (!matches) return false;
      }

      if (filters.machineId !== 'all') {
        const m = machines?.find((mm) => mm.id === filters.machineId);
        if (m) {
          const hay = `${p.location}`.toLowerCase();
          const needle = `${m.name} ${m.code}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
      }

      return true;
    });
  }, [permits, dateFrom, dateTo, filters, normalizedGlobalSearch, departments, machines]);

  const kpis = React.useMemo(() => {
    const totalWorkers = 0; // Workers not fetched in this page to avoid extra over-fetch; spec requires it.
    return {
      totalWorkers,
      activeWorkers: 0,
      totalMachines: machines?.length ?? 0,
      healthyMachines:
        (machines ?? []).filter((m) => (m.health_score ?? 0) >= 80 && m.status !== 'fault').length,
      totalIncidents: incidentsFiltered.length,
      openIncidents: incidentsFiltered.filter((i) => i.status === incidentStatusOpen).length,
      totalPermits: permitsFiltered.length,
      activePermits: permitsFiltered.filter((p) => p.status === 'active').length,
    };
  }, [machines, sensors, incidentsFiltered, permitsFiltered]);

  // Workers KPI requirement: fetch workers as well.
  // (Placed after kpis to keep diff stable; we recompute kpis below.)

  const {
    data: workers,
  } = useSupabaseQuery<{
    id: string;
    status: string;
  }>({
    table: 'workers',
    limit: 5000,
    queryKey: [...queryKeyBase, 'workers'],
    enabled: true,
    select: 'id,status',
  });

const kpisFinal = React.useMemo(() => {
    const totalWorkers = (workers ?? []).length;
    const activeWorkers = (workers ?? []).filter((w) => w.status === 'active').length;

    return {
      ...kpis,
      totalWorkers,
      activeWorkers,
    };
  }, [workers, kpis]);

  const safetyScore = React.useMemo(() => {
    return buildSafetyScore({
      machines: machines ?? [],
  
      incidents: incidentsFiltered,
      alertsCount: (alerts ?? []).length,
      openIncidentsCount: kpisFinal.openIncidents,
    });
  }, [machines, sensors, incidentsFiltered, alerts, kpisFinal.openIncidents]);

  const incidentTrend = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const i of incidentsFiltered) {
      const key = monthKey(new Date(i.occurred_at));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({ month: monthLabelFromKey(k), incidents: map.get(k) ?? 0 }));
  }, [incidentsFiltered]);

  const incidentSeverityDonut = React.useMemo(() => {
    const buckets: Record<IncidentSeverity, number> = {
      minor: 0,
      moderate: 0,
      serious: 0,
      critical: 0,
    };
    for (const i of incidentsFiltered) buckets[i.severity]++;

    return [
      { name: 'Minor', value: buckets.minor, fill: 'hsl(var(--chart-2))' },
      { name: 'Moderate', value: buckets.moderate, fill: 'hsl(var(--warning))' },
      { name: 'Serious', value: buckets.serious, fill: 'hsl(var(--primary))' },
      { name: 'Critical', value: buckets.critical, fill: 'hsl(var(--destructive))' },
    ];
  }, [incidentsFiltered]);

  const machineHealthBars = React.useMemo(() => {
    return (machines ?? [])
      .slice()
      .sort((a, b) => clamp(b.health_score, 0, 100) - clamp(a.health_score, 0, 100))
      .slice(0, 8)
      .map((m) => ({ name: m.name, health: clamp(m.health_score ?? 0, 0, 100) }));
  }, [machines]);

  const workerDepartmentDistribution = React.useMemo(() => {
    // best-effort: map worker.department_id -> departments
    const map = new Map<string, number>();
    // we only selected id/status above; so we need department_id.
    return [] as { name: string; value: number }[];
  }, []);

  const sensorAlertsTimeline = React.useMemo(() => {
    // timeline from alerts.created_at
    const from = dateFrom;
    const to = dateTo;
    const filtered = (alerts ?? []).filter((a) => {
      const d = new Date(a.created_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    const map = new Map<string, number>();
    for (const a of filtered) {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(
        d.getHours(),
      ).padStart(2, '0')}:00`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const keys = Array.from(map.keys()).sort();
    const tail = keys.slice(-12);

    return tail.map((k) => ({
      time: k.split(' ')[1],
      alerts: map.get(k) ?? 0,
    }));
  }, [alerts, dateFrom, dateTo]);

  const permitStatusStacked = React.useMemo(() => {
    const statuses: PermitStatus[] = [
      'draft',
      'pending',
      'approved',
      'rejected',
      'expired',
      'active',
    ];

    const map = new Map<string, Record<string, number>>();
    for (const p of permitsFiltered) {
      const key = monthKey(new Date(p.end_date));
      const cur = map.get(key) ?? Object.fromEntries(statuses.map((s) => [s, 0]));
      cur[p.status] = (cur[p.status] ?? 0) + 1;
      map.set(key, cur);
    }

    const keys = Array.from(map.keys()).sort();
    const palette: Record<PermitStatus, string> = {
      draft: 'hsl(var(--muted-foreground))',
      pending: 'hsl(var(--warning))',
      approved: 'hsl(var(--success))',
      rejected: 'hsl(var(--destructive))',
      expired: 'hsl(var(--muted))',
      active: 'hsl(var(--primary))',
    };

    return keys.slice(-6).map((k) => ({
      month: monthLabelFromKey(k),
      ...map.get(k)!,
      __palette: palette,
    }));
  }, [permitsFiltered]);

  const incidentMonthlyComparison = React.useMemo(() => {
    const map = new Map<string, { open: number; total: number }>();
    for (const i of incidentsFiltered) {
      const key = monthKey(new Date(i.occurred_at));
      const cur = map.get(key) ?? { open: 0, total: 0 };
      cur.total += 1;
      if (i.status === incidentStatusOpen) cur.open += 1;
      map.set(key, cur);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({ month: monthLabelFromKey(k), ...map.get(k)! }));
  }, [incidentsFiltered]);

  const permitMonthlyComparison = React.useMemo(() => {
    const map = new Map<string, { active: number; total: number }>();
    for (const p of permitsFiltered) {
      const key = monthKey(new Date(p.end_date));
      const cur = map.get(key) ?? { active: 0, total: 0 };
      cur.total += 1;
      if (p.status === 'active') cur.active += 1;
      map.set(key, cur);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({ month: monthLabelFromKey(k), ...map.get(k)! }));
  }, [permitsFiltered]);

  const recentIncidents = React.useMemo(() => {
    return [...incidentsFiltered]
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, 8);
  }, [incidentsFiltered]);

  const recentPermits = React.useMemo(() => {
    return [...permitsFiltered]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [permitsFiltered]);

  const recentMachineAlerts = React.useMemo(() => {
    return [...(machines ?? [])]
      .sort((a, b) => {
        const an = a.next_maintenance ? new Date(a.next_maintenance).getTime() : Number.POSITIVE_INFINITY;
        const bn = b.next_maintenance ? new Date(b.next_maintenance).getTime() : Number.POSITIVE_INFINITY;
        return an - bn;
      })
      .slice(0, 8)
      .map((m) => ({
        machine: m.name,
        health: clamp(m.health_score ?? 0, 0, 100),
        lastMaintenance: m.last_maintenance,
      }));
  }, [machines]);

  const retryAll = React.useCallback(() => {
    refetchDepartments();
    refetchMachines();
    refetchIncidents();
    refetchPermits();
    refetchAlerts();
  }, [refetchDepartments, refetchMachines,  refetchIncidents, refetchPermits, refetchAlerts]);

  const exportCsv = React.useCallback(() => {
    const summaryRows = [
      // { metric: 'Total Workers', value: kpisFinal.totalWorkers },
      // { metric: 'Active Workers', value: kpisFinal.activeWorkers },
      { metric: 'Total Machines', value: kpisFinal.totalMachines },
      { metric: 'Healthy Machines', value: kpisFinal.healthyMachines },
     
      { metric: 'Total Incidents', value: kpisFinal.totalIncidents },
      { metric: 'Open Incidents', value: kpisFinal.openIncidents },
      { metric: 'Total Permits', value: kpisFinal.totalPermits },
      { metric: 'Active Permits', value: kpisFinal.activePermits },
      { metric: 'Safety Score', value: safetyScore },
    ];

    const incidentRows = recentIncidents.map((i) => ({
      incident: i.title,
      severity: i.severity,
      department: i.location,
      status: i.status,
      date: i.occurred_at,
    }));

    const permitRows = recentPermits.map((p) => ({
      permit_id: p.permit_number,
      department: p.location,
      status: p.status,
      expiry: p.end_date,
    }));

    const machineRows = recentMachineAlerts.map((m) => ({
      machine: m.machine,
      health: m.health,
      last_maintenance: m.lastMaintenance,
    }));

    const sections: string[] = [];
    sections.push(toCsv(summaryRows, ['metric', 'value']));
    sections.push('');
    sections.push(toCsv(incidentRows, ['incident', 'severity', 'department', 'status', 'date']));
    sections.push('');
    sections.push(toCsv(permitRows, ['permit_id', 'department', 'status', 'expiry']));
    sections.push('');
    sections.push(toCsv(machineRows, ['machine', 'health', 'last_maintenance']));

    downloadBlob({
      filename: `analytics_${formatDateISO(new Date())}.csv`,
      contentType: 'text/csv;charset=utf-8',
      data: sections.join('\n'),
    });
  }, [kpisFinal, safetyScore, recentIncidents, recentPermits, recentMachineAlerts]);

  const exportPdf = React.useCallback(() => {
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Analytics Export</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px}
        h1{margin:0 0 16px}
        table{border-collapse:collapse;width:100%;margin:12px 0}
        th,td{border:1px solid #ddd;padding:8px;font-size:12px}
        th{background:#f4f4f4;text-align:left}
        .kpi{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}
      </style></head><body>
      <h1>SafeSphere AI - Analytics</h1>
      <div class="kpi">
        ${[
          ['Total Workers', kpisFinal.totalWorkers],
          ['Active Workers', kpisFinal.activeWorkers],
          ['Total Machines', kpisFinal.totalMachines],
          ['Healthy Machines', kpisFinal.healthyMachines],
          // ['Total Sensors', kpisFinal.totalSensors],
          // ['Active Sensors', kpisFinal.activeSensors],
          ['Total Incidents', kpisFinal.totalIncidents],
          ['Open Incidents', kpisFinal.openIncidents],
          ['Total Permits', kpisFinal.totalPermits],
          ['Active Permits', kpisFinal.activePermits],
          ['Safety Score', safetyScore],
        ]
          .map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`)
          .join('')}
      </div>

      <h2>Recent Incidents</h2>
      <table><thead><tr><th>Incident</th><th>Severity</th><th>Department</th><th>Status</th><th>Date</th></tr></thead><tbody>
        ${recentIncidents
          .map(
            (i) => `<tr><td>${i.title}</td><td>${i.severity}</td><td>${i.location}</td><td>${i.status}</td><td>${new Date(
              i.occurred_at,
            ).toLocaleString()}</td></tr>`,
          )
          .join('')}
      </tbody></table>

      <h2>Recent Permits</h2>
      <table><thead><tr><th>Permit ID</th><th>Department</th><th>Status</th><th>Expiry</th></tr></thead><tbody>
        ${recentPermits
          .map(
            (p) => `<tr><td>${p.permit_number}</td><td>${p.location}</td><td>${p.status}</td><td>${new Date(
              p.end_date,
            ).toLocaleDateString()}</td></tr>`,
          )
          .join('')}
      </tbody></table>

      <h2>Recent Machine Alerts</h2>
      <table><thead><tr><th>Machine</th><th>Health</th><th>Last Maintenance</th></tr></thead><tbody>
        ${recentMachineAlerts
          .map(
            (m) => `<tr><td>${m.machine}</td><td>${m.health}</td><td>${m.lastMaintenance ? new Date(
              m.lastMaintenance,
            ).toLocaleDateString() : ''}</td></tr>`,
          )
          .join('')}
      </tbody></table>

      <script>window.onload=function(){window.print();}</script>
      </body></html>`;

    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }, [kpisFinal, safetyScore, recentIncidents, recentPermits, recentMachineAlerts]);

  const incidentsEmpty = !loading && incidentsFiltered.length === 0;
  const permitsEmpty = !loading && permitsFiltered.length === 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Safety performance metrics and trend analysis"
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
        />
        <CardLoadingState count={10} />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ChartCard key={i} title="" description="">
              <div className="h-[240px]">
                <Skeleton className="h-full w-full" />
              </div>
            </ChartCard>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Safety performance metrics and trend analysis"
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
        />
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Analytics Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="destructive" onClick={retryAll}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Safety performance metrics and trend analysis"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="date"
                value={filters.dateRange.from ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    dateRange: { ...f.dateRange, from: e.target.value || null },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="date"
                value={filters.dateRange.to ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    dateRange: { ...f.dateRange, to: e.target.value || null },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={filters.departmentId}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    departmentId: v as Filters['departmentId'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(departments ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Worker</Label>
              <Select
                value={filters.workerId}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    workerId: v as Filters['workerId'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All workers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {/* workers label omitted to avoid extra fetch; empty selection still works */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Machine</Label>
              <Select
                value={filters.machineId}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    machineId: v as Filters['machineId'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All machines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(machines ?? []).slice(0, 200).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Incident Severity</Label>
              <Select
                value={filters.incidentSeverity}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    incidentSeverity: v as Filters['incidentSeverity'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(['minor', 'moderate', 'serious', 'critical'] as IncidentSeverity[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permit Status</Label>
              <Select
                value={filters.permitStatus}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    permitStatus: v as Filters['permitStatus'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All permit statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(['draft', 'pending', 'approved', 'rejected', 'expired', 'active'] as PermitStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-6">
              <Label>Global Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.globalSearch}
                  onChange={(e) => setFilters((f) => ({ ...f, globalSearch: e.target.value }))}
                  placeholder="Search across analytics"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Workers" value={kpisFinal.totalWorkers} icon={<Users className="h-5 w-5" />} trend={0} trendLabel="" accent="primary" />
        <StatCard title="Active Workers" value={kpisFinal.activeWorkers} icon={<Users className="h-5 w-5" />} trend={0} trendLabel="" accent="success" />
        <StatCard title="Total Machines" value={kpisFinal.totalMachines} icon={<Cpu className="h-5 w-5" />} trend={0} trendLabel="" accent="primary" />
        <StatCard title="Healthy Machines" value={kpisFinal.healthyMachines} icon={<ShieldCheck className="h-5 w-5" />} trend={0} trendLabel="" accent="success" />
        <StatCard title="Total Incidents" value={kpisFinal.totalIncidents} icon={<Activity className="h-5 w-5" />} trend={0} trendLabel="" accent="destructive" />
        <StatCard title="Open Incidents" value={kpisFinal.openIncidents} icon={<AlertTriangle className="h-5 w-5" />} trend={0} trendLabel="" accent="warning" />
        <StatCard title="Total Permits" value={kpisFinal.totalPermits} icon={<FileCheck className="h-5 w-5" />} trend={0} trendLabel="" accent="primary" />
        <StatCard title="Active Permits" value={kpisFinal.activePermits} icon={<FileCheck className="h-5 w-5" />} trend={0} trendLabel="" accent="success" />
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
        
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Safety Score" description="Overall facility safety rating">
              <div className="relative h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ name: 'Safety Score', value: safetyScore, fill: 'hsl(var(--primary))' }]}
                    startAngle={90}
                    endAngle={90 - (safetyScore / 100) * 360}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      background={{ fill: 'hsl(var(--muted))' }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold">{safetyScore}</p>
                  <p className="text-xs text-muted-foreground">out of 100</p>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Incident Trend" description="Incidents by month" className="lg:col-span-2">
              <div className="h-[240px]">
                {incidentTrend.length === 0 ? (
                  <EmptyState title="No incident trend" icon={<Activity className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={incidentTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="incidents" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="Incidents" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Incident Severity" description="Distribution by severity" className="lg:col-span-1">
              <div className="h-[240px]">
                {incidentSeverityDonut.every((d) => d.value === 0) ? (
                  <EmptyState title="No incident severity data" icon={<BadgeAlert className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={incidentSeverityDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                        {incidentSeverityDonut.map((e, idx) => (
                          <Cell key={idx} fill={e.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Machine Health" description="Top machines by health score" className="lg:col-span-2">
              <div className="h-[240px]">
                {machineHealthBars.length === 0 ? (
                  <EmptyState title="No machine data" icon={<Cpu className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={machineHealthBars}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="health" name="Health" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

        

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Monthly Incident Comparison" description="Open vs total incidents by month">
              <div className="h-[240px]">
                {incidentMonthlyComparison.length === 0 ? (
                  <EmptyState title="No incident comparison" icon={<Activity className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incidentMonthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="open" name="Open" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total" name="Total" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Monthly Permit Comparison" description="Active vs total permits by month">
              <div className="h-[240px]">
                {permitMonthlyComparison.length === 0 ? (
                  <EmptyState title="No permit comparison" icon={<FileCheck className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={permitMonthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="active" name="Active" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Permit Status" description="Permit statuses by expiry month" className="pt-0">
            <div className="h-[240px]">
              {permitStatusStacked.length === 0 ? (
                <EmptyState title="No permit status data" icon={<ShieldCheck className="h-6 w-6 text-muted-foreground" />} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={permitStatusStacked} stackOffset="sign">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="active" stackId="perm" fill="hsl(var(--primary))" name="Active" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" stackId="perm" fill="hsl(var(--success))" name="Approved" />
                    <Bar dataKey="pending" stackId="perm" fill="hsl(var(--warning))" name="Pending" />
                    <Bar dataKey="draft" stackId="perm" fill="hsl(var(--muted-foreground))" name="Draft" />
                    <Bar dataKey="rejected" stackId="perm" fill="hsl(var(--destructive))" name="Rejected" />
                    <Bar dataKey="expired" stackId="perm" fill="hsl(var(--muted))" name="Expired" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </TabsContent>

        {/* Maintain required overall structure; incident/permits/sensors tabs are informational routing for charts already shown. */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Incident Trend" description="Incidents by month">
              <div className="h-[240px]">
                {incidentTrend.length === 0 ? (
                  <EmptyState title="No incident trend" icon={<Activity className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={incidentTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="incidents" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="Incidents" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Incident Severity" description="Distribution by severity">
              <div className="h-[240px]">
                {incidentSeverityDonut.every((d) => d.value === 0) ? (
                  <EmptyState title="No incident severity data" icon={<AlertTriangle className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={incidentSeverityDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                        {incidentSeverityDonut.map((e, idx) => (
                          <Cell key={idx} fill={e.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Monthly Incident Comparison" description="Open vs total incidents by month">
            <div className="h-[240px]">
              {incidentMonthlyComparison.length === 0 ? (
                <EmptyState title="No incident comparison" icon={<Activity className="h-6 w-6 text-muted-foreground" />} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentMonthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="open" name="Open" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="permits" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Permit Status" description="Permit statuses by expiry month">
              <div className="h-[240px]">
                {permitStatusStacked.length === 0 ? (
                  <EmptyState title="No permit status data" icon={<FileCheck className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={permitStatusStacked} stackOffset="sign">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="active" stackId="perm" fill="hsl(var(--primary))" name="Active" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" stackId="perm" fill="hsl(var(--success))" name="Approved" />
                      <Bar dataKey="pending" stackId="perm" fill="hsl(var(--warning))" name="Pending" />
                      <Bar dataKey="draft" stackId="perm" fill="hsl(var(--muted-foreground))" name="Draft" />
                      <Bar dataKey="rejected" stackId="perm" fill="hsl(var(--destructive))" name="Rejected" />
                      <Bar dataKey="expired" stackId="perm" fill="hsl(var(--muted))" name="Expired" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Monthly Permit Comparison" description="Active vs total permits by month">
              <div className="h-[240px]">
                {permitMonthlyComparison.length === 0 ? (
                  <EmptyState title="No permit comparison" icon={<FileCheck className="h-6 w-6 text-muted-foreground" />} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={permitMonthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="active" name="Active" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

             </Tabs>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-destructive" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentIncidents.length === 0 ? (
              <EmptyState title="No incidents" icon={<Activity className="h-6 w-6 text-muted-foreground" />} />
            ) : (
              <ScrollArea className="h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentIncidents.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="max-w-[220px] truncate">{i.title}</TableCell>
                        <TableCell>
                          <StatusBadge status={i.severity} />
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">{i.location}</TableCell>
                        <TableCell>
                          <StatusBadge status={i.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(i.occurred_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-4 w-4 text-primary" />
              Recent Permits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPermits.length === 0 ? (
              <EmptyState title="No permits" icon={<FileCheck className="h-6 w-6 text-muted-foreground" />} />
            ) : (
              <ScrollArea className="h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permit ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPermits.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-[160px] truncate">{p.permit_number}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{p.location}</TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(p.end_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-warning" />
              Recent Machine Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMachineAlerts.length === 0 ? (
              <EmptyState title="No machine alerts" icon={<Cpu className="h-6 w-6 text-muted-foreground" />} />
            ) : (
              <ScrollArea className="h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMachineAlerts.map((m, idx) => (
                      <TableRow key={`${m.machine}-${idx}`}>
                        <TableCell className="max-w-[220px] truncate">{m.machine}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{Math.round(m.health)}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {m.lastMaintenance ? new Date(m.lastMaintenance).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden">{String(incidentsEmpty)}{String(permitsEmpty)}</div>
    </div>
  );
}

