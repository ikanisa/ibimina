import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { updateContactChannels, updatePreferredLocale } from "@ibimina/data-access";
import { useSupabase } from "../../../providers/supabase-client";
import { storeHashedIdentifier } from "../../../storage/secure";

export type OnboardingState = "language" | "contacts" | "kyc" | "complete";

export const useOnboarding = () => {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<OnboardingState>("language");
  const [kycImage, setKycImage] = useState<string | null>(null);

  const languageMutation = useMutation({
    mutationFn: (locale: string) => updatePreferredLocale(client, locale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setStep("contacts");
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (payload: { whatsapp: string; momo: string }) => {
      await storeHashedIdentifier("whatsapp", payload.whatsapp);
      await storeHashedIdentifier("momo", payload.momo);
      return updateContactChannels(client, {
        whatsapp: payload.whatsapp,
        momoNumber: payload.momo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setStep("kyc");
    },
  });

  const pickKycMutation = useMutation({
    mutationFn: async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Permission denied");
      }

      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: true });
      if (result.canceled || !result.assets?.length) {
        throw new Error("cancelled");
      }

      const asset = result.assets[0];
      setKycImage(asset.uri);
      if (asset.base64) {
        await storeHashedIdentifier("kyc", asset.base64);
      }
      return asset.uri;
    },
    onSuccess: () => {
      setStep("complete");
    },
  });

  return {
    step,
    setStep,
    languageMutation,
    contactMutation,
    pickKycMutation,
    kycImage,
  };
};
