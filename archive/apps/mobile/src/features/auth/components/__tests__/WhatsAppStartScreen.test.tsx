import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import { startWhatsAppAuth } from "../../api";
import { WhatsAppStartScreen } from "../WhatsAppStartScreen";

jest.mock("../../api");

const mockedStart = startWhatsAppAuth as jest.MockedFunction<typeof startWhatsAppAuth>;

describe("WhatsAppStartScreen", () => {
  beforeEach(() => {
    mockedStart.mockReset();
  });

  it("calls the start endpoint and notifies the caller", async () => {
    mockedStart.mockResolvedValue({ attemptId: "abc", expiresIn: 300, resendIn: 60 });
    const onCodeSent = jest.fn();

    const { getByLabelText, getByRole } = render(<WhatsAppStartScreen onCodeSent={onCodeSent} />);

    fireEvent.changeText(getByLabelText(/WhatsApp number/i), "250788123456");

    await act(async () => {
      fireEvent.press(getByRole("button"));
    });

    await waitFor(() => expect(mockedStart).toHaveBeenCalledWith("250788123456"));
    await waitFor(() =>
      expect(onCodeSent).toHaveBeenCalledWith({
        whatsappNumber: "250788123456",
        attemptId: "abc",
        expiresIn: 300,
        resendIn: 60,
      })
    );
  });

  it("shows an error when the request fails", async () => {
    mockedStart.mockRejectedValue(new Error("Network error"));
    const { getByLabelText, getByRole, findByText } = render(
      <WhatsAppStartScreen onCodeSent={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText(/WhatsApp number/i), "250788123456");

    await act(async () => {
      fireEvent.press(getByRole("button"));
    });

    await waitFor(() => expect(mockedStart).toHaveBeenCalledWith("250788123456"));
    expect(await findByText(/network error/i)).toBeTruthy();
  });
});
