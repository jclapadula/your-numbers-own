import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router";

export const MfaLoginForm = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { verifyMfa, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    try {
      await verifyMfa(code);
      navigate("/");
    } catch (error) {
      setError("Invalid verification code");
      setCode("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-base-content">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-base-content/70">
            Enter the verification code from your authenticator app
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="code" className="label">
              <span className="label-text">Verification Code</span>
            </label>
            <input
              id="code"
              type="text"
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              required
              className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setCode(value);
              }}
              autoFocus
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
