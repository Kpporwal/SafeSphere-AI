export type UserRole = 'admin' | 'safety_officer' | 'supervisor';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type IncidentSeverity = 'minor' | 'moderate' | 'serious' | 'critical';
export type IncidentStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'closed';
export type PermitStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'active';
export type PermitType =
  | 'hot_work'
  | 'confined_space'
  | 'electrical'
  | 'height_work'
  | 'excavation'
  | 'lifting'
  | 'chemical';
export type MachineStatus = 'operational' | 'maintenance' | 'offline' | 'fault';
export type SensorType =
  | 'gas'
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'noise'
  | 'vibration'
  | 'air_quality'
  | 'wearable';
export type SensorStatus = 'online' | 'offline' | 'warning' | 'critical';
export type WorkerStatus = 'active' | 'off_duty' | 'on_leave' | 'inactive';
export type WorkerShift = 'day' | 'night' | 'rotating';
export type PPEStatus = 'compliant' | 'non_compliant' | 'expired' | 'partial';
export type SensorTypeExtended =
  | 'gas'
  | 'temperature'
  | 'pressure'
  | 'humidity'
  | 'smoke'
  | 'voltage'
  | 'battery'
  | 'noise'
  | 'vibration'
  | 'air_quality'
  | 'wearable';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          department_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          department_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          manager_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          manager_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      workers: {
        Row: {
          id: string;
          employee_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          department_id: string | null;
          position: string;
          status: WorkerStatus;
          shift: WorkerShift;
          ppe_status: PPEStatus;
          ppe_items: string[];
          hire_date: string;
          safety_training_expiry: string | null;
          avatar_url: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          department_id?: string | null;
          position: string;
          status?: WorkerStatus;
          shift?: WorkerShift;
          ppe_status?: PPEStatus;
          ppe_items?: string[];
          hire_date: string;
          safety_training_expiry?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workers']['Insert']>;
      };
      machines: {
        Row: {
          id: string;
          name: string;
          code: string;
          type: string;
          location: string;
          department_id: string | null;
          status: MachineStatus;
          health_score: number;
          manufacturer: string | null;
          model: string | null;
          install_date: string;
          last_maintenance: string | null;
          next_maintenance: string | null;
          operating_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          type: string;
          location: string;
          department_id?: string | null;
          status?: MachineStatus;
          health_score?: number;
          manufacturer?: string | null;
          model?: string | null;
          install_date: string;
          last_maintenance?: string | null;
          next_maintenance?: string | null;
          operating_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['machines']['Insert']>;
      };
      sensor_data: {
        Row: {
          id: string;
          sensor_id: string;
          machine_id: string | null;
          reading_value: number;
          unit: string;
          status: SensorStatus;
          sensor_type: SensorTypeExtended;
          min_threshold: number | null;
          max_threshold: number | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sensor_id: string;
          machine_id?: string | null;
          reading_value: number;
          unit: string;
          status?: SensorStatus;
          sensor_type?: SensorTypeExtended;
          min_threshold?: number | null;
          max_threshold?: number | null;
          recorded_at: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sensor_data']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          title: string;
          description: string;
          severity: AlertSeverity;
          status: AlertStatus;
          sensor_id: string | null;
          machine_id: string | null;
          worker_id: string | null;
          location: string | null;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          severity: AlertSeverity;
          status?: AlertStatus;
          sensor_id?: string | null;
          machine_id?: string | null;
          worker_id?: string | null;
          location?: string | null;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      permits: {
        Row: {
          id: string;
          permit_number: string;
          type: PermitType;
          title: string;
          description: string;
          status: PermitStatus;
          location: string;
          requested_by: string;
          approved_by: string | null;
          start_date: string;
          end_date: string;
          hazards: string[];
          precautions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          permit_number: string;
          type: PermitType;
          title: string;
          description: string;
          status?: PermitStatus;
          location: string;
          requested_by: string;
          approved_by?: string | null;
          start_date: string;
          end_date: string;
          hazards?: string[];
          precautions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['permits']['Insert']>;
      };
      incidents: {
        Row: {
          id: string;
          incident_number: string;
          title: string;
          description: string;
          severity: IncidentSeverity;
          status: IncidentStatus;
          location: string;
          reported_by: string;
          assigned_to: string | null;
          occurred_at: string;
          resolved_at: string | null;
          root_cause: string | null;
          corrective_actions: string[];
          injuries: number;
          property_damage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          incident_number: string;
          title: string;
          description: string;
          severity: IncidentSeverity;
          status?: IncidentStatus;
          location: string;
          reported_by: string;
          assigned_to?: string | null;
          occurred_at: string;
          resolved_at?: string | null;
          root_cause?: string | null;
          corrective_actions?: string[];
          injuries?: number;
          property_damage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['incidents']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          title: string;
          type: string;
          status: 'draft' | 'scheduled' | 'completed' | 'failed';
          author_id: string;
          period_start: string;
          period_end: string;
          summary: string | null;
          data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: string;
          status?: 'draft' | 'scheduled' | 'completed' | 'failed';
          author_id: string;
          period_start: string;
          period_end: string;
          summary?: string | null;
          data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      alert_severity: AlertSeverity;
      alert_status: AlertStatus;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
      permit_status: PermitStatus;
      permit_type: PermitType;
      machine_status: MachineStatus;
      sensor_type: SensorType;
      sensor_status: SensorStatus;
      worker_status: WorkerStatus;
      worker_shift: WorkerShift;
      ppe_status: PPEStatus;
      sensor_type_extended: SensorTypeExtended;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Worker = Database['public']['Tables']['workers']['Row'];
export type Machine = Database['public']['Tables']['machines']['Row'];
export type SensorReading = Database['public']['Tables']['sensor_data']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type Permit = Database['public']['Tables']['permits']['Row'];
export type Incident = Database['public']['Tables']['incidents']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
