"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-xl card-surface rounded-3xl p-6",
          className
        )}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}
