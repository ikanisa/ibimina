import { http, HttpResponse, delay } from 'msw';
import { users, orders, tickets, ticketComments } from './fixtures';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export const handlers = [
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as any;

    if (body.email === 'admin@example.com' && body.password === 'password') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        user: {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'Admin',
        },
      });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, async () => {
    await delay(200);
    return HttpResponse.json({
      accessToken: 'mock-refreshed-token',
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_BASE_URL}/users`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const query = url.searchParams.get('query') || '';

    let filteredUsers = users;
    if (query) {
      filteredUsers = users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      );
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return HttpResponse.json({
      users: filteredUsers.slice(start, end),
      total: filteredUsers.length,
      page,
      pageSize,
    });
  }),

  http.get(`${API_BASE_URL}/users/:id`, async ({ params }) => {
    await delay(200);
    const user = users.find((u) => u.id === params.id);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  http.post(`${API_BASE_URL}/users`, async ({ request }) => {
    await delay(400);
    const body = await request.json() as any;
    const newUser = {
      id: `${users.length + 1}`,
      ...body,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/users/:id`, async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as any;
    const index = users.findIndex((u) => u.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    users[index] = { ...users[index], ...body };
    return HttpResponse.json(users[index]);
  }),

  http.patch(`${API_BASE_URL}/users/:id/status`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as any;
    const index = users.findIndex((u) => u.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    users[index].status = body.status;
    return HttpResponse.json(users[index]);
  }),

  http.get(`${API_BASE_URL}/orders`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return HttpResponse.json({
      orders: orders.slice(start, end),
      total: orders.length,
      page,
      pageSize,
    });
  }),

  http.get(`${API_BASE_URL}/orders/:id`, async ({ params }) => {
    await delay(200);
    const order = orders.find((o) => o.id === params.id);
    if (!order) {
      return HttpResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    return HttpResponse.json(order);
  }),

  http.patch(`${API_BASE_URL}/orders/:id/status`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as any;
    const index = orders.findIndex((o) => o.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    orders[index] = { ...orders[index], status: body.status, updatedAt: new Date().toISOString() };
    return HttpResponse.json(orders[index]);
  }),

  http.get(`${API_BASE_URL}/tickets`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return HttpResponse.json({
      tickets: tickets.slice(start, end),
      total: tickets.length,
      page,
      pageSize,
    });
  }),

  http.get(`${API_BASE_URL}/tickets/:id`, async ({ params }) => {
    await delay(200);
    const ticket = tickets.find((t) => t.id === params.id);
    if (!ticket) {
      return HttpResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }
    const comments = ticketComments.filter((c) => c.ticketId === params.id);
    return HttpResponse.json({ ticket, comments });
  }),

  http.post(`${API_BASE_URL}/tickets/:id/comments`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as any;
    const newComment = {
      id: `${ticketComments.length + 1}`,
      ticketId: params.id as string,
      authorId: '1',
      authorName: 'Admin User',
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    ticketComments.push(newComment);
    return HttpResponse.json(newComment, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/tickets/:id/status`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as any;
    const index = tickets.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }
    tickets[index] = { ...tickets[index], status: body.status };
    return HttpResponse.json(tickets[index]);
  }),
];
