import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import QRCode from "react-qr-code";
import { BadgeCheck, KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface TotpSetupState {
  factorId: string;
  challengeId: string;
  qrCode: string;
  secret: string;
}

type TotpFactor = {
  id: string;
  factor_type: string;
  friendly_name?: string | null;
  status: string;
};

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [totpFactor, setTotpFactor] = useState<TotpFactor | null>(null);
  const [totpSetup, setTotpSetup] = useState<TotpSetupState | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifyingTotp, setVerifyingTotp] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        navigate("/auth");
        return;
      }

      setUserEmail(auth.user.email || "");
      await refreshFactors();
      setLoading(false);
    };

    init();
  }, [navigate]);

  const refreshFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error(error);
      toast.error("Unable to load multi-factor settings");
      return;
    }

    setTotpFactor((data?.totp?.[0] as TotpFactor | undefined) ?? null);
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please provide a new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Unable to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const beginTotpEnrollment = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
        issuer: "Umurenge SACCO",
      });

      if (error || !data) {
        throw error || new Error("Failed to start enrolment");
      }

      // Challenge to obtain a challenge ID for verification
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      });

      if (challengeError || !challenge) {
        throw challengeError || new Error("Failed to start verification challenge");
      }

      if (!data.totp?.qr_code || !data.totp?.secret) {
        throw new Error("Authenticator details are incomplete");
      }

      setTotpSetup({
        factorId: data.id,
        challengeId: challenge.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setTotpCode("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Unable to start authenticator setup");
    }
  };

  const verifyTotp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!totpSetup) return;
    if (!totpCode || totpCode.length < 6) {
      toast.error("Enter the 6-digit code from your authenticator");
      return;
    }

    try {
      setVerifyingTotp(true);
      const { error } = await supabase.auth.mfa.verify({
        factorId: totpSetup.factorId,
        challengeId: totpSetup.challengeId,
        code: totpCode,
      });

      if (error) {
        throw error;
      }

      toast.success("Two-factor authentication enabled");
      setTotpSetup(null);
      setTotpCode("");
      await refreshFactors();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Invalid authentication code");
    } finally {
      setVerifyingTotp(false);
    }
  };

  const disableTotp = async () => {
    if (!totpFactor) return;

    try {
      setUnenrolling(true);
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (error) {
        throw error;
      }

      toast.success("Two-factor authentication disabled");
      await refreshFactors();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Unable to disable authenticator");
    } finally {
      setUnenrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="h-1 w-full bg-kigali" />
      <main className="container mx-auto max-w-3xl space-y-8 px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Account security</h1>
            <p className="text-muted-foreground">
              Manage your password and multi-factor authentication.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-rw-blue" />
              Update password
            </CardTitle>
            <CardDescription>Use a long, unique password to keep your administrator access secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={userEmail} disabled />
              </div>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={updatingPassword}>
                {updatingPassword ? "Updating password..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-rw-green" />
              Two-factor authentication (TOTP)
            </CardTitle>
            <CardDescription>
              Protect your account with a one-time code from an authenticator app such as Google Authenticator, Microsoft Authenticator, or Authy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {totpFactor ? (
              <Alert className="border-green-500/40 bg-green-500/5">
                <BadgeCheck className="h-4 w-4" />
                <AlertTitle>Enabled</AlertTitle>
                <AlertDescription>
                  Two-factor authentication is active for this account. Use your authenticator app during sign-in.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-yellow-500/40 bg-yellow-500/10">
                <Smartphone className="h-4 w-4" />
                <AlertTitle>Not enabled yet</AlertTitle>
                <AlertDescription>
                  Enable two-factor authentication to require a 6-digit code when signing in from new devices.
                </AlertDescription>
              </Alert>
            )}

            {totpSetup ? (
              <form onSubmit={verifyTotp} className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center rounded-xl border bg-background/50 p-6">
                  <QRCode value={totpSetup.qrCode} size={160} />
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Scan this QR code with your authenticator app.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Manual setup code</Label>
                    <Input value={totpSetup.secret} readOnly onFocus={(event) => event.currentTarget.select()} />
                  </div>
                  <div>
                    <Label htmlFor="totp-code">Enter 6-digit code</Label>
                    <Input
                      id="totp-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]*"
                      value={totpCode}
                      onChange={(event) => setTotpCode(event.target.value.replace(/[^0-9]/g, ""))}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={verifyingTotp}>
                      {verifyingTotp ? "Verifying..." : "Verify code"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setTotpSetup(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button onClick={beginTotpEnrollment} disabled={!!totpFactor}>
                  {totpFactor ? "Two-factor enabled" : "Enable authenticator"}
                </Button>
                {totpFactor && (
                  <Button variant="destructive" onClick={disableTotp} disabled={unenrolling}>
                    {unenrolling ? "Disabling..." : "Disable two-factor"}
                  </Button>
                )}
              </div>
            )}

            <Separator />
            <p className="text-xs text-muted-foreground">
              Lost access to your authenticator? Contact a system administrator to reset multi-factor authentication. Recovery codes are not yet supported, so store a backup of the secret in a secure password manager.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
