'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Cpu, Battery, Gauge, Clock, Calendar, Activity, History } from 'lucide-react';

import type { Machine, Sensor } from '@/types/database';

type SensorDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensor: (Sensor & { assigned_machine?: Machine | null }) | null;
  machines?: Machine[];
  onEdit?: () => void;
  onViewHistory?: () => void;
};

function toDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export default function SensorDetailsDrawer({
  open,
  onOpenChange,
  sensor,
  machines,
  onEdit,
  onViewHistory,
}: SensorDetailsDrawerProps) {
  const machineMap = React.useMemo(() => {
    const m = new Map<string, Machine>();
    (machines ?? []).forEach((mac) => m.set(mac.id, mac));
    return m;
  }, [machines]);

  const assignedMachine = sensor?.assigned_machine_id
    ? machineMap.get(sensor.assigned_machine_id) ?? null
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">{sensor?.sensor_name ?? '—'}</p>
              <p className="text-xs text-muted-foreground font-mono">{sensor?.sensor_id ?? ''}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {!sensor ? (
          <div className="p-6 space-y-6" />
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={sensor.status} />
              <Badge variant="outline" className="text-xs font-medium">
                <Activity className="mr-1 h-3 w-3" />
                {sensor.sensor_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Battery className="mr-1 h-3 w-3" />
                {sensor.battery_percent}%
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Gauge className="mr-1 h-3 w-3" />
                {sensor.health_score}%
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overview</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Sensor Type</p>
                  <p className="text-sm font-medium">{sensor.sensor_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {sensor.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Machine</p>
                  <p className="text-sm font-medium">{assignedMachine ? assignedMachine.name : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Installation Date</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {toDate(sensor.installation_date)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Last Reading</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    {sensor.last_reading ?? '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {sensor.last_updated ? new Date(sensor.last_updated).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Actions</h4>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    onEdit?.();
                  }}
                  disabled={!onEdit}
                >
                  Edit Sensor
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onViewHistory?.();
                  }}
                  disabled={!onViewHistory}
                >
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

