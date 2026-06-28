'use client';

import * as React from 'react';
import { FileText, Plus, Download, Calendar, Clock, CheckCircle2, Printer, FileBarChart } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterSelect } from '@/components/shared/filter-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import type { Report } from '@/types/database';

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
];

const reportTypes = [
  'Safety Summary',
  'Incident Report',
  'Compliance Audit',
  'Sensor Analysis',
  'Permit Review',
  'Risk Assessment',
  'Monthly Overview',
  'Department Report',
];

const dummyReports: Report[] = reportTypes.flatMap((type, typeIdx) =>
  Array.from({ length: 3 }, (_, i) => {
    const id = `dummy-${typeIdx}-${i}`;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const statuses: Report['status'][] = ['completed', 'scheduled', 'draft', 'failed'];
    return {
      id,
      title: `${type} — ${periodStart.toLocaleDateString('default', { month: 'short', year: 'numeric' })}`,
      type,
      status: statuses[(typeIdx + i) % statuses.length],
      author_id: 'system',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      summary: `Comprehensive ${type.toLowerCase()} covering the period from ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}.`,
      data: null,
      created_at: new Date(now.getTime() - i * 86400000 - typeIdx * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - i * 86400000 - typeIdx * 3600000).toISOString(),
    } as Report;
  })
);

export default function ReportsPage() {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [newReportType, setNewReportType] = React.useState(reportTypes[0]);
  const [newReportTitle, setNewReportTitle] = React.useState('');

  const { data: dbReports, isLoading } = useSupabaseQuery<Report>({
    table: 'reports',
    order: { column: 'created_at', ascending: false },
    limit: 100,
  });

  const reports = React.useMemo(() => {
    return dbReports && dbReports.length > 0 ? dbReports : dummyReports;
  }, [dbReports]);

  const typeOptions = React.useMemo(() => {
    const types = new Set(reports?.map((r) => r.type) ?? []);
    return Array.from(types).map((t) => ({ label: t, value: t }));
  }, [reports]);

  const filtered = React.useMemo(() => {
    return (reports ?? []).filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      return true;
    });
  }, [reports, statusFilter, typeFilter]);

  const completedCount = reports?.filter((r) => r.status === 'completed').length ?? 0;
  const scheduledCount = reports?.filter((r) => r.status === 'scheduled').length ?? 0;
  const draftCount = reports?.filter((r) => r.status === 'draft').length ?? 0;

  const handleGenerate = async () => {
    if (!profile) {
      toast.error('You must be signed in to generate reports');
      return;
    }
    setGenerating(true);
    try {
      const supabase = createClient();
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const title = newReportTitle || `${newReportType} — ${now.toLocaleDateString('default', { month: 'short', year: 'numeric' })}`;

      const { error } = await supabase.from('reports').insert({
        title,
        type: newReportType,
        status: 'completed',
        author_id: profile.id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        summary: `Generated ${newReportType.toLowerCase()} covering ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}.`,
      });

      if (error) throw error;
      toast.success('Report generated successfully');
      setGenerateOpen(false);
      setNewReportTitle('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report: Report) => {
    const content = [
      `SAFE SPHERE AI — SAFETY REPORT`,
      `========================================`,
      ``,
      `Report: ${report.title}`,
      `Type: ${report.type}`,
      `Status: ${report.status}`,
      `Period: ${new Date(report.period_start).toLocaleDateString()} — ${new Date(report.period_end).toLocaleDateString()}`,
      `Generated: ${new Date(report.created_at).toLocaleString()}`,
      ``,
      `SUMMARY`,
      `-------`,
      report.summary ?? 'No summary available.',
      ``,
      `Generated by SafeSphere AI Platform`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const handlePrint = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print reports');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1a1a2e; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
            .section { margin-bottom: 20px; }
            .section h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .field { display: flex; justify-content: space-between; padding: 4px 0; }
            .label { font-weight: 600; }
            .value { color: #444; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <h1>SafeSphere AI — Safety Report</h1>
          <div class="meta">Generated on ${new Date().toLocaleString()}</div>
          <div class="section">
            <h2>Report Details</h2>
            <div class="field"><span class="label">Title:</span><span class="value">${report.title}</span></div>
            <div class="field"><span class="label">Type:</span><span class="value">${report.type}</span></div>
            <div class="field"><span class="label">Status:</span><span class="value">${report.status}</span></div>
            <div class="field"><span class="label">Period:</span><span class="value">${new Date(report.period_start).toLocaleDateString()} — ${new Date(report.period_end).toLocaleDateString()}</span></div>
            <div class="field"><span class="label">Generated:</span><span class="value">${new Date(report.created_at).toLocaleString()}</span></div>
          </div>
          <div class="section">
            <h2>Summary</h2>
            <p>${report.summary ?? 'No summary available.'}</p>
          </div>
          <div class="footer">Generated by SafeSphere AI — Enterprise Safety Intelligence Platform</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const columns: Column<Report>[] = [
    {
      key: 'title',
      header: 'Report',
      sortable: true,
      sortAccessor: (r) => r.title,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      cell: (r) => (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(r.period_start).toLocaleDateString()}
          </p>
          <p>to {new Date(r.period_end).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
      cell: (r) => (
        <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
          {r.summary ?? 'No summary available.'}
        </p>
      ),
    },
    {
      key: 'created',
      header: 'Generated',
      sortable: true,
      sortAccessor: (r) => r.created_at,
      cell: (r) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) =>
        r.status === 'completed' ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleDownload(r)}>
              <Download className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handlePrint(r)}>
              <Printer className="h-3 w-3" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate, schedule, and download safety reports"
        icon={<FileText className="h-5 w-5 text-primary" />}
        actions={
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogDescription>Create a new safety report for the current period</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={newReportType} onValueChange={setNewReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportTitle">Report Title (optional)</Label>
                  <Input
                    id="reportTitle"
                    value={newReportTitle}
                    onChange={(e) => setNewReportTitle(e.target.value)}
                    placeholder="Auto-generated if left blank"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileBarChart className="mr-2 h-4 w-4" />
                  )}
                  {generating ? 'Generating...' : 'Generate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports"
          value={reports?.length ?? 0}
          icon={<FileText className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          title="Scheduled"
          value={scheduledCount}
          icon={<Clock className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          title="Drafts"
          value={draftCount}
          icon={<FileText className="h-5 w-5" />}
          accent="primary"
        />
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            searchPlaceholder="Search reports by title or type..."
            searchAccessor={(r) => `${r.title} ${r.type}`}
            getRowId={(r) => r.id}
            emptyTitle="No reports found"
            emptyDescription="Try adjusting your filters or generate a new report."
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
                  className="w-[180px]"
                />
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
