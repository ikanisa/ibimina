import { z } from 'zod';

export const UserRoleSchema = z.enum(['Admin', 'Staff', 'Support']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['Active', 'Suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

export const UserCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  password: z.string().min(8),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

export const UsersListResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
