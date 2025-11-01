import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required"),
  primaryMsisdn: z.string().min(8).max(16),
  locale: z.string().default("en"),
  avatarUrl: z.string().url().nullable().optional(),
  referenceToken: z.string().min(4).nullable(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const ikiminaGroupSchema = z.object({
  id: z.string().uuid(),
  saccoId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  contributionAmount: z.number().nullable(),
  contributionCurrency: z.string().default("RWF"),
  contributionFrequency: z.enum(["weekly", "monthly", "quarterly", "flexible"]).default("monthly"),
  nextCollectionDate: z.string().nullable(),
  memberCount: z.number().nonnegative(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  lastPaidAt: z.string().nullable(),
});

export type IkiminaGroup = z.infer<typeof ikiminaGroupSchema>;

export const allocationSchema = z.object({
  id: z.string().uuid(),
  referenceToken: z.string(),
  amount: z.number(),
  currency: z.string().default("RWF"),
  status: z.enum(["pending", "posted", "failed", "reconciled"]).default("pending"),
  momoTxnId: z.string().nullable(),
  postedAt: z.string().nullable(),
  createdAt: z.string(),
  groupId: z.string().uuid().nullable(),
  groupName: z.string().nullable(),
  msisdn: z.string().nullable(),
  narration: z.string().nullable(),
});

export type Allocation = z.infer<typeof allocationSchema>;

export const joinRequestSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  createdAt: z.string(),
});

export type JoinRequest = z.infer<typeof joinRequestSchema>;

export const referenceTokenSchema = z.object({
  token: z.string(),
  groupId: z.string().uuid(),
  groupName: z.string(),
  saccoId: z.string().uuid(),
  expiresAt: z.string().nullable(),
});

export type ReferenceToken = z.infer<typeof referenceTokenSchema>;
