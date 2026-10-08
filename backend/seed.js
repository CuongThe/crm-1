import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './dist/generated/prisma/client.js';

const adapter = new PrismaMariaDb('mysql://root:1@localhost:3306/crm_db');
const prisma = new PrismaClient({ adapter });

async function seed() {
  await prisma.$connect();
  console.log('Seeding initial data...');

  // 1. Staff Users
  const staff1 = await prisma.user.upsert({
    where: { email: 'mai.nguyen@crm.local' },
    update: {},
    create: {
      email: 'mai.nguyen@crm.local',
      passwordHash: 'dummy_hash',
      fullName: 'Nguyễn Thị Mai',
      phone: '0987654321',
      role: 'STAFF',
      isActive: true,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'hung.tran@crm.local' },
    update: {},
    create: {
      email: 'hung.tran@crm.local',
      passwordHash: 'dummy_hash',
      fullName: 'Trần Văn Hùng',
      phone: '0912345678',
      role: 'STAFF',
      isActive: true,
    },
  });

  const staff3 = await prisma.user.upsert({
    where: { email: 'trang.le@crm.local' },
    update: {},
    create: {
      email: 'trang.le@crm.local',
      passwordHash: 'dummy_hash',
      fullName: 'Lê Thu Trang',
      phone: '0978123456',
      role: 'STAFF',
      isActive: true,
    },
  });

  // 2. Services
  const servicesData = [
    { name: 'Cắt tóc & Tạo kiểu thời trang', description: 'Tư vấn dáng tóc, cắt và sấy tạo kiểu chuẩn salon', price: 150000, durationMinutes: 45 },
    { name: 'Chăm sóc da mặt chuyên sâu', description: 'Làm sạch sâu, hút bã nhờn, điện di tinh chất collagen', price: 350000, durationMinutes: 60 },
    { name: 'Gội đầu dưỡng sinh thảo dược', description: 'Massage bấm huyệt cổ vai gáy và gội đầu thảo dược tự nhiên', price: 120000, durationMinutes: 45 },
    { name: 'Massage trị liệu vai gáy', description: 'Trị liệu căng cơ, giải tỏa đau mỏi vai gáy', price: 280000, durationMinutes: 60 },
    { name: 'Phục hồi tóc Keratin cao cấp', description: 'Phục hồi tóc khô xơ chẻ ngọn bóng mượt', price: 450000, durationMinutes: 90 },
  ];

  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({
        data: {
          name: s.name,
          description: s.description,
          price: s.price,
          durationMinutes: s.durationMinutes,
          isActive: true,
        },
      });
    }
  }

  // 3. Customers
  const cust1 = await prisma.customer.upsert({
    where: { phone: '0901234567' },
    update: {},
    create: {
      fullName: 'Phạm Thu Hà',
      phone: '0901234567',
      email: 'ha.pham@gmail.com',
      gender: 'FEMALE',
      notes: 'Khách hàng thích dịch vụ chăm sóc da nhẹ nhàng',
    },
  });

  const cust2 = await prisma.customer.upsert({
    where: { phone: '0934567890' },
    update: {},
    create: {
      fullName: 'Hoàng Minh Đức',
      phone: '0934567890',
      email: 'duc.hoang@gmail.com',
      gender: 'MALE',
      notes: 'Khách quen, hay cắt tóc cuối tuần',
    },
  });

  const cust3 = await prisma.customer.upsert({
    where: { phone: '0988889999' },
    update: {},
    create: {
      fullName: 'Đặng Ngọc Ánh',
      phone: '0988889999',
      email: 'anh.dang@gmail.com',
      gender: 'FEMALE',
      notes: 'Quan tâm dịch vụ gội đầu dưỡng sinh',
    },
  });

  console.log('Seed completed successfully!');
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
