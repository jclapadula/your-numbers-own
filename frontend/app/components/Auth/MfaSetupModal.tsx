import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "../Common/Modal";
import { authApi } from "~/api/authApi";

type MfaSetupModalProps = {
  onClose: () => void;
  onSuccess?: () => void;
};

type SetupStep = "qr" | "verify";

export const MfaSetupModal = ({ onClose, onSuccess }: MfaSetupModalProps) => {
  const [step, setStep] = useState<SetupStep>("qr");
  const [otpauthUrl, setOtpauthUrl] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initSetup = async () => {
      setIsLoading(true);
      try {
        const response = await authApi.setupMfa();
        setOtpauthUrl(response.otpauthUrl);
        setManualKey(response.manualEntryKey);
      } catch (error) {
        setError("Failed to initialize MFA setup");
      } finally {
        setIsLoading(false);
      }
    };

    initSetup();
  }, []);

  const handleNext = () => {
    setStep("verify");
    setError("");
  };

  const handleBack = () => {
    setStep("qr");
    setError("");
    setVerificationCode("");
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authApi.verifyMfaSetup(verificationCode);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      setError(error.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const renderQrStep = () => (
    <>
      <div className="text-sm text-base-content/70 mb-4">
        Scan this QR code with your authenticator app (Google Authenticator,
        Authy, etc.)
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      ) : (
        <>
          {otpauthUrl && (
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={otpauthUrl} size={256} />
            </div>
          )}

          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">Manual Entry Key:</div>
            <div className="p-3 bg-base-200 rounded font-mono text-sm break-all">
              {manualKey}
            </div>
            <div className="text-xs text-base-content/60 mt-1">
              Use this key if you can't scan the QR code
            </div>
          </div>
        </>
      )}
    </>
  );

  const renderVerifyStep = () => (
    <>
      <div className="text-sm text-base-content/70 mb-4">
        Enter the 6-digit verification code from your authenticator app
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="verificationCode" className="label">
          <span className="label-text">Verification Code</span>
        </label>
        <input
          id="verificationCode"
          type="text"
          maxLength={6}
          pattern="[0-9]*"
          inputMode="numeric"
          className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
          placeholder="000000"
          value={verificationCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setVerificationCode(value);
          }}
          disabled={isLoading}
          autoFocus
        />
      </div>
    </>
  );

  return (
    <Modal
      title="Set Up Two-Factor Authentication"
      onClose={onClose}
      onSave={step === "qr" ? handleNext : handleVerify}
      onBack={step === "verify" ? handleBack : undefined}
      saveButtonText={step === "qr" ? "Next" : "Enable MFA"}
      disabled={isLoading}
      onSaveDisabled={step === "verify" && verificationCode.length !== 6}
    >
      {step === "qr" ? renderQrStep() : renderVerifyStep()}
    </Modal>
  );
};
