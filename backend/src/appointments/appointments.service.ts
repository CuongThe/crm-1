import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import { QueryAppointmentDto } from './dto/query-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    const customerId = BigInt(dto.customerId);
    const staffId = BigInt(dto.staffId);
    const serviceId = BigInt(dto.serviceId);

    // 1. Kiểm tra tồn tại của khách, nhân viên, dịch vụ
    const [customer, staff, service] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: customerId } }),
      this.prisma.user.findUnique({ where: { id: staffId } }),
      this.prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!customer) throw new NotFoundException('Khách hàng không tồn tại');
    if (!staff || !staff.isActive) throw new BadRequestException('Nhân viên không tồn tại hoặc đã ngừng hoạt động');
    if (!service || !service.isActive) throw new BadRequestException('Dịch vụ không tồn tại hoặc tạm ngưng phục vụ');

    // 2. Tính toán endTime tự động dựa trên durationMinutes của dịch vụ
    const startTime = new Date(dto.startTime);
    if (isNaN(startTime.getTime())) {
      throw new BadRequestException('Thời gian bắt đầu không hợp lệ');
    }

    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    // 3. Logic chống trùng lịch (Double Booking Check)
    // Hai khoảng thời gian [A, B] và [C, D] trùng nhau khi: A < D VÀ B > C
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        staffId,
        status: { notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException(
        'Nhân viên đã có lịch hẹn khác trong khung giờ này. Vui lòng chọn giờ khác.',
      );
    }

    // 4. Lưu lịch hẹn và Snapshot lại giá dịch vụ tại thời điểm đặt
    return this.prisma.appointment.create({
      data: {
        customerId,
        staffId,
        serviceId,
        startTime,
        endTime,
        price: service.price, // Snapshot giá
        notes: dto.notes,
        status: AppointmentStatus.PENDING,
        logs: {
          create: {
            action: 'CREATED',
            note: 'Khởi tạo lịch hẹn mới',
            createdBy: staffId,
          },
        },
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        staff: { select: { fullName: true } },
        service: { select: { name: true, durationMinutes: true } },
      },
    });
  }

  async findAll(query: QueryAppointmentDto) {
    const whereClause: any = {};

    if (query.staffId) {
      whereClause.staffId = BigInt(query.staffId);
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      whereClause.startTime = {};
      if (query.fromDate) whereClause.startTime.gte = new Date(query.fromDate);
      if (query.toDate) whereClause.startTime.lte = new Date(query.toDate);
    }

    return this.prisma.appointment.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        staff: { select: { id: true, fullName: true } },
        service: { select: { id: true, name: true, durationMinutes: true } },
      },
    });
  }

  async findOne(id: bigint) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        staff: { select: { id: true, fullName: true, email: true } },
        service: true,
        logs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Không tìm thấy lịch hẹn #${id}`);
    }

    return appointment;
  }

  // 5. Cập nhật trạng thái bằng Prisma Interactive Transaction
  async updateStatus(id: bigint, dto: UpdateAppointmentStatusDto, currentUserId?: bigint) {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Lịch hẹn đã hoàn thành trước đó, không thể chỉnh sửa');
    }

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException('Lịch hẹn đã bị hủy, không thể thay đổi trạng thái');
    }

    // Bọc vào Transaction để đảm bảo tính toàn vẹn (ACID)
    return this.prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái cuộc hẹn
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
          logs: {
            create: {
              action: `STATUS_CHANGED_TO_${dto.status}`,
              note: dto.note || `Chuyển trạng thái sang ${dto.status}`,
              createdBy: currentUserId,
            },
          },
        },
      });

      // Nếu trạng thái mới là COMPLETED -> cập nhật doanh thu và số lần đến của khách
      if (dto.status === AppointmentStatus.COMPLETED) {
        await tx.customer.update({
          where: { id: appointment.customerId },
          data: {
            totalSpent: { increment: appointment.price },
            visitCount: { increment: 1 },
          },
        });
      }

      return updatedAppointment;
    });
  }

  async getServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getStaff() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.appointment.delete({
      where: { id },
    });
  }
}