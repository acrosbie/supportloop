"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !border !border-border !text-foreground !rounded-xl !shadow-lg !font-sans",
          description: "!text-muted",
          actionButton: "!bg-accent !text-accent-fg",
          cancelButton: "!bg-surface-2 !text-muted",
        },
      }}
    />
  );
}
