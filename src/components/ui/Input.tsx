import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-900 dark:text-zinc-100 ${
            error
              ? "border-red-400"
              : "border-zinc-300 dark:border-zinc-700"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-red-500">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
