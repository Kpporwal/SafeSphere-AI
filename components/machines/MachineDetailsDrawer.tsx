'use client';

import * as React from 'react';
import { Cpu, Heart, MapPin, Wrench, Calendar } from 'lucide-react';

import type { Department, Machine } from '@/types/database';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';

type MachineDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  departments?: Department[];
  onEdit?: () => void;
};

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  if (score >= 40) return 'text-primary';
  return 'text-destructive';
}

export default function MachineDetailsDrawer({
  open,
  onOpenChange,
  machine,
  departments,
  onEdit,
}: MachineDetailsDrawerProps) {
  const deptMap = React.useMemo(() => {
    const m = new Map<string, string>();
    departments?.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [departments]);

  if (!machine) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" />
      </Sheet>
    );
  }

  const score = machine.health_score ?? 85;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">{machine.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{machine.code}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={machine.status} />
            <Badge variant="outline" className={`text-xs font-medium ${getHealthColor(score)} border-border/50`}>
              <Heart className={`h-3 w-3 ${getHealthColor(score)}`} />
              <span className="ml-1">{score}%</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Wrench className="mr-1 h-3 w-3" />
              Maintenance
            </Badge>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Overview
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium">{machine.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {machine.location}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{machine.department_id ? deptMap.get(machine.department_id) ?? '—' : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operating Hours</p>
                <p className="text-sm font-medium">{machine.operating_hours.toLocaleString()}h</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Maintenance Schedule
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Install Date</p>
                <p className="text-sm font-medium">{new Date(machine.install_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Maintenance</p>
                <p className="text-sm font-medium">{machine.last_maintenance ? new Date(machine.last_maintenance).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Maintenance</p>
                <p className="text-sm font-medium">{machine.next_maintenance ? new Date(machine.next_maintenance).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="text-sm font-medium">{machine.model ?? '—'}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">Manufacturer</p>
              <p className="text-sm font-medium">{machine.manufacturer ?? '—'}</p>
            </div>
          </div>

          {onEdit && (
            <div className="pt-2">
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-sm font-medium bg-primary/10 hover:bg-primary/15 border border-border/50 text-foreground transition-colors"
                onClick={onEdit}
              >
                Edit Machine
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

