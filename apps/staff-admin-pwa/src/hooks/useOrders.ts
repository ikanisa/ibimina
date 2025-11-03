import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, OrdersListParams } from '@/api/orders';
import { OrderStatusUpdate } from '@/types/order';

export const useOrders = (params: OrdersListParams = {}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.list(params),
    staleTime: 30000,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: OrderStatusUpdate }) =>
      ordersApi.updateStatus(id, update),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.setQueryData(['orders', data.id], data);
    },
  });
};
