import { z } from 'zod';

export const TicketStatusSchema = z.enum(['Open', 'Pending', 'Closed']);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().min(1),
  description: z.string(),
  status: TicketStatusSchema,
  assigneeId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const TicketCommentSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export type TicketComment = z.infer<typeof TicketCommentSchema>;

export const TicketsListResponseSchema = z.object({
  tickets: z.array(TicketSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type TicketsListResponse = z.infer<typeof TicketsListResponseSchema>;

export const TicketDetailResponseSchema = z.object({
  ticket: TicketSchema,
  comments: z.array(TicketCommentSchema),
});

export type TicketDetailResponse = z.infer<typeof TicketDetailResponseSchema>;

export const TicketCommentCreateSchema = z.object({
  content: z.string().min(1),
});

export type TicketCommentCreate = z.infer<typeof TicketCommentCreateSchema>;

export const TicketStatusUpdateSchema = z.object({
  status: TicketStatusSchema,
  assigneeId: z.string().uuid().nullable().optional(),
});

export type TicketStatusUpdate = z.infer<typeof TicketStatusUpdateSchema>;
