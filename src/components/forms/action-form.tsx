"use client";

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

import { AnimatedFormMessage } from "@/components/motion/error-message";
import { SuccessCheck } from "@/components/motion/success-check";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/shared";
import { cn } from "@/lib/utils";

/**
 * Lets an input mark the form busy while it does async work of its own.
 *
 * File compression is the only user today: submitting while it is still
 * running would send the untouched original, so the submit button waits.
 */
const BusyContext = createContext<((delta: number) => void) | null>(null);

/**
 * Runs `work` with the surrounding form held busy. Outside an `ActionForm`
 * there is nothing to hold, so the work just runs.
 */
export function useFormBusy() {
  const bump = useContext(BusyContext);

  return useCallback(
    async <T,>(work: () => Promise<T>): Promise<T> => {
      bump?.(1);
      try {
        return await work();
      } finally {
        bump?.(-1);
      }
    },
    [bump],
  );
}

function SubmitButton({
  label,
  pendingLabel,
  variant,
  className,
  busy,
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "accent" | "fresh" | "outline" | "danger";
  className?: string;
  busy?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending || busy} className={className}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  submitVariant?: "default" | "accent" | "fresh" | "outline" | "danger";
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
  const [busyCount, setBusyCount] = useState(0);
  const bump = useCallback((delta: number) => setBusyCount((count) => count + delta), []);

  useEffect(() => {
    if (resetOnSuccess && state.success) formRef.current?.reset();
  }, [resetOnSuccess, state.success]);

  return (
    <form ref={formRef} action={formAction} className={cn("space-y-4", className)}>
      {state.error ? (
        <AnimatedFormMessage trigger={state}>
          <Alert variant="danger">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </AnimatedFormMessage>
      ) : null}

      {state.success ? (
        <AnimatedFormMessage trigger={state} variant="success">
          <Alert variant="success">
            <SuccessCheck className="mt-0.5 shrink-0" />
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        </AnimatedFormMessage>
      ) : null}

      <BusyContext.Provider value={bump}>{children}</BusyContext.Provider>

      <div className={cn("flex items-center gap-3", footerClassName)}>
        <SubmitButton
          label={submitLabel}
          pendingLabel={pendingLabel}
          variant={submitVariant}
          busy={busyCount > 0}
        />
        {footer}
      </div>
    </form>
  );
}
