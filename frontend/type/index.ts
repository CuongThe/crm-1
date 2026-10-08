export interface DashboardStats {
  range: { fromDate: string; toDate: string };
  kpi: {
    totalRevenue: string | number;
    todayAppointments: number;
    newCustomers: number;
  };
  statusDistribution: { status: string; count: number }[];
  topServices: {
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    totalRevenue: string | number;
  }[];
}

export type AppointmentStatusType = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';

export interface AppointmentItem {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatusType;
  price: string | number;
  notes?: string | null;
  customer: { id: string; fullName: string; phone: string };
  staff: { id: string; fullName: string };
  service: { id: string; name: string; durationMinutes: number };
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob?: string | null;
  notes?: string | null;
  totalSpent: string | number;
  visitCount: number;
  createdAt: string;
  updatedAt?: string;
  appointments?: AppointmentItem[];
}

export interface CustomerListResponse {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Customer[];
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  durationMinutes: number;
  isActive: boolean;
}

export interface StaffItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
}