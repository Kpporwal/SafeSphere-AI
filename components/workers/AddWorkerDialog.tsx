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
import { Checkbox } from '@/components/ui/checkbox';

import type {
  Worker,
  Department,
  WorkerStatus,
  WorkerShift,
  PPEStatus,
} from '@/types/database';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type AddWorkerForm = {
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: string;
  position: string;
  shift: WorkerShift | '';
  status: WorkerStatus | '';

  location: string;
  safety_training_expiry: string; // yyyy-mm-dd (local)
  ppe_items: string[];
};

type AddWorkerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizePhone(phone: string) {
  // Keep it permissive: allow + and digits, strip spaces/dashes.
  return phone.replace(/[\s-]/g, '');
}

function toISODateFromYMD(ymd: string) {
  // ymd = yyyy-mm-dd
  // Convert to ISO date (UTC midnight) string.
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const PPE_OPTIONS = [
  'Helmet',
  'Gloves',
  'Safety Shoes',
  'Safety Vest',
  'Goggles',
] as const;

export default function AddWorkerDialog({ open, onOpenChange }: AddWorkerDialogProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: departments, isLoading: isDepartmentsLoading } = useSupabaseQuery<Department>({
    table: 'departments',
    limit: 200,
  });

  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState<AddWorkerForm>({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    position: '',
    shift: '',
    status: '',

    location: '',
    safety_training_expiry: '',
    ppe_items: [],
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const reset = React.useCallback(() => {
    setForm({
      employee_id: '',
      full_name: '',
      email: '',
      phone: '',
      department_id: '',
      position: '',
      shift: '',
      status: '',

      location: '',
      safety_training_expiry: '',
      ppe_items: [],
    });
    setErrors({});
    setSubmitting(false);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const validate = React.useCallback(() => {
    const nextErrors: Record<string, string> = {};

    if (!form.employee_id.trim()) nextErrors.employee_id = 'Employee ID is required.';
    if (!form.full_name.trim()) nextErrors.full_name = 'Full Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.';

    if (!form.phone.trim()) nextErrors.phone = 'Phone is required.';
    else {
      const normalized = normalizePhone(form.phone);
      if (!/^\+?[0-9]{7,15}$/.test(normalized)) nextErrors.phone = 'Enter a valid phone number.';
    }

    if (!form.department_id) nextErrors.department_id = 'Department is required.';
    if (!form.position.trim()) nextErrors.position = 'Position is required.';
    if (!form.shift) nextErrors.shift = 'Shift is required.';
    if (!form.status) nextErrors.status = 'Status is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form]);

  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;

      if (!validate()) return;

      setSubmitting(true);
      try {
        const safetyExpiryISO = toISODateFromYMD(form.safety_training_expiry);

        const payload: Partial<Worker> & {
          ppe_status: PPEStatus;
          ppe_items: string[];
          hire_date: string;
        } = {
          employee_id: form.employee_id.trim(),
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: normalizePhone(form.phone.trim()),
          department_id: form.department_id,
          position: form.position.trim(),
          status: form.status as WorkerStatus,
          shift: form.shift as WorkerShift,
          hire_date: new Date().toISOString(),

          location: form.location.trim() ? form.location.trim() : null,
          safety_training_expiry: safetyExpiryISO,

          ppe_status: 'compliant',
          ppe_items: form.ppe_items,
        };

        const { error } = await supabase
          .from('workers')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;

        toast({ title: 'Worker added successfully', description: payload.full_name });

        // Refresh workers list
        queryClient.invalidateQueries({ queryKey: ['workers'], exact: false });

        // Close dialog
        onOpenChange(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add worker.';
        toast({
          variant: 'destructive',
          title: 'Could not add worker',
          description: message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [form, onOpenChange, queryClient, supabase, submitting, toast, validate]
  );

  const togglePpeItem = React.useCallback((item: string, checked: boolean) => {
    setForm((f) => {
      if (checked) {
        if (f.ppe_items.includes(item)) return f;
        return { ...f, ppe_items: [...f.ppe_items, item] };
      }
      return { ...f, ppe_items: f.ppe_items.filter((x) => x !== item) };
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Worker</DialogTitle>
          <DialogDescription>Enter worker details to add them to the workforce.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={form.employee_id}
                onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
                placeholder="e.g. W-1001"
                className={errors.employee_id ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.employee_id && <p className="text-sm text-destructive">{errors.employee_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. John Doe"
                className={errors.full_name ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@company.com"
                className={errors.email ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +15551234567"
                className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={form.department_id}
                onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}
              >
                <SelectTrigger
                  className={errors.department_id ? 'border-destructive focus:ring-destructive' : undefined}
                >
                  <SelectValue placeholder={isDepartmentsLoading ? 'Loading...' : 'Select a department'} />
                </SelectTrigger>
                <SelectContent>
                  {(departments ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department_id && <p className="text-sm text-destructive">{errors.department_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="e.g. Safety Technician"
                className={errors.position ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
            </div>

            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={form.shift} onValueChange={(v) => setForm((f) => ({ ...f, shift: v as any }))}>
                <SelectTrigger className={errors.shift ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="rotating">Rotating</SelectItem>
                </SelectContent>
              </Select>
              {errors.shift && <p className="text-sm text-destructive">{errors.shift}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as any }))}
              >
                <SelectTrigger className={errors.status ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
            </div>
          </div>

          {/* Newly added fields (do not remove existing functionality) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Warehouse A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="safety_training_expiry">Safety Training Expiry</Label>
              <Input
                id="safety_training_expiry"
                type="date"
                value={form.safety_training_expiry}
                onChange={(e) => setForm((f) => ({ ...f, safety_training_expiry: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>PPE Items</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PPE_OPTIONS.map((item) => {
                const checked = form.ppe_items.includes(item);
                return (
                  <label
                    key={item}
                    className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => togglePpeItem(item, v === true)}
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

