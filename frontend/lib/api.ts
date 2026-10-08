import {
  DashboardStats,
  AppointmentItem,
  Customer,
  CustomerListResponse,
  ServiceItem,
  StaffItem,
} from '@/type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Dashboard
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/dashboard/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Không thể tải dữ liệu dashboard');
  return res.json();
}

// Appointments
export async function fetchAppointments(params?: {
  status?: string;
  staffId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<AppointmentItem[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.staffId) query.append('staffId', params.staffId);
  if (params?.fromDate) query.append('fromDate', params.fromDate);
  if (params?.toDate) query.append('toDate', params.toDate);

  const url = `${API_URL}/appointments${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Không thể tải danh sách lịch hẹn');
  return res.json();
}

export async function fetchAppointmentById(id: string): Promise<AppointmentItem> {
  const res = await fetch(`${API_URL}/appointments/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Không thể tải thông tin lịch hẹn #${id}`);
  return res.json();
}

export async function createAppointment(data: {
  customerId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
}): Promise<AppointmentItem> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi tạo lịch hẹn');
  }
  return res.json();
}

export async function updateAppointmentStatus(
  id: string,
  status: string,
  note?: string,
): Promise<AppointmentItem> {
  const res = await fetch(`${API_URL}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi cập nhật trạng thái');
  }
  return res.json();
}

export async function deleteAppointment(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi xóa lịch hẹn');
  }
}

// Meta for appointment booking
export async function fetchServices(): Promise<ServiceItem[]> {
  const res = await fetch(`${API_URL}/appointments/meta/services`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Không thể tải danh sách dịch vụ');
  return res.json();
}

export async function fetchStaff(): Promise<StaffItem[]> {
  const res = await fetch(`${API_URL}/appointments/meta/staff`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Không thể tải danh sách nhân viên');
  return res.json();
}

// Customers
export async function fetchCustomers(
  page: number = 1,
  limit: number = 10,
  search?: string,
): Promise<CustomerListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) query.append('search', search);

  const res = await fetch(`${API_URL}/customers?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Không thể tải danh sách khách hàng');
  return res.json();
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Không thể tìm thấy khách hàng #${id}`);
  return res.json();
}

export async function createCustomer(data: {
  fullName: string;
  phone: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dob?: string;
  notes?: string;
}): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi tạo mới khách hàng');
  }
  return res.json();
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    fullName: string;
    phone: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dob?: string;
    notes?: string;
  }>,
): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi cập nhật thông tin khách hàng');
  }
  return res.json();
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi xóa khách hàng');
  }
}