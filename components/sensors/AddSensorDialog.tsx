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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Machine, Sensor, SensorStatus, SensorTypeExtended } from '@/types/database';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type AddSensorForm = {
  sensor_id: string;
  sensor_name: string;
  sensor_type: SensorTypeExtended | '';
  location: string;
  assigned_machine_id: string; // '' means null
  status: SensorStatus | '';
  battery_percent: string; // keep as string for input
  installation_date: string; // yyyy-mm-dd
  health_score: string;
};

type AddSensorDialogMode = 'add' | 'edit';

type AddSensorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AddSensorDialogMode;
  initialSensor?: Sensor | null;
  onSubmitted?: () => void;
};

const SENSOR_TYPE_OPTIONS: Array<{ label: string; value: SensorTypeExtended }> = [
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

const SENSOR_STATUS_OPTIONS: Array<{ label: string; value: SensorStatus }> = [
  { label: 'Online', value: 'online' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
  { label: 'Offline', value: 'offline' },
];

function toYMD(isoOrDate: string | null | undefined) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseIntSafe(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export default function AddSensorDialog({
  open,
  onOpenChange,
  mode = 'add',
  initialSensor = null,
  onSubmitted,
}: AddSensorDialogProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: machines, isLoading: isMachinesLoading } = useSupabaseQuery<Machine>({
    table: 'machines',
    limit: 1000,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState<AddSensorForm>({
    sensor_id: '',
    sensor_name: '',
    sensor_type: '',
    location: '',
    assigned_machine_id: '',
    status: '',
    battery_percent: '100',
    installation_date: '',
    health_score: '85',
  });

  const reset = React.useCallback(() => {
    setForm({
      sensor_id: '',
      sensor_name: '',
      sensor_type: '',
      location: '',
      assigned_machine_id: '',
      status: '',
      battery_percent: '100',
      installation_date: '',
      health_score: '85',
    });
    setErrors({});
    setSubmitting(false);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  React.useEffect(() => {
    if (!open) return;
    if (mode !== 'edit') return;
    if (!initialSensor) return;

    setForm({
      sensor_id: initialSensor.sensor_id ?? '',
      sensor_name: initialSensor.sensor_name ?? '',
      sensor_type: initialSensor.sensor_type as SensorTypeExtended,
      location: initialSensor.location ?? '',
      assigned_machine_id: initialSensor.assigned_machine_id ?? '',
      status: initialSensor.status ?? '',
      battery_percent: String(initialSensor.battery_percent ?? 100),
      installation_date: toYMD(initialSensor.installation_date),
      health_score: String(initialSensor.health_score ?? 85),
    });

    setErrors({});
  }, [mode, open, initialSensor]);

  const validate = React.useCallback(() => {
    const next: Record<string, string> = {};

    if (!form.sensor_id.trim()) next.sensor_id = 'Sensor ID is required.';
    if (!form.sensor_name.trim()) next.sensor_name = 'Sensor Name is required.';
    if (!form.sensor_type) next.sensor_type = 'Sensor Type is required.';
    if (!form.location.trim()) next.location = 'Location is required.';
    if (!form.status) next.status = 'Status is required.';

    const batt = parseIntSafe(form.battery_percent);
    if (batt === null) next.battery_percent = 'Battery % must be a number.';
    else if (batt < 0 || batt > 100) next.battery_percent = 'Battery % must be between 0 and 100.';

    const health = parseIntSafe(form.health_score);
    if (health === null) next.health_score = 'Health score must be a number.';
    else if (health < 0 || health > 100) next.health_score = 'Health score must be between 0 and 100.';

    if (!form.installation_date) next.installation_date = 'Installation date is required.';

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
        const battery = parseIntSafe(form.battery_percent);
        const health = parseIntSafe(form.health_score);

        if (battery === null || health === null) throw new Error('Invalid numeric values.');

        const payload = {
          sensor_id: form.sensor_id.trim(),
          sensor_name: form.sensor_name.trim(),
          sensor_type: form.sensor_type as SensorTypeExtended,
          location: form.location.trim(),
          assigned_machine_id: form.assigned_machine_id ? form.assigned_machine_id : null,
          status: form.status as SensorStatus,
          battery_percent: battery,
          health_score: health,
          installation_date: new Date(`${form.installation_date}T00:00:00Z`).toISOString(),
        } as Partial<Sensor>;

        let error: any = null;

        if (mode === 'edit' && initialSensor?.id) {
          const { error: updateError } = await supabase
            .from('sensors')
            .update(payload)
            .eq('id', initialSensor.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('sensors')
            .insert(payload)
            .select('id')
            .single();
          error = insertError;
        }

        if (error) throw error;

        toast({
          title: mode === 'edit' ? 'Sensor updated successfully' : 'Sensor added successfully',
          description: payload.sensor_name,
        });

        queryClient.invalidateQueries({ queryKey: ['sensors'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['sensor_data'], exact: false });

        onSubmitted?.();
        onOpenChange(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit sensor.';
        toast({
          variant: 'destructive',
          title: 'Could not save sensor',
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
      supabase,
      mode,
      initialSensor?.id,
      toast,
      queryClient,
      onOpenChange,
      onSubmitted,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Sensor' : 'Add Sensor'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update sensor configuration and assignment.'
              : 'Enter sensor details to add it to your system.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sensor_id">Sensor ID</Label>
              <Input
                id="sensor_id"
                value={form.sensor_id}
                onChange={(e) => setForm((f) => ({ ...f, sensor_id: e.target.value }))}
                placeholder="e.g. SEN-00001"
                disabled={mode === 'edit'}
                className={errors.sensor_id ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.sensor_id && <p className="text-sm text-destructive">{errors.sensor_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensor_name">Sensor Name</Label>
              <Input
                id="sensor_name"
                value={form.sensor_name}
                onChange={(e) => setForm((f) => ({ ...f, sensor_name: e.target.value }))}
                placeholder="e.g. Line 3 Gas Sensor"
                className={errors.sensor_name ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.sensor_name && <p className="text-sm text-destructive">{errors.sensor_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sensor Type</Label>
              <Select
                value={form.sensor_type}
                onValueChange={(v) => setForm((f) => ({ ...f, sensor_type: v as SensorTypeExtended }))}
              >
                <SelectTrigger className={errors.sensor_type ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder="Select sensor type" />
                </SelectTrigger>
                <SelectContent>
                  {SENSOR_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sensor_type && <p className="text-sm text-destructive">{errors.sensor_type}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as SensorStatus }))}>
                <SelectTrigger className={errors.status ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {SENSOR_STATUS_OPTIONS.map((s) => (
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
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Warehouse A"
              className={errors.location ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Assigned Machine</Label>
              <Select
                value={form.assigned_machine_id}
                onValueChange={(v) => setForm((f) => ({ ...f, assigned_machine_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isMachinesLoading ? 'Loading...' : 'Select a machine'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {(machines ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input
                id="installation_date"
                type="date"
                value={form.installation_date}
                onChange={(e) => setForm((f) => ({ ...f, installation_date: e.target.value }))}
                className={errors.installation_date ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.installation_date && <p className="text-sm text-destructive">{errors.installation_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="battery_percent">Battery %</Label>
              <Input
                id="battery_percent"
                value={form.battery_percent}
                onChange={(e) => setForm((f) => ({ ...f, battery_percent: e.target.value }))}
                inputMode="numeric"
                placeholder="0-100"
                className={errors.battery_percent ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.battery_percent && <p className="text-sm text-destructive">{errors.battery_percent}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_score">Health Score</Label>
              <Input
                id="health_score"
                value={form.health_score}
                onChange={(e) => setForm((f) => ({ ...f, health_score: e.target.value }))}
                inputMode="numeric"
                placeholder="0-100"
                className={errors.health_score ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.health_score && <p className="text-sm text-destructive">{errors.health_score}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : mode === 'edit' ? 'Update Sensor' : 'Add Sensor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

