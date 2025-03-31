type ModalProps = {
  children: React.ReactNode;
  title: string;
  hidden?: boolean;
  onClose: () => void;
  onSave: () => void;
  disabled?: boolean;
};

export const Modal = ({
  children,
  hidden: hidden,
  onClose,
  title,
  onSave,
  disabled,
}: ModalProps) => {
  return (
    <dialog className="modal top-0 left-0" open={!hidden}>
      <div className="modal-box">
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
            <button
              onClick={onSave}
              className="btn btn-primary"
              disabled={disabled}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close modal</button>
      </form>
    </dialog>
  );
};
