'use client';

import * as React from 'react';
import { Plus, Wrench } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Department, Machine, MachineStatus } from '@/types/database';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { useQueryClient } from '@tanstack/react-query';

const statusOptions: Array<{ label: string; value: MachineStatus }> = [
  { label: 'Operational', value: 'operational' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Offline', value: 'offline' },
  { label: 'Fault', value: 'fault' },
];

type AddMachineDialogMode = 'add' | 'edit';

type AddMachineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AddMachineDialogMode;
  initialMachine?: Machine | null;
};

type MachineForm = {
  name: string;
  code: string;
  type: string;
  location: string;
  department_id: string;
  status: MachineStatus | '';
  health_score: string; // 0-100
  manufacturer: string;
  model: string;
  install_date: string; // y-m-d
  last_maintenance: string; // y-m-d
  next_maintenance: string; // y-m-d
  operating_hours: string;
};

function isValidISODateYMD(ymd: string) {
  // strict yyyy-mm-dd
  if (!ymd) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime());
}

function toISODateFromYMD(ymd: string): string | null {
  if (!ymd) return null;
  if (!isValidISODateYMD(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toYMDFromISO(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddMachineDialog({
  open,
  onOpenChange,
  mode = 'add',
  initialMachine = null,
}: AddMachineDialogProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: departments } = useSupabaseQuery<Department>({ table: 'departments', limit: 200 });

  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState<MachineForm>({
    name: '',
    code: '',
    type: '',
    location: '',
    department_id: '',
    status: '',
    health_score: '85',
    manufacturer: '',
    model: '',
    install_date: '',
    last_maintenance: '',
    next_maintenance: '',
    operating_hours: '0',
  });

  const reset = React.useCallback(() => {
    setForm({
      name: '',
      code: '',
      type: '',
      location: '',
      department_id: '',
      status: '',
      health_score: '85',
      manufacturer: '',
      model: '',
      install_date: '',
      last_maintenance: '',
      next_maintenance: '',
      operating_hours: '0',
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
    if (!initialMachine) return;

    setForm({
      name: initialMachine.name ?? '',
      code: initialMachine.code ?? '',
      type: initialMachine.type ?? '',
      location: initialMachine.location ?? '',
      department_id: initialMachine.department_id ?? '',
      status: (initialMachine.status as MachineStatus) ?? '',
      health_score: String(initialMachine.health_score ?? 85),
      manufacturer: initialMachine.manufacturer ?? '',
      model: initialMachine.model ?? '',
      install_date: toYMDFromISO(initialMachine.install_date),
      last_maintenance: toYMDFromISO(initialMachine.last_maintenance),
      next_maintenance: toYMDFromISO(initialMachine.next_maintenance),
      operating_hours: String(initialMachine.operating_hours ?? 0),
    });
    setErrors({});
  }, [open, mode, initialMachine]);

  const validate = React.useCallback(() => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = 'Machine name is required.';
    if (!form.code.trim()) next.code = 'Machine code is required.';
    if (!form.type.trim()) next.type = 'Machine type is required.';
    if (!form.location.trim()) next.location = 'Location is required.';

    if (!form.status) next.status = 'Status is required.';

    const health = Number(form.health_score);
    if (Number.isNaN(health)) next.health_score = 'Health score must be a number.';
    else if (health < 0 || health > 100) next.health_score = 'Health score must be between 0 and 100.';

    const hours = Number(form.operating_hours);
    if (Number.isNaN(hours) || hours < 0) next.operating_hours = 'Operating hours must be 0 or greater.';

    if (!form.install_date.trim()) next.install_date = 'Install date is required.';
    else if (!isValidISODateYMD(form.install_date)) next.install_date = 'Enter a valid install date.';

    if (!isValidISODateYMD(form.last_maintenance)) next.last_maintenance = 'Enter a valid last maintenance date.';
    if (!isValidISODateYMD(form.next_maintenance)) next.next_maintenance = 'Enter a valid next maintenance date.';

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
        const payload = {
          name: form.name.trim(),
          code: form.code.trim(),
          type: form.type.trim(),
          location: form.location.trim(),
          department_id: form.department_id ? form.department_id : null,
          status: form.status as MachineStatus,
          health_score: Number(form.health_score),
          manufacturer: form.manufacturer.trim() ? form.manufacturer.trim() : null,
          model: form.model.trim() ? form.model.trim() : null,
          install_date: toISODateFromYMD(form.install_date)!,
          last_maintenance: toISODateFromYMD(form.last_maintenance),
          next_maintenance: toISODateFromYMD(form.next_maintenance),
          operating_hours: Number(form.operating_hours),
        };

        let error: any = null;
        if (mode === 'edit' && initialMachine?.id) {
          const { error: updateError } = await supabase.from('machines').update(payload).eq('id', initialMachine.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase.from('machines').insert(payload).select('id').single();
          error = insertError;
        }

        if (error) throw error;

        toast({
          title: mode === 'edit' ? 'Machine updated' : 'Machine added',
          description: payload.name,
        });

        queryClient.invalidateQueries({ queryKey: ['machines'], exact: false });
        onOpenChange(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit machine.';
        toast({
          variant: 'destructive',
          title: 'Could not save machine',
          description: message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      submitting,
      validate,
      form,
      mode,
      initialMachine?.id,
      supabase,
      toast,
      queryClient,
      onOpenChange,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'edit' ? <Wrench className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
            {mode === 'edit' ? 'Edit Machine' : 'Add Machine'}
          </DialogTitle>
          <DialogDescription>Enter machine details to manage maintenance schedules.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Machine Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={errors.name ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className={errors.code ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={errors.type ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className={errors.location ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as MachineStatus }))}>
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

            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={form.department_id}
                onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {(departments ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_score">Health Score (0-100)</Label>
              <Input
                id="health_score"
                type="number"
                value={form.health_score}
                onChange={(e) => setForm((f) => ({ ...f, health_score: e.target.value }))}
                className={errors.health_score ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.health_score && <p className="text-sm text-destructive">{errors.health_score}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="operating_hours">Operating Hours</Label>
              <Input
                id="operating_hours"
                type="number"
                value={form.operating_hours}
                onChange={(e) => setForm((f) => ({ ...f, operating_hours: e.target.value }))}
                className={errors.operating_hours ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.operating_hours && <p className="text-sm text-destructive">{errors.operating_hours}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="install_date">Install Date</Label>
              <Input
                id="install_date"
                type="date"
                value={form.install_date}
                onChange={(e) => setForm((f) => ({ ...f, install_date: e.target.value }))}
                className={errors.install_date ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.install_date && <p className="text-sm text-destructive">{errors.install_date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_maintenance">Last Maintenance</Label>
              <Input
                id="last_maintenance"
                type="date"
                value={form.last_maintenance}
                onChange={(e) => setForm((f) => ({ ...f, last_maintenance: e.target.value }))}
                className={errors.last_maintenance ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.last_maintenance && <p className="text-sm text-destructive">{errors.last_maintenance}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="next_maintenance">Next Maintenance</Label>
              <Input
                id="next_maintenance"
                type="date"
                value={form.next_maintenance}
                onChange={(e) => setForm((f) => ({ ...f, next_maintenance: e.target.value }))}
                className={errors.next_maintenance ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.next_maintenance && <p className="text-sm text-destructive">{errors.next_maintenance}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : mode === 'edit' ? 'Update Machine' : 'Add Machine'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

