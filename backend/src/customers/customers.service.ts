import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    // Kiểm tra số điện thoại đã tồn tại chưa
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Số điện thoại khách hàng đã tồn tại trên hệ thống');
    }

    return this.prisma.customer.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        gender: dto.gender,
        dob: dto.dob ? new Date(dto.dob) : null,
        notes: dto.notes,
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const whereClause = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      this.prisma.customer.count({ where: whereClause }),
      this.prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data,
    };
  }

  async findOne(id: bigint) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        // Lấy kèm lịch sử 5 cuộc hẹn gần nhất
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
          include: {
            service: { select: { name: true, price: true } },
            staff: { select: { fullName: true } },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Không tìm thấy khách hàng với ID #${id}`);
    }

    return customer;
  }

  async update(id: bigint, dto: UpdateCustomerDto) {
    await this.findOne(id); // Đảm bảo khách tồn tại

    if (dto.phone) {
      const duplicate = await this.prisma.customer.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('Số điện thoại mới đã được sử dụng bởi khách hàng khác');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        dob: dto.dob ? new Date(dto.dob) : undefined,
      },
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}