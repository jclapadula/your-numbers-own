import { Modal } from "../Common/Modal";

interface SelectAccountModalProps {
  onClose: () => void;
}

export const SelectAccountModal = ({ onClose }: SelectAccountModalProps) => {
  return (
    <Modal onClose={onClose} title="Select Account">
      <div className="space-y-4">
        <p className="text-sm text-base-content/70">
          Select an account to link
        </p>
      </div>
    </Modal>
  );
};