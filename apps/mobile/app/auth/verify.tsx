import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { WhatsAppVerifyScreen } from "../../src/features/auth/components/WhatsAppVerifyScreen";

export default function AuthVerifyRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    whatsappNumber?: string;
    attemptId?: string;
    resendIn?: string;
  }>();

  const whatsappNumber = params.whatsappNumber?.toString();
  const attemptId = params.attemptId?.toString();
  const resendIn = params.resendIn ? Number(params.resendIn) : undefined;

  if (!whatsappNumber || !attemptId) {
    return <Redirect href="/auth/start" />;
  }

  return (
    <WhatsAppVerifyScreen
      whatsappNumber={whatsappNumber}
      attemptId={attemptId}
      initialResendIn={Number.isFinite(resendIn) ? resendIn : undefined}
      onVerified={() => router.replace("/(tabs)/home")}
    />
  );
}
