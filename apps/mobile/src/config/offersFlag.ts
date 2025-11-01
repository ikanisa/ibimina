import { getOffersFeatureDecision } from "@ibimina/config";

export async function isOffersTabEnabled(memberId: string, saccoId: string): Promise<boolean> {
  return getOffersFeatureDecision({
    subjectKey: memberId,
    saccoId,
  });
}
