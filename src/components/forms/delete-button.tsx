"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function ConfirmSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction type="submit" disabled={pending}>
      {pending ? "Deleting…" : label}
    </AlertDialogAction>
  );
}

type DeleteButtonProps = {
  action: (formData: FormData) => Promise<void>;
  /** Hidden inputs the action needs, e.g. `{ id, pet_id }`. */
  payload: Record<string, string>;
  title: string;
  description: string;
  confirmLabel?: string;
  triggerLabel?: string;
  /** Full-width labelled button instead of the compact icon trigger. */
  variant?: "icon" | "button";
};

/**
 * Destructive action behind a confirmation dialog. Deletes here cascade
 * (a pet takes its whole record set with it), so it's never one stray click.
 */
export function DeleteButton({
  action,
  payload,
  title,
  description,
  confirmLabel = "Delete",
  triggerLabel = "Delete",
  variant = "icon",
}: DeleteButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
            aria-label={triggerLabel}
            title={triggerLabel}
          >
            <Trash2 />
          </Button>
        ) : (
          <Button variant="outline" className="text-danger hover:bg-danger/10">
            <Trash2 />
            {triggerLabel}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action}>
          {Object.entries(payload).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <ConfirmSubmit label={confirmLabel} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
