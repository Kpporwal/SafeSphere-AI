'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import type { Department, Machine, Permit, PermitStatus, PermitType, Worker } from '@/types/database';
import SearchCombobox, { type SearchComboboxItem } from '@/components/shared/search-combobox';

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { useQueryClient } from '@tanstack/react-query';

type AddPermitDialogMode = 'add' | 'edit';

type AddPermitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AddPermitDialogMode;
  initialPermit?: Permit | null;
  onSubmitted?: () => void;
};

type PermitForm = {
  permit_number: string;
  title: string;
  type: PermitType | '';
  department_id: string | '';
  worker_id: string | '';
  issued_by: string;
  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd
  status: PermitStatus | '';
  description: string;
  notes: string;
};

function isValidISODateYMD(ymd: string) {
  if (!ymd) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime());
}

function toISODateFromYMD(ymd: string): string | null {
  if (!isValidISODateYMD(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toYMDFromISO(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const statusOptions: Array<{ label: string; value: PermitStatus }> = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
  { label: 'Active', value: 'active' },
];

const typeOptions: Array<{ label: string; value: PermitType }> = [
  { label: 'Hot Work', value: 'hot_work' },
  { label: 'Confined Space', value: 'confined_space' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Height Work', value: 'height_work' },
  { label: 'Excavation', value: 'excavation' },
  { label: 'Lifting', value: 'lifting' },
  { label: 'Chemical', value: 'chemical' },
];

export default function AddPermitDialog({
  open,
  onOpenChange,
  mode = 'add',
  initialPermit = null,
  onSubmitted,
}: AddPermitDialogProps) {
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

  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState<PermitForm>({
    permit_number: '',
    title: '',
    type: '',
    department_id: '',
    worker_id: '',
    issued_by: '',
    start_date: '',
    end_date: '',
    status: '',
    description: '',
    notes: '',
  });

  const reset = React.useCallback(() => {
    setForm({
      permit_number: '',
      title: '',
      type: '',
      department_id: '',
      worker_id: '',
      issued_by: '',
      start_date: '',
      end_date: '',
      status: '',
      description: '',
      notes: '',
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
    if (!initialPermit) return;

    setForm({
      permit_number: initialPermit.permit_number ?? '',
      title: initialPermit.title ?? '',
      type: (initialPermit.type as PermitType) ?? '',
      department_id: (initialPermit as any).department_id ?? '',
      worker_id: (initialPermit as any).worker_id ?? '',
      issued_by: initialPermit.requested_by ?? '',
      start_date: toYMDFromISO((initialPermit as any).start_date),
      end_date: toYMDFromISO((initialPermit as any).end_date),
      status: (initialPermit.status as PermitStatus) ?? '',
      description: initialPermit.description ?? '',
      notes: (initialPermit as any).precautions?.join(', ') ?? '',
    });
    setErrors({});
  }, [mode, open, initialPermit]);

  const validate = React.useCallback(() => {
    const next: Record<string, string> = {};
    if (!form.permit_number.trim()) next.permit_number = 'Permit ID is required.';
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.type) next.type = 'Permit Type is required.';
    if (!form.department_id) next.department_id = 'Department is required.';
    if (!form.worker_id) next.worker_id = 'Worker is required.';
    if (!form.issued_by.trim()) next.issued_by = 'Issued By is required.';
    if (!form.start_date.trim()) next.start_date = 'Start Date is required.';
    else if (!isValidISODateYMD(form.start_date)) next.start_date = 'Enter a valid start date.';

    if (!form.end_date.trim()) next.end_date = 'Expiry Date is required.';
    else if (!isValidISODateYMD(form.end_date)) next.end_date = 'Enter a valid expiry date.';
    else if (form.start_date && form.end_date) {
      const s = new Date(`${form.start_date}T00:00:00.000Z`).getTime();
      const e = new Date(`${form.end_date}T00:00:00.000Z`).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) next.end_date = 'Expiry Date must be after Start Date.';
    }

    if (!form.status) next.status = 'Status is required.';
    if (!form.description.trim()) next.description = 'Description is required.';

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
        const startISO = toISODateFromYMD(form.start_date);
        const endISO = toISODateFromYMD(form.end_date);
        if (!startISO || !endISO) throw new Error('Invalid dates');

        const payload: Partial<Permit> = {
          permit_number: form.permit_number.trim(),
          type: form.type as PermitType,
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status as PermitStatus,
          start_date: startISO,
          end_date: endISO,
          location: '',
          requested_by: form.issued_by.trim(),
          approved_by: null,
          hazards: [],
          precautions: form.notes.trim()
            ? form.notes
                .trim()
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        } as any;

        let error: any = null;
        if (mode === 'edit' && initialPermit?.id) {
          const { error: updateError } = await supabase.from('permits').update(payload).eq('id', initialPermit.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase.from('permits').insert(payload).select('id').single();
          error = insertError;
        }

        if (error) throw error;

        toast({
          title: mode === 'edit' ? 'Permit updated successfully' : 'Permit added successfully',
          description: payload.title,
        });

        queryClient.invalidateQueries({ queryKey: ['permits'] });
        onSubmitted?.();
        onOpenChange(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit permit.';
        toast({
          variant: 'destructive',
          title: 'Could not save permit',
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
      initialPermit?.id,
      supabase,
      toast,
      queryClient,
      onSubmitted,
      onOpenChange,
    ]
  );

  const workerOptions = workers ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Permit' : 'Add Permit'}</DialogTitle>
          <DialogDescription>Enter permit details and manage approval workflow.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="permit_number">Permit ID</Label>
              <Input
                id="permit_number"
                value={form.permit_number}
                onChange={(e) => setForm((f) => ({ ...f, permit_number: e.target.value }))}
                placeholder="e.g. P-1001"
                className={errors.permit_number ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.permit_number && <p className="text-sm text-destructive">{errors.permit_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Hot work for boiler maintenance"
                className={errors.title ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Permit Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
                <SelectTrigger className={errors.type ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder={isDepartmentsLoading ? 'Loading...' : 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <SearchCombobox
                value={form.department_id}
                onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}
                placeholder={isDepartmentsLoading ? 'Loading...' : 'Select department'}
                items={(departments ?? []).map((d) => ({
                  id: d.id,
                  label: d.name,
                }))}
                disabled={isDepartmentsLoading}
              />
              {errors.department_id && <p className="text-sm text-destructive">{errors.department_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Worker</Label>
              <SearchCombobox
                value={form.worker_id}
                onValueChange={(v) => setForm((f) => ({ ...f, worker_id: v }))}
                placeholder={isWorkersLoading ? 'Loading...' : 'Select worker'}
                items={(workerOptions ?? []).map((w) => ({
                  id: w.id,
                  label: w.full_name,
                  secondaryLabel: w.employee_id,
                  searchText: `${w.full_name} ${w.employee_id}`,
                }))}
                disabled={isWorkersLoading}
              />
              {errors.worker_id && <p className="text-sm text-destructive">{errors.worker_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issued_by">Issued By</Label>
              <Input
                id="issued_by"
                value={form.issued_by}
                onChange={(e) => setForm((f) => ({ ...f, issued_by: e.target.value }))}
                placeholder="e.g. Safety Officer Name"
                className={errors.issued_by ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.issued_by && <p className="text-sm text-destructive">{errors.issued_by}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className={errors.start_date ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="end_date">Expiry Date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className={errors.end_date ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the permit work, hazards, and controls."
              className={errors.description ? 'border-destructive focus-visible:ring-destructive' : undefined}
              rows={4}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes (optional)."
              rows={3}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : mode === 'edit' ? 'Update Permit' : 'Add Permit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

