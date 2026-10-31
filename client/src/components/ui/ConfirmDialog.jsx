import React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./Dialog";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={isLoading ? () => {} : onOpenChange}>
      <div className="relative">
        <DialogClose onClick={() => onOpenChange(false)} />
        <div className="flex items-start gap-4">
          {variant === "destructive" && (
            <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <div>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

