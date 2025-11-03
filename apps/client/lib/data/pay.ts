import { loadHomeDashboard } from "./home";
import { buildUssdPayload } from "@ibimina/lib";

export interface PayInstruction {
  id: string;
  groupId: string;
  groupName: string;
  saccoName: string | null;
  merchantCode: string;
  referenceToken: string;
  amount: number;
  currency: string;
  ussdCode: string;
}

export async function loadPaySheet() {
  const dashboard = await loadHomeDashboard();
  const locale = dashboard.member?.locale ?? "en-RW";

  const instructions: PayInstruction[] = dashboard.groups
    .filter((group) => Boolean(group.merchantCode) && Boolean(group.referenceToken))
    .map((group) => {
      const amount = group.contribution.amount ?? 0;
      const currency = group.contribution.currency ?? "RWF";
      const payload = buildUssdPayload({
        merchantCode: group.merchantCode as string,
        amount: amount > 0 ? amount : undefined,
        reference: group.referenceToken,
        locale,
        platform: "web",
      });

      return {
        id: `${group.groupId}-${group.referenceToken}`,
        groupId: group.groupId,
        groupName: group.groupName,
        saccoName: group.saccoName,
        merchantCode: group.merchantCode as string,
        referenceToken: group.referenceToken,
        amount,
        currency,
        ussdCode: payload.code,
      } satisfies PayInstruction;
    });

  return {
    member: dashboard.member,
    instructions,
  };
}
