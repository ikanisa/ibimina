import { apiClient } from './client';
import {
  Ticket,
  TicketsListResponse,
  TicketsListResponseSchema,
  TicketDetailResponse,
  TicketDetailResponseSchema,
  TicketCommentCreate,
  TicketCommentSchema,
  TicketComment,
  TicketStatusUpdate,
  TicketSchema,
} from '@/types/ticket';

export interface TicketsListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export const ticketsApi = {
  list: async (params: TicketsListParams = {}): Promise<TicketsListResponse> => {
    const { data } = await apiClient.get('/tickets', { params });
    return TicketsListResponseSchema.parse(data);
  },

  get: async (id: string): Promise<TicketDetailResponse> => {
    const { data } = await apiClient.get(`/tickets/${id}`);
    return TicketDetailResponseSchema.parse(data);
  },

  addComment: async (id: string, comment: TicketCommentCreate): Promise<TicketComment> => {
    const { data } = await apiClient.post(`/tickets/${id}/comments`, comment);
    return TicketCommentSchema.parse(data);
  },

  updateStatus: async (id: string, update: TicketStatusUpdate): Promise<Ticket> => {
    const { data } = await apiClient.patch(`/tickets/${id}/status`, update);
    return TicketSchema.parse(data);
  },
};
