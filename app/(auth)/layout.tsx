import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-chart-4/10" />
        <div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-chart-4/20 blur-3xl"
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 glow-primary">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">
                SafeSphere AI
              </p>
              <p className="text-xs text-muted-foreground">
                Safety Intelligence Platform
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance">
              Enterprise safety intelligence,{' '}
              <span className="gradient-text">reimagined</span>.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Monitor your workforce, sensors, and equipment in real-time.
              Predict risks before they become incidents.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div>
                <p className="text-2xl font-bold text-primary">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime SLA</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">24/7</p>
                <p className="text-xs text-muted-foreground">Monitoring</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">SOC 2</p>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 SafeSphere AI — ET AI Hackathon
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background-secondary">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
