import { useEffect } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

/**
 * Automatically clear server-side field errors when user edits the same field.
 * Only clears errors with type="server" so client-side validation remains intact.
 */
export const useClearServerFieldErrors = <TFieldValues extends FieldValues>(
  form: Pick<
    UseFormReturn<TFieldValues>,
    "watch" | "clearErrors" | "getFieldState"
  >,
) => {
  useEffect(() => {
    const subscription = form.watch((_value, { name, type }) => {
      if (!name || type !== "change") return;

      const fieldName = name as Path<TFieldValues>;
      const fieldState = form.getFieldState(fieldName);

      if (fieldState.error?.type === "server") {
        form.clearErrors(fieldName);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);
};
