'use client';

import * as React from 'react';
import { Settings, User, Bell, Shield, Palette, Save, Building2, Factory, Users, KeyRound, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { toast } from 'sonner';
import type { UserRole, Profile, Department } from '@/types/database';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  safety_officer: 'Safety Officer',
  supervisor: 'Supervisor',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  safety_officer: 'bg-primary/10 text-primary border-primary/20',
  supervisor: 'bg-success/10 text-success border-success/20',
};

export default function SettingsPage() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const [fullName, setFullName] = React.useState(profile?.full_name ?? '');
  const [phone, setPhone] = React.useState(profile?.phone ?? '');

  // Company profile state
  const [companyName, setCompanyName] = React.useState('SafeSphere Industries Inc.');
  const [companyEmail, setCompanyEmail] = React.useState('info@safesphere.io');
  const [companyPhone, setCompanyPhone] = React.useState('+1-555-0100');
  const [companyAddress, setCompanyAddress] = React.useState('1200 Industrial Parkway, Detroit, MI 48201');

  // Factory info state
  const [factoryName, setFactoryName] = React.useState('Plant A - Main Facility');
  const [factoryLocation, setFactoryLocation] = React.useState('Detroit, MI');
  const [factorySize, setFactorySize] = React.useState('250,000 sq ft');
  const [factoryShifts, setFactoryShifts] = React.useState('3');

  // Notification state
  const [notifEmail, setNotifEmail] = React.useState(true);
  const [notifPush, setNotifPush] = React.useState(true);
  const [notifSms, setNotifSms] = React.useState(false);
  const [alertCritical, setAlertCritical] = React.useState(true);
  const [alertHigh, setAlertHigh] = React.useState(true);
  const [alertMedium, setAlertMedium] = React.useState(false);
  const [alertLow, setAlertLow] = React.useState(false);

  const { data: profiles } = useSupabaseQuery<Profile>({
    table: 'profiles',
    limit: 100,
  });
  const { data: departments } = useSupabaseQuery<Department>({
    table: 'departments',
    limit: 100,
  });

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', profile.id);
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = () => {
    toast.success('Company profile saved');
  };

  const handleSaveFactory = () => {
    toast.success('Factory information saved');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and platform preferences"
        icon={<Settings className="h-5 w-5 text-primary" />}
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="profile" className="gap-1">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-1">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="factory" className="gap-1">
            <Factory className="h-4 w-4" />
            Factory
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1">
            <KeyRound className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card className="glass-panel border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-2xl font-bold text-primary">
                  {initials}
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email ?? ''} disabled className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={profile?.role ? roleLabels[profile.role] : ''} disabled className="bg-muted/30" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Profile */}
        <TabsContent value="company">
          <Card className="glass-panel border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Manage your organization information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Contact Email</Label>
                  <Input id="companyEmail" type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Contact Phone</Label>
                  <Input id="companyPhone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Address</Label>
                  <Input id="companyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Departments</h4>
                <div className="flex flex-wrap gap-2">
                  {departments?.map((d) => (
                    <Badge key={d.id} variant="secondary" className="text-xs">
                      {d.name} ({d.code})
                    </Badge>
                  )) ?? <p className="text-sm text-muted-foreground">No departments configured</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCompany}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Company Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factory Information */}
        <TabsContent value="factory">
          <Card className="glass-panel border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Factory Information</CardTitle>
              <CardDescription>Configure your facility details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="factoryName">Factory Name</Label>
                  <Input id="factoryName" value={factoryName} onChange={(e) => setFactoryName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="factoryLocation">Location</Label>
                  <Input id="factoryLocation" value={factoryLocation} onChange={(e) => setFactoryLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="factorySize">Facility Size</Label>
                  <Input id="factorySize" value={factorySize} onChange={(e) => setFactorySize(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="factoryShifts">Number of Shifts</Label>
                  <Select value={factoryShifts} onValueChange={setFactoryShifts}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Shift</SelectItem>
                      <SelectItem value="2">2 Shifts</SelectItem>
                      <SelectItem value="3">3 Shifts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Workers</p>
                  <p className="text-2xl font-bold mt-1">100</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Machines</p>
                  <p className="text-2xl font-bold mt-1">200</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Sensors</p>
                  <p className="text-2xl font-bold mt-1">500</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveFactory}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Factory Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage platform users and their access</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profiles && profiles.length > 0 ? (
                  profiles.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                        {p.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${roleColors[p.role]}`}>
                        {roleLabels[p.role]}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No users found. Create an account to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Configure role-based access permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['admin', 'safety_officer', 'supervisor'] as UserRole[]).map((role) => (
                <div key={role} className="rounded-lg border border-border/50 bg-card/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${roleColors[role]}`}>
                        {roleLabels[role]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {profiles?.filter((p) => p.role === role).length ?? 0} users
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {role === 'admin' && 'Full access to all platform features, settings, and user management.'}
                      {role === 'safety_officer' && 'Manage incidents, permits, sensors, and generate reports. Read access to all data.'}
                      {role === 'supervisor' && 'Monitor workers, machines, and sensors. Report incidents and manage permits.'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role === 'admin' && ['All Access', 'User Management', 'Settings', 'Reports', 'Analytics'].map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-[10px]">{perm}</Badge>
                      ))}
                      {role === 'safety_officer' && ['Incidents', 'Permits', 'Sensors', 'Reports', 'Analytics'].map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-[10px]">{perm}</Badge>
                      ))}
                      {role === 'supervisor' && ['Workers', 'Machines', 'Sensors', 'Report Incidents'].map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-[10px]">{perm}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="space-y-4 max-w-2xl">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                  </div>
                  <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Browser and mobile push alerts</p>
                  </div>
                  <Switch checked={notifPush} onCheckedChange={setNotifPush} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Text messages for critical alerts</p>
                  </div>
                  <Switch checked={notifSms} onCheckedChange={setNotifSms} />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>Select which alert severities you want to be notified about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <p className="text-sm font-medium">Critical Alerts</p>
                  </div>
                  <Switch checked={alertCritical} onCheckedChange={setAlertCritical} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    <p className="text-sm font-medium">High Priority</p>
                  </div>
                  <Switch checked={alertHigh} onCheckedChange={setAlertHigh} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm font-medium">Medium Priority</p>
                  </div>
                  <Switch checked={alertMedium} onCheckedChange={setAlertMedium} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <p className="text-sm font-medium">Low Priority</p>
                  </div>
                  <Switch checked={alertLow} onCheckedChange={setAlertLow} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card className="glass-panel border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                {mounted && (
                  <Select value={theme} onValueChange={(v) => setTheme(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">Choose between dark and light mode</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
