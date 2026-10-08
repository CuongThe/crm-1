import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(query: DashboardQueryDto) {
    // Thiết lập mốc thời gian mặc định: nếu không truyền thì lấy tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const fromDate = query.fromDate ? new Date(query.fromDate) : startOfMonth;
    const toDate = query.toDate ? new Date(query.toDate) : endOfMonth;

    // Thiết lập mốc đầu ngày và cuối ngày hôm nay
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Chạy song song các truy vấn aggregation độc lập để giảm thiểu thời gian chờ (Latency)
    const [
      revenueAggregate,
      todayAppointmentsCount,
      newCustomersCount,
      statusDistribution,
      serviceRanking,
    ] = await Promise.all([
      // 1. Tổng doanh thu thực thu từ các lịch hẹn COMPLETED trong kỳ
      this.prisma.appointment.aggregate({
        _sum: { price: true },
        where: {
          status: AppointmentStatus.COMPLETED,
          startTime: { gte: fromDate, lte: toDate },
        },
      }),

      // 2. Tổng số lịch hẹn phát sinh trong ngày hôm nay
      this.prisma.appointment.count({
        where: {
          startTime: { gte: startOfToday, lte: endOfToday },
        },
      }),

      // 3. Số lượng khách hàng mới đăng ký trong kỳ
      this.prisma.customer.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
      }),

      // 4. Phân bổ số lượng lịch hẹn theo trạng thái (tận dụng index idx_status_start_time)
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
        where: {
          startTime: { gte: fromDate, lte: toDate },
        },
      }),

      // 5. Thống kê số lượng đặt theo từng dịch vụ
      this.prisma.appointment.groupBy({
        by: ['serviceId'],
        _count: { id: true },
        _sum: { price: true },
        where: {
          startTime: { gte: fromDate, lte: toDate },
          status: { not: AppointmentStatus.CANCELED },
        },
        orderBy: {
          _count: { id: 'desc' },
        },
        take: 5,
      }),
    ]);

    // Lấy tên các dịch vụ trong bảng xếp hạng
    const serviceIds = serviceRanking.map((item) => item.serviceId);
    const serviceDetails = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const serviceNameMap = new Map(serviceDetails.map((s) => [s.id.toString(), s.name]));

    return {
      range: {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      kpi: {
        totalRevenue: revenueAggregate._sum.price || 0,
        todayAppointments: todayAppointmentsCount,
        newCustomers: newCustomersCount,
      },
      statusDistribution: statusDistribution.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      topServices: serviceRanking.map((item) => ({
        serviceId: item.serviceId.toString(),
        serviceName: serviceNameMap.get(item.serviceId.toString()) || 'Unknown',
        bookingCount: item._count.id,
        totalRevenue: item._sum.price || 0,
      })),
    };
  }
}