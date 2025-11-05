import { apiClient } from './client';
import {
  Order,
  OrdersListResponse,
  OrdersListResponseSchema,
  OrderSchema,
  OrderStatusUpdate,
} from '@/types/order';

export interface OrdersListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export const ordersApi = {
  list: async (params: OrdersListParams = {}): Promise<OrdersListResponse> => {
    const { data } = await apiClient.get('/orders', { params });
    return OrdersListResponseSchema.parse(data);
  },

  get: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get(`/orders/${id}`);
    return OrderSchema.parse(data);
  },

  updateStatus: async (id: string, update: OrderStatusUpdate): Promise<Order> => {
    const { data } = await apiClient.patch(`/orders/${id}/status`, update);
    return OrderSchema.parse(data);
  },
};
