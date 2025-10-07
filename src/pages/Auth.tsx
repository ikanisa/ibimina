import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Building2, ShieldAlert, ShieldCheck } from "lucide-react";

interface MfaChallengeState {
  factorId: string;
  challengeId: string;
}

type Step = "password" | "mfa";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("password");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState | null>(null);

  useEffect(() => {
    // Bootstrap admin user on component mount
    const bootstrapAdmin = async () => {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bootstrap-admin`,
          { method: "POST" }
        );
      } catch (error) {
        console.error("Bootstrap error:", error);
      }
    };
    bootstrapAdmin();
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMfaChallenge(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        // No active session means password was accepted but a second factor might be required
        const needsMfa = await prepareMfaChallenge();
        if (!needsMfa) {
          toast.success("Signed in successfully");
          navigate("/");
        }
        return;
      }

      const needsMfa = await prepareMfaChallenge();
      if (!needsMfa) {
        toast.success("Signed in successfully");
        navigate("/");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const prepareMfaChallenge = async () => {
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        return false;
      }

      const totpFactor = factorsData?.totp?.[0];
      if (!totpFactor) {
        return false;
      }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === "aal2") {
        // Already at the highest level in this session
        return false;
      }

      const { data: challengeData, error } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (error || !challengeData) {
        throw error || new Error("Unable to start authenticator challenge");
      }

      setMfaChallenge({ factorId: totpFactor.id, challengeId: challengeData.id });
      setMfaCode("");
      setStep("mfa");
      toast("Enter your 6-digit authenticator code to finish signing in");
      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Unable to verify second factor");
      return false;
    }
  };

  const handleVerifyMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaChallenge) return;

    if (!mfaCode || mfaCode.length < 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }

    try {
      setMfaVerifying(true);
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaChallenge.factorId,
        challengeId: mfaChallenge.challengeId,
        code: mfaCode,
      });

      if (error) {
        throw error;
      }

      toast.success("Signed in securely");
      setStep("password");
      setMfaChallenge(null);
      setMfaCode("");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Invalid authenticator code");
    } finally {
      setMfaVerifying(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="absolute inset-0 bg-nyungwe opacity-20 animate-pulse-glow" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-kigali" />

      <Card className="relative z-10 w-full max-w-md glass-dark border-2 animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-kigali">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Umurenge SACCO</CardTitle>
          <CardDescription className="text-base">
            Staff login - Contact system administrator for access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "password" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@sacco.rw"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Checking credentials..." : "Sign in"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Accounts are provisioned by system administrators. Contact your SACCO lead if you need access.
              </p>
            </form>
          )}

          {step === "mfa" && (
            <form onSubmit={handleVerifyMfa} className="space-y-4">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rw-blue/10">
                  <ShieldCheck className="h-6 w-6 text-rw-blue" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <CardTitle className="text-xl font-semibold">Authenticator required</CardTitle>
                <CardDescription>
                  Enter the 6-digit code generated by your authenticator app to finish signing in.
                </CardDescription>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Authentication code</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]*"
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={mfaVerifying}>
                  {mfaVerifying ? "Verifying..." : "Verify code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    supabase.auth.signOut();
                    setStep("password");
                    setMfaChallenge(null);
                    setMfaCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-muted-foreground">
                <ShieldAlert className="h-4 w-4 text-yellow-600" />
                <p>
                  Having trouble? Request your administrator to reset two-factor authentication or use your stored recovery secret.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
