'use client';

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
} from '@/components/ui/sheet';

import SearchCombobox from '@/components/shared/search-combobox';
import type { SearchComboboxItem } from '@/components/shared/search-combobox';

import type {
  Department,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  Machine,
  Sensor,
  Worker,
  Profile,
} from '@/types/database';

import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

import { CalendarDays, MapPin, AlertTriangle, ClipboardPlus, Save } from 'lucide-react';

type AddIncidentDialogMode = 'add' | 'edit';

type AddIncidentForm = {
  incident_number: string;
  title: string;
  description: string;
  severity: IncidentSeverity | '';
  status: IncidentStatus | '';
  category: string;
  department_id: string;
  worker_id: string;
  machine_id: string;
  sensor_id: string;
  occurred_at: string; // datetime-local ISO-ish
  reported_by: string;
  location: string;
  root_cause: string;
  corrective_action: string;
  notes: string;
};

type AddIncidentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AddIncidentDialogMode;
  initialIncident?: Incident | null;
  onSubmitted?: () => void;
};

function toISOFromLocalDateTime(input: string): string | null {
  // input comes from <input type="datetime-local"> which is local time without timezone.
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toLocalDateTimeValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // Convert to local datetime-local value: yyyy-MM-ddTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function generateIncidentNumber(): string {
  return `INC-${Math.floor(Math.random() * 900000 + 100000)}`;
}

const severityOptions: Array<{ label: string; value: IncidentSeverity }> = [
  { label: 'Minor', value: 'minor' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Serious', value: 'serious' },
  { label: 'Critical', value: 'critical' },
];

const statusOptions: Array<{ label: string; value: IncidentStatus }> = [
  { label: 'Open', value: 'open' },
  { label: 'Investigating', value: 'investigating' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

export default function AddIncidentDialog({
  open,
  onOpenChange,
  mode = 'add',
  initialIncident = null,
  onSubmitted,
}: AddIncidentDialogProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: departments, isLoading: isDepartmentsLoading } = useSupabaseQuery<Department>({
    table: 'departments',
    limit: 200,
  });

  const { data: workers, isLoading: isWorkersLoading } = useSupabaseQuery<Worker>({
    table: 'workers',
    limit: 1000,
  });

  const { data: machines, isLoading: isMachinesLoading } = useSupabaseQuery<Machine>({
    table: 'machines',
    limit: 1000,
  });

  const { data: sensors, isLoading: isSensorsLoading } = useSupabaseQuery<Sensor>({
    table: 'sensors',
    limit: 1000,
  });

  const { data: profiles } = useSupabaseQuery<Profile>({
    table: 'profiles',
    limit: 100,
  });

  const profileOptions: SearchComboboxItem[] = React.useMemo(() => {
    return (profiles ?? []).map((p) => ({
      id: p.id,
      label: p.full_name,
      secondaryLabel: p.email,
      searchText: `${p.full_name} ${p.email}`,
    }));
  }, [profiles]);

  const workerOptions: SearchComboboxItem[] = React.useMemo(() => {
    return (workers ?? []).map((w) => ({
      id: w.id,
      label: w.full_name,
      secondaryLabel: w.employee_id,
      searchText: `${w.full_name} ${w.employee_id}`,
    }));
  }, [workers]);

  const machineOptions: SearchComboboxItem[] = React.useMemo(() => {
    return (machines ?? []).map((m) => ({
      id: m.id,
      label: m.name,
      secondaryLabel: m.code,
      searchText: `${m.name} ${m.code} ${m.type}`,
    }));
  }, [machines]);

  const sensorOptions: SearchComboboxItem[] = React.useMemo(() => {
    return (sensors ?? []).map((s) => ({
      id: s.id,
      label: s.sensor_name,
      secondaryLabel: s.sensor_id,
      searchText: `${s.sensor_name} ${s.sensor_id} ${s.sensor_type}`,
    }));
  }, [sensors]);

  const deptOptions: SearchComboboxItem[] = React.useMemo(() => {
    return (departments ?? []).map((d) => ({
      id: d.id,
      label: d.name,
      secondaryLabel: d.code,
      searchText: `${d.name} ${d.code}`,
    }));
  }, [departments]);

  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState<AddIncidentForm>({
    incident_number: '',
    title: '',
    description: '',
    severity: '',
    status: '',
    category: '',
    department_id: '',
    worker_id: '',
    machine_id: '',
    sensor_id: '',
    occurred_at: '',
    reported_by: '',
    location: '',
    root_cause: '',
    corrective_action: '',
    notes: '',
  });

  const reset = React.useCallback(() => {
    setForm({
      incident_number: '',
      title: '',
      description: '',
      severity: '',
      status: '',
      category: '',
      department_id: '',
      worker_id: '',
      machine_id: '',
      sensor_id: '',
      occurred_at: '',
      reported_by: '',
      location: '',
      root_cause: '',
      corrective_action: '',
      notes: '',
    });
    setErrors({});
    setSubmitting(false);
  }, []);

  React.useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (mode === 'add') {
      setForm((f) => ({
        ...f,
        incident_number: f.incident_number ? f.incident_number : generateIncidentNumber(),
      }));
    }
  }, [open, mode, reset]);

  React.useEffect(() => {
    if (!open) return;
    if (mode !== 'edit') return;
    if (!initialIncident) return;

    // Note: existing incidents have reported_by/assigned_to as profiles.
    // For worker_id, machine_id, sensor_id, department_id, category, notes we map to new nullable columns.
    setForm({
      incident_number: initialIncident.incident_number ?? '',
      title: initialIncident.title ?? '',
      description: initialIncident.description ?? '',
      severity: initialIncident.severity ?? '',
      status: initialIncident.status ?? '',
      category: (initialIncident as any).category ?? '',
      department_id: (initialIncident as any).department_id ?? '',
      worker_id: (initialIncident as any).worker_id ?? '',
      machine_id: (initialIncident as any).machine_id ?? '',
      sensor_id: (initialIncident as any).sensor_id ?? '',
      occurred_at: toLocalDateTimeValue(initialIncident.occurred_at),
      reported_by: initialIncident.reported_by ?? '',
      location: initialIncident.location ?? '',
      root_cause: initialIncident.root_cause ?? '',
      corrective_action: (initialIncident.corrective_actions ?? []).join(', '),
      notes: (initialIncident as any).notes ?? '',
    });
    setErrors({});
  }, [mode, open, initialIncident]);

  const validate = React.useCallback(() => {
    const next: Record<string, string> = {};

    if (!form.incident_number.trim()) next.incident_number = 'Incident ID is required.';
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.description.trim()) next.description = 'Description is required.';

    if (!form.severity) next.severity = 'Severity is required.';
    if (!form.status) next.status = 'Status is required.';

    if (!form.category.trim()) next.category = 'Category is required.';
    if (!form.department_id) next.department_id = 'Department is required.';
    if (!form.worker_id) next.worker_id = 'Worker is required.';
    if (!form.machine_id) next.machine_id = 'Machine is required.';
    if (!form.sensor_id) next.sensor_id = 'Sensor is required.';

    if (!form.occurred_at) next.occurred_at = 'Incident date & time is required.';

    if (!form.reported_by) next.reported_by = 'Reported By is required.';
    if (!form.location.trim()) next.location = 'Location is required.';

    if (!form.root_cause.trim()) next.root_cause = 'Root Cause is required.';
    if (!form.corrective_action.trim()) next.corrective_action = 'Corrective Action is required.';
    if (!form.notes.trim()) next.notes = 'Notes are required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      if (!validate()) return;

      setSubmitting(true);
      try {
        const occurredISO = toISOFromLocalDateTime(form.occurred_at);
        if (!occurredISO) throw new Error('Invalid Incident Date & Time');

        const payload: Partial<Incident> & {
          corrective_actions: string[];
        } = {
          incident_number: form.incident_number.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          severity: form.severity as IncidentSeverity,
          status: form.status as IncidentStatus,
          location: form.location.trim(),
          reported_by: form.reported_by,
          occurred_at: occurredISO,
          root_cause: form.root_cause.trim(),
          corrective_actions: form.corrective_action
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          // existing required numeric fields
          injuries: 0,
          property_damage: 0,
          // new UI columns
          category: form.category.trim(),
          department_id: form.department_id,
          worker_id: form.worker_id,
          machine_id: form.machine_id,
          sensor_id: form.sensor_id,
          notes: form.notes.trim(),
        } as any;

        let error: any = null;
        if (mode === 'edit' && initialIncident?.id) {
          const { error: updateError } = await supabase
            .from('incidents')
            .update(payload)
            .eq('id', initialIncident.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('incidents')
            .insert(payload as any)
            .select('id')
            .single();
          error = insertError;
        }

        if (error) throw error;

        toast({
          title: mode === 'edit' ? 'Incident updated successfully' : 'Incident added successfully',
          description: payload.title,
        });

        queryClient.invalidateQueries({ queryKey: ['incidents'] });
        onSubmitted?.();
        onOpenChange(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit incident.';
        toast({
          variant: 'destructive',
          title: 'Could not save incident',
          description: message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      form,
      submitting,
      validate,
      mode,
      initialIncident?.id,
      supabase,
      toast,
      queryClient,
      onSubmitted,
      onOpenChange,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <div className="flex flex-col max-h-[90vh] h-full">
          <div className="p-6 border-b border-border/50 flex-shrink-0">
            <DialogHeader>
              <DialogTitle>{mode === 'edit' ? 'Edit Incident' : 'Add Incident'}</DialogTitle>
              <DialogDescription>Enter incident details, investigation information, and corrective actions.</DialogDescription>
            </DialogHeader>
          </div>

          <form className="flex flex-col flex-1 min-h-0" onSubmit={onSubmit}>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="incident_number">Incident ID</Label>
                  <Input
                    id="incident_number"
                    value={form.incident_number}
                    onChange={(e) => setForm((f) => ({ ...f, incident_number: e.target.value }))}
                    placeholder="e.g. INC-00001"
                    className={errors.incident_number ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  {errors.incident_number && <p className="text-sm text-destructive">{errors.incident_number}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occurred_at">Incident Date & Time</Label>
                  <Input
                    id="occurred_at"
                    type="datetime-local"
                    value={form.occurred_at}
                    onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))}
                    className={errors.occurred_at ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  {errors.occurred_at && <p className="text-sm text-destructive">{errors.occurred_at}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Slip and Fall - Wet Floor"
                    className={errors.title ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Plant A - Floor 2"
                    className={errors.location ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v as any }))}>
                    <SelectTrigger className={errors.severity ? 'border-destructive focus:ring-destructive' : undefined}>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.severity && <p className="text-sm text-destructive">{errors.severity}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as any }))}>
                    <SelectTrigger className={errors.status ? 'border-destructive focus:ring-destructive' : undefined}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe the incident, what happened, and immediate actions taken."
                  className={errors.description ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Slip/Fall, Chemical, Electrical"
                    className={errors.category ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <SearchCombobox
                    value={form.department_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}
                    placeholder={isDepartmentsLoading ? 'Loading...' : 'Select department'}
                    disabled={isDepartmentsLoading}
                    items={deptOptions}
                  />
                  {errors.department_id && <p className="text-sm text-destructive">{errors.department_id}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Worker</Label>
                  <SearchCombobox
                    value={form.worker_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, worker_id: v }))}
                    placeholder={isWorkersLoading ? 'Loading...' : 'Select worker'}
                    disabled={isWorkersLoading}
                    items={workerOptions}
                  />
                  {errors.worker_id && <p className="text-sm text-destructive">{errors.worker_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Reported By</Label>
                  <SearchCombobox
                    value={form.reported_by}
                    onValueChange={(v) => setForm((f) => ({ ...f, reported_by: v }))}
                    placeholder={profileOptions.length ? 'Select reporter' : 'Loading...'}
                    disabled={!profileOptions.length}
                    items={profileOptions}
                  />
                  {errors.reported_by && <p className="text-sm text-destructive">{errors.reported_by}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Machine</Label>
                  <SearchCombobox
                    value={form.machine_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, machine_id: v }))}
                    placeholder={isMachinesLoading ? 'Loading...' : 'Select machine'}
                    disabled={isMachinesLoading}
                    items={machineOptions}
                  />
                  {errors.machine_id && <p className="text-sm text-destructive">{errors.machine_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Sensor</Label>
                  <SearchCombobox
                    value={form.sensor_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, sensor_id: v }))}
                    placeholder={isSensorsLoading ? 'Loading...' : 'Select sensor'}
                    disabled={isSensorsLoading}
                    items={sensorOptions}
                  />
                  {errors.sensor_id && <p className="text-sm text-destructive">{errors.sensor_id}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="root_cause">Root Cause</Label>
                  <Textarea
                    id="root_cause"
                    value={form.root_cause}
                    onChange={(e) => setForm((f) => ({ ...f, root_cause: e.target.value }))}
                    rows={3}
                    className={errors.root_cause ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  {errors.root_cause && <p className="text-sm text-destructive">{errors.root_cause}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corrective_action">Corrective Action</Label>
                  <Textarea
                    id="corrective_action"
                    value={form.corrective_action}
                    onChange={(e) => setForm((f) => ({ ...f, corrective_action: e.target.value }))}
                    rows={3}
                    className={errors.corrective_action ? 'border-destructive focus-visible:ring-destructive' : undefined}
                    placeholder="Comma-separated actions"
                  />
                  {errors.corrective_action && <p className="text-sm text-destructive">{errors.corrective_action}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className={errors.notes ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
              </div>
            </div>

            <div className="p-6 border-t border-border/50 flex-shrink-0 sticky bottom-0 bg-background">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : mode === 'edit' ? 'Update Incident' : 'Add Incident'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}


