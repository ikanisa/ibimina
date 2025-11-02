import { apiFetch } from "../../../services/api/client";
import { startWhatsAppAuth, verifyWhatsAppAuth } from "../api";

jest.mock("../../../services/api/client", () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe("WhatsApp authentication API helpers", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("posts a trimmed phone number to the start endpoint", async () => {
    mockedApiFetch.mockResolvedValue({ attemptId: "abc", expiresIn: 120, resendIn: 60 });

    const response = await startWhatsAppAuth("  250788123456  ");

    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/whatsapp/start", {
      method: "POST",
      body: JSON.stringify({ whatsappNumber: "250788123456" }),
      includeAuth: false,
    });
    expect(response).toEqual({ attemptId: "abc", expiresIn: 120, resendIn: 60 });
  });

  it("includes the trimmed code and attempt identifier when verifying", async () => {
    mockedApiFetch.mockResolvedValue({ token: "jwt", expiresIn: 3600 });

    const response = await verifyWhatsAppAuth("250788123456", " 012345 ", "attempt-1");

    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/whatsapp/verify", {
      method: "POST",
      body: JSON.stringify({
        whatsappNumber: "250788123456",
        code: "012345",
        attemptId: "attempt-1",
      }),
      includeAuth: false,
    });
    expect(response).toEqual({ token: "jwt", expiresIn: 3600 });
  });

  it("omits attempt identifiers when none are provided", async () => {
    mockedApiFetch.mockResolvedValue({ token: "jwt" });

    await verifyWhatsAppAuth("250788123456", "654321");

    expect(mockedApiFetch).toHaveBeenLastCalledWith("/auth/whatsapp/verify", {
      method: "POST",
      body: JSON.stringify({
        whatsappNumber: "250788123456",
        code: "654321",
        attemptId: undefined,
      }),
      includeAuth: false,
    });
  });
});
