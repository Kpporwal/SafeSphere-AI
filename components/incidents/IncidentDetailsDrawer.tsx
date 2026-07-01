 'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react';

import type { Department, Incident, Machine, Sensor, Worker, Profile } from '@/types/database';

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type IncidentDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: Incident | null;
  profiles?: Profile[];
  departments?: Department[];
  workers?: Worker[];
  machines?: Machine[];
  sensors?: Sensor[];
  onEdit?: () => void;
  onDelete?: () => void;
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function IncidentDetailsDrawer({
  open,
  onOpenChange,
  incident,
  profiles,
  onEdit,
}: IncidentDetailsDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = React.useMemo(() => createClient(), []);

  const profileMap = React.useMemo(() => {
    const m = new Map<string, string>();
    (profiles ?? []).forEach((p) => m.set(p.id, p.full_name));
    return m;
  }, [profiles]);

  const onDelete = React.useCallback(async () => {
    if (!incident) return;
    try {
      const { error } = await supabase.from('incidents').delete().eq('id', incident.id);
      if (error) throw error;

      toast({ title: 'Incident deleted', description: incident.title });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete incident.';
      toast({ variant: 'destructive', title: 'Could not delete incident', description: message });
    }
  }, [incident, onOpenChange, queryClient, supabase, toast]);

  if (!incident) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">{incident.title}</p>
              <p className="text-xs text-muted-foreground font-mono">{incident.incident_number}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={incident.severity} />
            <StatusBadge status={incident.status} />
            {(incident as any).category ? (
              <Badge variant="outline" className="text-xs">
                {(incident as any).category}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overview</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {incident.location}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Occurred</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(incident.occurred_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reported By</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {incident.reported_by ? profileMap.get(incident.reported_by) ?? 'Unknown' : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned Officer</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {incident.assigned_to ? profileMap.get(incident.assigned_to) ?? 'Unknown' : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Injuries</p>
                <p className={`text-sm font-medium ${incident.injuries > 0 ? 'text-destructive' : ''}`}>{incident.injuries}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Property Damage</p>
                <p className="text-sm font-medium">${Number(incident.property_damage ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{incident.description}</p>
          </div>

          {incident.root_cause ? (
            <div className="space-y-3">
              <Separator />
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" /> Root Cause
              </h4>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{incident.root_cause}</p>
            </div>
          ) : null}

          {incident.corrective_actions && incident.corrective_actions.length > 0 ? (
            <div className="space-y-3">
              <Separator />
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Corrective Actions
              </h4>
              <div className="space-y-2">
                {incident.corrective_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <p className="text-sm">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Separator />

          <div className="flex gap-2">
            <Button className="flex-1" size="sm" onClick={onEdit} disabled={!onEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Incident
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete incident?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {incident.title}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

