import type { User } from '@/types/user';
import type { Order } from '@/types/order';
import type { Ticket, TicketComment } from '@/types/ticket';

export const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Staff',
    status: 'Active',
    createdAt: '2024-02-20T10:00:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Support',
    status: 'Suspended',
    createdAt: '2024-03-10T10:00:00Z',
  },
];

export const orders: Order[] = [
  {
    id: '1',
    number: 'ORD-001',
    customerName: 'Alice Brown',
    total: { amount: 129.99, currency: 'USD' },
    status: 'Pending',
    updatedAt: '2024-03-15T14:30:00Z',
  },
  {
    id: '2',
    number: 'ORD-002',
    customerName: 'Charlie Davis',
    total: { amount: 249.50, currency: 'USD' },
    status: 'Approved',
    updatedAt: '2024-03-14T11:20:00Z',
  },
  {
    id: '3',
    number: 'ORD-003',
    customerName: 'Diana Wilson',
    total: { amount: 89.99, currency: 'USD' },
    status: 'Shipped',
    updatedAt: '2024-03-13T09:15:00Z',
  },
];

export const tickets: Ticket[] = [
  {
    id: '1',
    subject: 'Login issue',
    description: 'Unable to login with my credentials',
    status: 'Open',
    assigneeId: '1',
    createdAt: '2024-03-15T08:00:00Z',
  },
  {
    id: '2',
    subject: 'Payment not processing',
    description: 'Payment fails at checkout',
    status: 'Pending',
    assigneeId: '2',
    createdAt: '2024-03-14T15:30:00Z',
  },
  {
    id: '3',
    subject: 'Feature request',
    description: 'Would like to see dark mode',
    status: 'Closed',
    assigneeId: null,
    createdAt: '2024-03-10T12:00:00Z',
  },
];

export const ticketComments: TicketComment[] = [
  {
    id: '1',
    ticketId: '1',
    authorId: '1',
    authorName: 'John Doe',
    content: 'Investigating the issue',
    createdAt: '2024-03-15T09:00:00Z',
  },
  {
    id: '2',
    ticketId: '2',
    authorId: '2',
    authorName: 'Jane Smith',
    content: 'Escalated to payment team',
    createdAt: '2024-03-14T16:00:00Z',
  },
];
