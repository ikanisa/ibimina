import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import { startWhatsAppAuth, verifyWhatsAppAuth } from "../../api";
import { WhatsAppVerifyScreen } from "../WhatsAppVerifyScreen";

jest.mock("../../api");
jest.mock("../../../../storage/authToken", () => ({
  saveAuthToken: jest.fn().mockResolvedValue(undefined),
}));

const mockedVerify = verifyWhatsAppAuth as jest.MockedFunction<typeof verifyWhatsAppAuth>;
const mockedStart = startWhatsAppAuth as jest.MockedFunction<typeof startWhatsAppAuth>;

beforeEach(() => {
  jest.useFakeTimers();
  mockedVerify.mockReset();
  mockedStart.mockReset();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("WhatsAppVerifyScreen", () => {
  it("verifies the code and notifies the caller", async () => {
    mockedVerify.mockResolvedValue({ token: "jwt-token", expiresIn: 3600 });
    const onVerified = jest.fn();

    const { getByLabelText, getByText } = render(
      <WhatsAppVerifyScreen
        whatsappNumber="250788123456"
        attemptId="attempt"
        initialResendIn={0}
        onVerified={onVerified}
      />
    );

    fireEvent.changeText(getByLabelText(/verification code/i), "123456");

    await act(async () => {
      fireEvent.press(getByText(/verify and continue/i));
    });

    await waitFor(() =>
      expect(mockedVerify).toHaveBeenCalledWith("250788123456", "123456", "attempt")
    );
    await waitFor(() => expect(onVerified).toHaveBeenCalled());
  });

  it("allows the user to resend after the countdown", async () => {
    mockedStart.mockResolvedValue({ attemptId: "next", expiresIn: 300, resendIn: 60 });

    const { getByText, queryByText } = render(
      <WhatsAppVerifyScreen whatsappNumber="250788123456" attemptId="attempt" initialResendIn={5} />
    );

    expect(getByText(/Resend available in 0:05/i)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => expect(queryByText(/Resend code/i)).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText(/Resend code/i));
    });

    await waitFor(() => expect(mockedStart).toHaveBeenCalledWith("250788123456"));
    await waitFor(() => expect(getByText(/Resend available in 1:00/i)).toBeTruthy());
  });

  it("shows an error when verification fails", async () => {
    mockedVerify.mockRejectedValue(new Error("Invalid code"));

    const { getByLabelText, getByText, findByText } = render(
      <WhatsAppVerifyScreen whatsappNumber="250788123456" attemptId="attempt" />
    );

    fireEvent.changeText(getByLabelText(/verification code/i), "123456");

    await act(async () => {
      fireEvent.press(getByText(/verify and continue/i));
    });

    expect(await findByText(/invalid code/i)).toBeTruthy();
  });
});
