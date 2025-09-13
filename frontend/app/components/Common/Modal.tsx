import { useEffect } from "react";

type ModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  onSave?: () => void;
  disabled?: boolean;
  onBack?: () => void;
};

export const Modal = ({
  onClose,
  children,
  title,
  onSave,
  disabled,
  onBack,
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="modal modal-open">
      <div className="modal-box overflow-visible">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          {children}
          <div className="flex justify-between gap-2 mt-5">
            <div>
              {onBack && (
                <button
                  onClick={onBack}
                  className="btn btn-ghost"
                  disabled={disabled}
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="btn btn-secondary btn-soft"
                disabled={disabled}
              >
                Close
              </button>
              {onSave && (
                <button
                  onClick={onSave}
                  className="btn btn-primary"
                  disabled={disabled}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
