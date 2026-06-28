'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Alert } from '@/types/database';

interface TopNavProps {
  onMenuClick: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  safety_officer: 'Safety Officer',
  supervisor: 'Supervisor',
};

export function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const fetchAlerts = React.useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setAlerts((data as Alert[]) ?? []);
    } catch {
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  React.useEffect(() => {
    if (notifOpen) fetchAlerts();
  }, [notifOpen, fetchAlerts]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const severityColor: Record<string, string> = {
    critical: 'bg-destructive',
    high: 'bg-warning',
    medium: 'bg-primary',
    low: 'bg-muted-foreground',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workers, machines, sensors..."
          className="pl-9 bg-muted/30 border-border/50"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Dark mode toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Notifications */}
        <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setNotifOpen(true)}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          </Button>
          <SheetContent className="w-full sm:max-w-md p-0">
            <SheetHeader className="px-6 py-4 border-b border-border/50">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)]">
              {loadingAlerts ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-lg bg-muted/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex gap-3 rounded-lg border border-border/50 bg-card/30 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityColor[alert.severity]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {alert.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 h-9">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                {initials}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {profile?.full_name ?? 'User'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.email}
                </p>
                {profile?.role && (
                  <Badge variant="secondary" className="text-[10px]">
                    {roleLabels[profile.role] ?? profile.role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
