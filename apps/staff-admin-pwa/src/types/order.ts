import { z } from 'zod';

export const OrderStatusSchema = z.enum(['Pending', 'Approved', 'Rejected', 'Shipped']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string().length(3),
});

export type Money = z.infer<typeof MoneySchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  number: z.string().min(1),
  customerName: z.string().min(1),
  total: MoneySchema,
  status: OrderStatusSchema,
  updatedAt: z.string().datetime(),
});

export type Order = z.infer<typeof OrderSchema>;

export const OrdersListResponseSchema = z.object({
  orders: z.array(OrderSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type OrdersListResponse = z.infer<typeof OrdersListResponseSchema>;

export const OrderStatusUpdateSchema = z.object({
  status: OrderStatusSchema,
});

export type OrderStatusUpdate = z.infer<typeof OrderStatusUpdateSchema>;
