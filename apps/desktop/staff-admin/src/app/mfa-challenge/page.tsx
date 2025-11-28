/**
 * MFA Challenge page for desktop app
 */

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader2, Shield, ArrowLeft } from "lucide-react";

export function MFAChallengePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, profile, signOut, navigateTo } = useAuth();

  useEffect(() => {
    // Redirect if not logged in or MFA not required
    if (!user || !profile?.mfa_enabled) {
      navigateTo("/login");
    }
  }, [user, profile, navigateTo]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call MFA verification endpoint
      const { data, error: mfaError } = await supabase.functions.invoke("verify-mfa-code", {
        body: { code },
      });

      if (mfaError) throw mfaError;

      if (data?.verified) {
        // MFA verified, redirect to dashboard
        navigateTo("/dashboard");
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* MFA Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                disabled={loading}
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Can&apos;t access your authenticator app?</p>
            <p className="mt-1">Contact your system administrator for help.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
