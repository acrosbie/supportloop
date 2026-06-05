"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  side = "left",
  title = "Menu",
  className,
  children,
}: {
  side?: "left" | "right";
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 animate-overlay-in" />
      <Dialog.Content
        className={cn(
          "fixed bottom-0 top-0 z-50 flex w-72 flex-col bg-surface outline-none",
          side === "left" ? "left-0 border-r border-border animate-sheet-in-left" : "right-0 border-l border-border animate-sheet-in-right",
          className
        )}
      >
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
