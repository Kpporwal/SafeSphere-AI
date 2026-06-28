'use client';

import * as React from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { ChartCard } from '@/components/shared/chart-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const monthlyIncidentData = [
  { month: 'Jan', incidents: 12, nearMiss: 8, injuries: 3 },
  { month: 'Feb', incidents: 10, nearMiss: 6, injuries: 2 },
  { month: 'Mar', incidents: 15, nearMiss: 10, injuries: 4 },
  { month: 'Apr', incidents: 8, nearMiss: 5, injuries: 1 },
  { month: 'May', incidents: 11, nearMiss: 7, injuries: 2 },
  { month: 'Jun', incidents: 7, nearMiss: 4, injuries: 1 },
  { month: 'Jul', incidents: 9, nearMiss: 6, injuries: 2 },
  { month: 'Aug', incidents: 6, nearMiss: 3, injuries: 0 },
  { month: 'Sep', incidents: 8, nearMiss: 5, injuries: 1 },
  { month: 'Oct', incidents: 5, nearMiss: 3, injuries: 0 },
  { month: 'Nov', incidents: 7, nearMiss: 4, injuries: 1 },
  { month: 'Dec', incidents: 4, nearMiss: 2, injuries: 0 },
];

const departmentRiskData = [
  { department: 'Operations', risk: 72, incidents: 28 },
  { department: 'Maintenance', risk: 65, incidents: 22 },
  { department: 'Production', risk: 58, incidents: 18 },
  { department: 'Logistics', risk: 45, incidents: 12 },
  { department: 'Engineering', risk: 38, incidents: 8 },
  { department: 'Quality', risk: 30, incidents: 5 },
];

const permitTypeData = [
  { name: 'Hot Work', value: 12, color: 'hsl(var(--destructive))' },
  { name: 'Electrical', value: 9, color: 'hsl(var(--warning))' },
  { name: 'Height Work', value: 8, color: 'hsl(var(--primary))' },
  { name: 'Confined Space', value: 7, color: 'hsl(var(--chart-4))' },
  { name: 'Chemical', value: 6, color: 'hsl(var(--chart-5))' },
  { name: 'Lifting', value: 5, color: 'hsl(var(--success))' },
  { name: 'Excavation', value: 3, color: 'hsl(var(--muted-foreground))' },
];

const sensorTrendData = [
  { time: '00:00', gas: 15, temp: 22, pressure: 2.1 },
  { time: '04:00', gas: 18, temp: 24, pressure: 2.3 },
  { time: '08:00', gas: 25, temp: 28, pressure: 2.8 },
  { time: '12:00', gas: 35, temp: 32, pressure: 3.2 },
  { time: '16:00', gas: 42, temp: 35, pressure: 3.5 },
  { time: '20:00', gas: 30, temp: 30, pressure: 2.9 },
  { time: '23:59', gas: 20, temp: 25, pressure: 2.4 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Safety performance metrics and trend analysis"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Incidents (YTD)"
          value={102}
          icon={<TrendingDown className="h-5 w-5" />}
          trend={-15}
          trendLabel="vs last year"
          accent="success"
        />
        <StatCard
          title="Near Misses"
          value={67}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={8}
          trendLabel="vs last year"
          accent="warning"
        />
        <StatCard
          title="Avg Response Time"
          value="4.2m"
          icon={<TrendingDown className="h-5 w-5" />}
          trend={-22}
          trendLabel="vs last month"
          accent="success"
        />
        <StatCard
          title="Compliance Rate"
          value="94.8%"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={3}
          trendLabel="vs last quarter"
          accent="primary"
        />
      </div>

      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <ChartCard
            title="Incident Trends"
            description="Monthly incidents, near misses, and injuries over the past year"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyIncidentData}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="nmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="injGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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
                  <Area type="monotone" dataKey="injuries" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#injGrad)" name="Injuries" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Risk Score by Department"
              description="Risk assessment scores across departments"
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentRiskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={60} />
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
                    <Bar dataKey="risk" name="Risk Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="incidents" name="Incidents" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Incident Distribution"
              description="Incidents by department"
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentRiskData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="incidents"
                      nameKey="department"
                      label={(entry) => `${entry.department}: ${entry.incidents}`}
                    >
                      {departmentRiskData.map((_, i) => (
                        <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <ChartCard
            title="Sensor Readings Over Time"
            description="24-hour trend for gas, temperature, and pressure sensors"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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
                  <Line type="monotone" dataKey="gas" stroke="hsl(var(--destructive))" strokeWidth={2} name="Gas (ppm)" />
                  <Line type="monotone" dataKey="temp" stroke="hsl(var(--warning))" strokeWidth={2} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="pressure" stroke="hsl(var(--primary))" strokeWidth={2} name="Pressure (bar)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="permits" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Permits by Type"
              description="Distribution of work permits across categories"
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={permitTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {permitTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
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
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Permit Approval Rate"
              description="Approval metrics over time"
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyIncidentData.slice(6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="incidents" name="Approved" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="nearMiss" name="Pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
