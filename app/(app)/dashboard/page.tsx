'use client';

import * as React from 'react';
import {
  Users,
  Cpu,
  Radio,
  AlertTriangle,
  ShieldCheck,
  Activity,
  TrendingUp,
  Clock,
  FileCheck,
  Wrench,
  Bell,
  ChevronRight,
  Zap,
  Thermometer,
  Gauge,
  Battery,
  Wind,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { CardLoadingState, LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import type {
  Worker,
  Machine,
  Alert,
  Incident,
  SensorReading,
  Permit,
} from '@/types/database';

const safetyTrendData = [
  { day: 'Mon', score: 87, incidents: 3, nearMiss: 5 },
  { day: 'Tue', score: 89, incidents: 2, nearMiss: 4 },
  { day: 'Wed', score: 85, incidents: 4, nearMiss: 7 },
  { day: 'Thu', score: 91, incidents: 1, nearMiss: 3 },
  { day: 'Fri', score: 88, incidents: 3, nearMiss: 6 },
  { day: 'Sat', score: 92, incidents: 1, nearMiss: 2 },
  { day: 'Sun', score: 94, incidents: 0, nearMiss: 1 },
];

const riskTrendData = [
  { week: 'W1', risk: 72, mitigated: 68 },
  { week: 'W2', risk: 68, mitigated: 64 },
  { week: 'W3', risk: 65, mitigated: 60 },
  { week: 'W4', risk: 58, mitigated: 54 },
  { week: 'W5', risk: 55, mitigated: 50 },
  { week: 'W6', risk: 48, mitigated: 44 },
];

const machineStatusData = [
  { name: 'Operational', value: 0, fill: 'hsl(var(--success))' },
  { name: 'Maintenance', value: 0, fill: 'hsl(var(--warning))' },
  { name: 'Offline', value: 0, fill: 'hsl(var(--muted-foreground))' },
  { name: 'Fault', value: 0, fill: 'hsl(var(--destructive))' },
];

const sensorTypeIcons: Record<string, React.ReactNode> = {
  gas: <Wind className="h-4 w-4" />,
  temperature: <Thermometer className="h-4 w-4" />,
  pressure: <Gauge className="h-4 w-4" />,
  humidity: <Wind className="h-4 w-4" />,
  smoke: <Zap className="h-4 w-4" />,
  voltage: <Zap className="h-4 w-4" />,
  battery: <Battery className="h-4 w-4" />,
};

const severityColor = {
  critical: "...",
  high: "...",
  medium: "...",
  low: "...",
};

export default function DashboardPage() {
  const { data: workers, isLoading: workersLoading } = useSupabaseQuery<Worker>({
    table: 'workers',
    limit: 1000,
  });
  const { data: machines, isLoading: machinesLoading } = useSupabaseQuery<Machine>({
    table: 'machines',
    limit: 1000,
  });
  const { data: alerts, isLoading: alertsLoading } = useSupabaseQuery<Alert>({
    table: 'alerts',
    order: { column: 'created_at', ascending: false },
    limit: 8,
  });
  const { data: incidents, isLoading: incidentsLoading } = useSupabaseQuery<Incident>({
    table: 'incidents',
    order: { column: 'occurred_at', ascending: false },
    limit: 8,
  });
  const { data: sensors, isLoading: sensorsLoading } = useSupabaseQuery<SensorReading>({
    table: 'sensor_data',
    order: { column: 'recorded_at', ascending: false },
    limit: 500,
  });
  const { data: permits, isLoading: permitsLoading } = useSupabaseQuery<Permit>({
    table: 'permits',
    order: { column: 'created_at', ascending: false },
    limit: 100,
  });

  const activeWorkers = workers?.length ?? 0;
 const onlineSensors =
  sensors?.filter((s) => s.status === 'online').length ?? 0;
  const operationalMachines =
  machines?.filter((m) => m.status === 'operational').length ?? 0;
  const openIncidents =
  incidents?.filter((i) => i.status === 'open').length ?? 0;
  const activePermits =
  permits?.filter((p) => p.status === 'active').length ?? 0;
  const safetyScore = 91;

  const machineStatusCounts = React.useMemo(() => {
   const counts = {
  Operational:0,
  Maintenance:0,
  Offline:0,
  Fault:0
}


    machines?.forEach((m) => {
      counts[m.status as keyof typeof counts]++;
    });
    return [
      { name: 'Operational', value: counts.Operational, fill: 'hsl(var(--success))' },
      { name: 'Maintenance', value: counts.Maintenance, fill: 'hsl(var(--warning))' },
      { name: 'Offline', value: counts.Offline, fill: 'hsl(var(--muted-foreground))' },
      { name: 'Fault', value: counts.Fault, fill: 'hsl(var(--destructive))' },
    ];
  }, [machines]);

  const sensorHealthData = React.useMemo(() => {
    const counts = {
  online: 0,
  warning: 0,
  critical: 0,
  offline: 0,
};

sensors?.forEach((s) => {
  counts[s.status.toLowerCase() as keyof typeof counts]++;
});

return [
  { name: 'Online', value: counts.online, fill: 'hsl(var(--success))' },
  { name: 'Warning', value: counts.warning, fill: 'hsl(var(--warning))' },
  { name: 'Critical', value: counts.critical, fill: 'hsl(var(--destructive))' },
  { name: 'Offline', value: counts.offline, fill: 'hsl(var(--muted-foreground))' },
];
  }, [sensors]);

  const upcomingMaintenance = React.useMemo(() => {
    return (machines ?? [])
      .filter((m) => m.next_maintenance)
      .sort((a, b) => new Date(a.next_maintenance!).getTime() - new Date(b.next_maintenance!).getTime())
      .slice(0, 5);
  }, [machines]);

  const activityFeed = React.useMemo(() => {
    const items: { id: string; type: string; title: string; time: string; icon: string; severity?: string }[] = [];
    alerts?.forEach((a) => {
      items.push({
        id: a.id,
        type: 'alert',
        title: a.title,
        time: new Date(a.created_at).toLocaleString(),
        icon: 'alert',
        severity: a.severity,
      });
    });
    incidents?.forEach((i) => {
      items.push({
        id: i.id,
        type: 'incident',
        title: i.title,
        time: new Date(i.occurred_at).toLocaleString(),
        icon: 'incident',
        severity: i.severity,
      });
    });
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);
  }, [alerts, incidents]);

  const criticalAlerts =
  alerts?.filter(
    (a) =>
      a.severity === 'critical' ||
      a.severity === 'high'
  ) ?? [];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your facility safety operations"
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
      />

      {/* Top Stat Cards */}
      {workersLoading || machinesLoading ? (
        <CardLoadingState count={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Active Workers"
            value={activeWorkers}
            icon={<Users className="h-5 w-5" />}
            trend={5}
            trendLabel="vs last week"
            accent="primary"
          />
          <StatCard
            title="Online Sensors"
            value={onlineSensors}
            icon={<Radio className="h-5 w-5" />}
            trend={2}
            trendLabel="vs last week"
            accent="success"
          />
          <StatCard
            title="Active Machines"
            value={operationalMachines}
            icon={<Cpu className="h-5 w-5" />}
            trend={3}
            trendLabel="vs last week"
            accent="primary"
          />
          <StatCard
            title="Open Incidents"
            value={openIncidents}
            icon={<AlertTriangle className="h-5 w-5" />}
            trend={-12}
            trendLabel="vs last week"
            accent="destructive"
          />
          <StatCard
            title="Active Permits"
            value={activePermits}
            icon={<FileCheck className="h-5 w-5" />}
            trend={8}
            trendLabel="vs last week"
            accent="warning"
          />
          <StatCard
            title="Safety Score"
            value={`${safetyScore}`}
            icon={<ShieldCheck className="h-5 w-5" />}
            trend={3}
            trendLabel="vs last week"
            accent="success"
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Safety Score Radial */}
        <ChartCard
          title="Safety Score"
          description="Overall facility safety rating"
        >
          <div className="relative h-[240px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ name: 'Score', value: safetyScore, fill: 'hsl(var(--primary))' }]}
                startAngle={90}
                endAngle={90 - (safetyScore / 100) * 360}
              >
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold">{safetyScore}</p>
              <p className="text-xs text-muted-foreground">out of 100</p>
              <div className="mt-2 flex items-center gap-1 text-success text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                +3% this week
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Risk Trend */}
        <ChartCard
          title="Risk Trend"
          description="Weekly risk identification vs mitigation"
          className="lg:col-span-2"
        >
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="risk" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#riskGrad)" name="Risk Identified" />
                <Area type="monotone" dataKey="mitigated" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#mitGrad)" name="Risk Mitigated" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Incident Trend */}
        <ChartCard
          title="Incident Trend"
          description="Daily incidents and near misses (7 days)"
          className="lg:col-span-2"
        >
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safetyTrendData}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="incidents" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#incGrad)" name="Incidents" />
                <Area type="monotone" dataKey="nearMiss" stroke="hsl(var(--warning))" strokeWidth={2} fill="url(#nmGrad)" name="Near Misses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Weekly Safety Score */}
        <ChartCard
          title="Weekly Safety Score"
          description="Daily safety score trend"
        >
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safetyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} name="Safety Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 3 — Sensor Health & Machine Status */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sensor Health */}
        <ChartCard
          title="Sensor Health"
          description="Status distribution across all sensors"
        >
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sensorHealthData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sensorHealthData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Machine Status */}
        <ChartCard
          title="Machine Status"
          description="Operational status across all machines"
        >
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={machineStatusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {machineStatusCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
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
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Widgets Row — Recent Alerts, Recent Incidents, Activity Feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Alerts */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <LoadingState rows={4} />
            ) : alerts && alerts.length > 0 ? (
              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityColor[alert.severity] ?? 'bg-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          <StatusBadge status={alert.severity} />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{alert.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState icon={<AlertTriangle className="h-6 w-6 text-muted-foreground" />} title="No recent alerts" className="py-8" />
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-destructive" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incidentsLoading ? (
              <LoadingState rows={4} />
            ) : incidents && incidents.length > 0 ? (
              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{incident.title}</p>
                          <StatusBadge status={incident.severity} />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{incident.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] text-muted-foreground">{new Date(incident.occurred_at).toLocaleString()}</p>
                          <StatusBadge status={incident.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState icon={<Activity className="h-6 w-6 text-muted-foreground" />} title="No recent incidents" className="py-8" />
            )}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-4">
              {activityFeed.length === 0 ? (
                <EmptyState icon={<Activity className="h-6 w-6 text-muted-foreground" />} title="No recent activity" className="py-8" />
              ) : (
                <div className="space-y-3">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.icon === 'alert' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                        {item.icon === 'alert' ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row — Upcoming Maintenance & Critical Notifications */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming Maintenance */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-warning" />
              Upcoming Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {machinesLoading ? (
              <LoadingState rows={4} />
            ) : upcomingMaintenance.length > 0 ? (
              <div className="space-y-3">
                {upcomingMaintenance.map((m) => {
                  const days = m.next_maintenance ? Math.ceil((new Date(m.next_maintenance).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                        <Cpu className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.location}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={days <= 7 ? 'destructive' : days <= 30 ? 'secondary' : 'outline'} className="text-xs">
                          {days <= 0 ? 'Overdue' : `${days}d`}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {m.next_maintenance ? new Date(m.next_maintenance).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<Wrench className="h-6 w-6 text-muted-foreground" />} title="No upcoming maintenance" className="py-8" />
            )}
          </CardContent>
        </Card>

        {/* Critical Notifications */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-destructive" />
              Critical Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <LoadingState rows={4} />
            ) : criticalAlerts.length > 0 ? (
              <div className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 hover:bg-destructive/10 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={alert.severity} />
                        <span className="text-[10px] text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Bell className="h-6 w-6 text-muted-foreground" />} title="No critical notifications" className="py-8" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
