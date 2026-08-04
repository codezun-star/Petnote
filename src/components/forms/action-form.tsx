"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/shared";
import { cn } from "@/lib/utils";

function SubmitButton({
  label,
  pendingLabel,
  variant,
  className,
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "accent" | "fresh" | "outline";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  submitVariant?: "default" | "accent" | "fresh" | "outline";
  /** Clears the inputs after a successful submit — right for "add" forms. */
  resetOnSuccess?: boolean;
  /** Extra controls rendered next to the submit button (e.g. a Cancel link). */
  footer?: ReactNode;
  className?: string;
  footerClassName?: string;
};

/**
 * Wraps a Server Action in the standard Petnote form chrome: inline error and
 * success alerts plus a pending-aware submit button.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  submitVariant = "default",
  resetOnSuccess = false,
  footer,
  className,
  footerClassName,
}: ActionFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.success) formRef.current?.reset();
  }, [resetOnSuccess, state.success]);

  return (
    <form ref={formRef} action={formAction} className={cn("space-y-4", className)}>
      {state.error ? (
        <Alert variant="danger">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert variant="success">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}

      {children}

      <div className={cn("flex items-center gap-3", footerClassName)}>
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} variant={submitVariant} />
        {footer}
      </div>
    </form>
  );
}
