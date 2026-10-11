import { forwardRef } from 'react';
import clsx from 'clsx';

export const Label = ({ children, htmlFor, className }) => (
  <label htmlFor={htmlFor} className={clsx('label', className)}>
    {children}
  </label>
);

export const Input = forwardRef(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx('input', error && 'border-error focus:border-error focus:ring-error', className)}
    aria-invalid={error ? 'true' : undefined}
    {...props}
  />
));
Input.displayName = 'Input';

export const Select = forwardRef(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={clsx('input pr-8 appearance-none bg-no-repeat', error && 'border-error', className)}
    aria-invalid={error ? 'true' : undefined}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-error" role="alert">
      {message}
    </p>
  );
};
