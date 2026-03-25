"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "left" | "right" | "top" | "bottom";
}) {
  const sideClasses = {
    left: "inset-y-0 left-0 w-72 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
    right: "inset-y-0 right-0 w-72 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
    top: "inset-x-0 top-0 data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
    bottom: "inset-x-0 bottom-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col bg-sidebar shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out duration-200",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100">
          <X className="size-4 text-sidebar-foreground" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 p-6 pb-4", className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetHeader, SheetPortal, SheetTrigger };
