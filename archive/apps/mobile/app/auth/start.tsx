import { useRouter } from "expo-router";
import { WhatsAppStartScreen } from "../../src/features/auth/components/WhatsAppStartScreen";

export default function AuthStartRoute() {
  const router = useRouter();
  return (
    <WhatsAppStartScreen
      onCodeSent={({ whatsappNumber, attemptId, resendIn }) =>
        router.push({
          pathname: "/auth/verify",
          params: {
            whatsappNumber,
            attemptId,
            resendIn: resendIn?.toString(),
          },
        })
      }
    />
  );
}
