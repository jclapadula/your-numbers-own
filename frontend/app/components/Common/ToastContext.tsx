import { XMarkIcon } from "@heroicons/react/24/outline";
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  setToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const setToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      duration: number = 5000_000
    ) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ setToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={twMerge(
              `px-5 text-sm py-3 flex gap-2 items-center rounded-lg shadow-lg text-white min-w-[200px] max-w-md transform transition-all duration-300`,
              toast.type === "success" && "bg-success text-success-content",
              toast.type === "error" && "bg-error text-error-content",
              toast.type === "warning" && "bg-warning text-warning-content",
              toast.type === "info" && "bg-info text-info-content"
            )}
          >
            <div>{toast.message}</div>
            <button
              className={twMerge(
                "btn btn-ghost btn-sm",
                toast.type === "error" && "btn-error",
                toast.type === "success" && "btn-success",
                toast.type === "warning" && "btn-warning",
                toast.type === "info" && "btn-info"
              )}
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
