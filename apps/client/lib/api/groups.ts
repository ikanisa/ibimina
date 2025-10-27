/**
 * Groups (Ibimina) API utilities
 * Provides functions for fetching and managing group data
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Group data interface
 * Represents a single group (Ikimina) with metadata
 */
export interface Group {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  sacco_id: string;
  sacco_name: string | null;
  total_members: number;
  created_at: string;
  updated_at: string;
}

/**
 * Group list parameters
 * Options for filtering and pagination
 */
export interface GroupListParams {
  saccoId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch groups with metadata (Server-side)
 * Retrieves groups with member counts and SACCO information
 * 
 * @param params - Optional filters for groups list
 * @returns Array of groups with metadata
 * 
 * @example
 * ```ts
 * const groups = await getGroups({ 
 *   saccoId: 'uuid',
 *   status: 'ACTIVE',
 *   limit: 50
 * });
 * ```
 * 
 * @remarks
 * This function uses server-side Supabase client and should be called
 * from Server Components or API routes only
 */
export async function getGroups(
  params: GroupListParams = {}
): Promise<Group[]> {
  const { saccoId, status, limit = 100, offset = 0 } = params;
  
  const supabase = await createSupabaseServerClient();
  
  // Build the query for groups with SACCO information
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("ibimina")
    .select(`
      id,
      name,
      code,
      type,
      status,
      sacco_id,
      created_at,
      updated_at,
      saccos (
        name
      )
    `)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (saccoId) {
    query = query.eq("sacco_id", saccoId);
  }
  
  if (status) {
    query = query.eq("status", status);
  }

  const { data: groupsData, error: groupsError } = await query;

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
    throw new Error(`Failed to fetch groups: ${groupsError.message}`);
  }

  if (!groupsData || groupsData.length === 0) {
    return [];
  }

  // Fetch member counts for each group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupIds = groupsData.map((g: any) => g.id);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberCounts, error: memberError } = await (supabase as any)
    .from("ikimina_members")
    .select("ikimina_id")
    .in("ikimina_id", groupIds)
    .eq("status", "ACTIVE");

  if (memberError) {
    console.error("Error fetching member counts:", memberError);
    // Continue without member counts rather than failing
  }

  // Count members per group
  const memberCountMap = new Map<string, number>();
  if (memberCounts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const member of memberCounts as any[]) {
      const count = memberCountMap.get(member.ikimina_id) || 0;
      memberCountMap.set(member.ikimina_id, count + 1);
    }
  }

  // Map the results to Group interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups: Group[] = groupsData.map((group: any) => ({
    id: group.id,
    name: group.name,
    code: group.code,
    type: group.type,
    status: group.status,
    sacco_id: group.sacco_id,
    sacco_name: (group.saccos as { name: string } | null)?.name || null,
    total_members: memberCountMap.get(group.id) || 0,
    created_at: group.created_at,
    updated_at: group.updated_at,
  }));

  return groups;
}

/**
 * Get a single group by ID (Server-side)
 * 
 * @param id - Group UUID
 * @returns Group data or null if not found
 */
export async function getGroupById(id: string): Promise<Group | null> {
  const groups = await getGroups({ limit: 1 });
  const group = groups.find((g) => g.id === id);
  return group || null;
}
