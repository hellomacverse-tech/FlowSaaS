import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const fieldClasses =
  "w-full rounded-xl border border-line/70 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean | undefined;
  children: React.ReactNode;
}

function FieldWrapper({ label, htmlFor, error, hint, required, children }: FieldWrapperProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? <span aria-hidden="true" className="text-coral-600"> *</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined; hint?: string | undefined }
>(({ label, error, hint, id, required, className, ...props }, ref) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldClasses, error && "border-danger", className)}
        {...props}
      />
    </FieldWrapper>
  );
});
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string | undefined; hint?: string | undefined }
>(({ label, error, hint, id, required, className, ...props }, ref) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        rows={5}
        className={cn(fieldClasses, "resize-y", error && "border-danger", className)}
        {...props}
      />
    </FieldWrapper>
  );
});
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string | undefined;
    options: { value: string; label: string }[];
    placeholder?: string | undefined;
  }
>(({ label, error, options, placeholder, id, required, className, ...props }, ref) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} required={required}>
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        defaultValue=""
        className={cn(fieldClasses, error && "border-danger", className)}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});
Select.displayName = "Select";

export const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined }
>(({ label, error, id, className, ...props }, ref) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="flex items-start gap-2.5 text-sm text-ink-2">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 rounded border-line/70 text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
            className,
          )}
          {...props}
        />
        {label}
      </label>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
Checkbox.displayName = "Checkbox";
