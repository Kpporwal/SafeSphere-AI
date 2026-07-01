'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ClipboardList, FileText, MapPin, Users } from 'lucide-react';
import type { Department, Permit, Worker } from '@/types/database';

type PermitDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permit: Permit | null;
  departments?: Department[];
  workers?: Worker[];
  onEdit?: () => void;
};

function toDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export default function PermitDetailsDrawer({
  open,
  onOpenChange,
  permit,
  departments,
  workers,
  onEdit,
}: PermitDetailsDrawerProps) {
  const deptMap = React.useMemo(() => {
    const m = new Map<string, string>();
    (departments ?? []).forEach((d) => m.set(d.id, d.name));
    return m;
  }, [departments]);

  const workerMap = React.useMemo(() => {
    const m = new Map<string, Worker>();
    (workers ?? []).forEach((w) => m.set(w.id, w));
    return m;
  }, [workers]);

  if (!permit) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" />
      </Sheet>
    );
  }

  const assignedWorker = (permit as any).worker_id ? workerMap.get((permit as any).worker_id) ?? null : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">{permit.title}</p>
              <p className="text-xs text-muted-foreground font-mono">{permit.permit_number}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={permit.status} />
            <Badge variant="outline" className="text-xs">
              <FileText className="mr-1 h-3 w-3" />
              {permit.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <MapPin className="mr-1 h-3 w-3" />
              {permit.location}
            </Badge>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overview</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{(permit as any).department_id ? deptMap.get((permit as any).department_id) ?? '—' : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Worker</p>
                <p className="text-sm font-medium">{assignedWorker ? assignedWorker.full_name : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Issued By</p>
                <p className="text-sm font-medium">{permit.requested_by}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {toDate(permit.start_date)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p className="text-sm font-medium">{toDate(permit.end_date)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{permit.description}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hazards & Precautions</h4>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Hazards</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(permit.hazards ?? []).length ? (
                    (permit.hazards ?? []).map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {h}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Precautions</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(permit.precautions ?? []).length ? (
                    (permit.precautions ?? []).map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {p}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {onEdit && (
            <div className="pt-2">
              <Button className="w-full" size="sm" onClick={onEdit}>
                Edit Permit
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

