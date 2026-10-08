import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto.js';

// Cần cài đặt nếu chưa có: npm install @nestjs/mapped-types
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}