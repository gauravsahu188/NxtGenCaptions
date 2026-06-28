"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (
    type: Toast["type"],
    message: string,
    options?: { duration?: number; action?: ToastAction }
  ) => void;
  success: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
  error: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
  warning: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
  info: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: Toast["type"],
      message: string,
      options?: { duration?: number; action?: ToastAction }
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options?.duration ?? 5000;
      const action = options?.action;
      
      setToasts((prev) => [...prev, { id, type, message, duration, action }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback((message: string, options?: { duration?: number; action?: ToastAction }) => {
    showToast("success", message, options);
  }, [showToast]);

  const error = useCallback((message: string, options?: { duration?: number; action?: ToastAction }) => {
    showToast("error", message, options);
  }, [showToast]);

  const warning = useCallback((message: string, options?: { duration?: number; action?: ToastAction }) => {
    showToast("warning", message, options);
  }, [showToast]);

  const info = useCallback((message: string, options?: { duration?: number; action?: ToastAction }) => {
    showToast("info", message, options);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = {
              success: CheckCircle,
              error: XCircle,
              warning: AlertTriangle,
              info: Info,
            }[toast.type];

            const colors = {
              success: "border-emerald-500/20 bg-emerald-950/85 text-emerald-200",
              error: "border-red-500/20 bg-red-950/85 text-red-200",
              warning: "border-amber-500/20 bg-amber-950/85 text-amber-200",
              info: "border-blue-500/20 bg-blue-950/85 text-blue-200",
            }[toast.type];

            const iconColors = {
              success: "text-emerald-400",
              error: "text-red-400",
              warning: "text-amber-400",
              info: "text-blue-400",
            }[toast.type];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                layout
                className={`pointer-events-auto relative flex flex-col overflow-hidden rounded-xl border backdrop-blur-xl p-4 shadow-2xl transition-all duration-300 ${colors}`}
              >
                <div className="flex gap-3 items-start">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors}`} />
                  <div className="flex-1 text-sm font-medium pr-4 leading-snug">
                    {toast.message}
                    {toast.action && (
                      <div className="mt-3 flex">
                        <button
                          onClick={() => {
                            toast.action?.onClick();
                            dismissToast(toast.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition duration-200 cursor-pointer"
                        >
                          {toast.action.label}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Auto-dismiss progress bar */}
                {toast.duration && toast.duration > 0 && (
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: toast.duration / 1000, ease: "linear" }}
                    className={`absolute bottom-0 left-0 h-1 ${
                      {
                        success: "bg-emerald-500",
                        error: "bg-red-500",
                        warning: "bg-amber-500",
                        info: "bg-blue-500",
                      }[toast.type]
                    }`}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
