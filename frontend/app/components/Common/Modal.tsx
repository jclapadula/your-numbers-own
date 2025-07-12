import { useEffect, useRef } from "react";

type ModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  onSave?: () => void;
  disabled?: boolean;
};

export const Modal = ({
  onClose,
  children,
  title,
  onSave,
  disabled,
}: ModalProps) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    modalRef.current?.showModal();
  }, []);

  return (
    <dialog className="modal inset-0 absolute" ref={modalRef} onClose={onClose}>
      <div className="modal-box overflow-visible">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          {children}
          <div className="flex justify-end gap-2 mt-5">
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
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close modal</button>
      </form>
    </dialog>
  );
};
