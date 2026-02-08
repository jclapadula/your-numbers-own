import { useState } from "react";
import { Modal } from "../Common/Modal";
import { authApi } from "~/api/authApi";
import { useAuth } from "./AuthContext";

type DisableMfaModalProps = {
  onClose: () => void;
};

export const DisableMfaModal = ({ onClose }: DisableMfaModalProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleDisable = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authApi.disableMfa(password);

      if (user) {
        user.mfaEnabled = false;
      }

      onClose();
    } catch (error: any) {
      setError(error.message || "Failed to disable MFA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Disable Two-Factor Authentication"
      onClose={onClose}
      onSave={handleDisable}
      saveButtonText="Disable MFA"
      saveButtonClass="btn-error"
      disabled={isLoading}
      onSaveDisabled={!password}
    >
      <div className="text-sm text-base-content/70 mb-4">
        Are you sure you want to disable two-factor authentication? This will
        make your account less secure.
      </div>

      <div className="alert alert-warning mb-4">
        <span>Enter your password to confirm this action.</span>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="password" className="label">
          <span className="label-text">Password</span>
        </label>
        <input
          id="password"
          type="password"
          className="input input-bordered w-full"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
      </div>
    </Modal>
  );
};
