import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANT_CLASS = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={clsx(VARIANT_CLASS[variant], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Component>
  );
}
