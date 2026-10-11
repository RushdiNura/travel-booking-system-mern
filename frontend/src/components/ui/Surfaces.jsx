import clsx from 'clsx';
import { Inbox, AlertTriangle } from 'lucide-react';

export const Card = ({ className, children, ...props }) => (
  <div className={clsx('card', className)} {...props}>
    {children}
  </div>
);

const BADGE_VARIANT = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

export const Badge = ({ variant = 'neutral', children, className }) => (
  <span className={clsx(BADGE_VARIANT[variant], className)}>{children}</span>
);

export const Skeleton = ({ className }) => (
  <div className={clsx('animate-pulse rounded bg-indigo-100/70 dark:bg-indigo-800/70', className)} aria-hidden="true" />
);

export const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border dark:border-indigo-800 py-16 text-center">
    <Icon className="h-9 w-9 text-muted dark:text-indigo-300" aria-hidden="true" />
    <h3 className="mt-4 font-display text-lg text-indigo-900 dark:text-ivory">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm text-muted dark:text-indigo-300">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', description, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-error/20 bg-error/5 py-16 text-center">
    <AlertTriangle className="h-9 w-9 text-error" aria-hidden="true" />
    <h3 className="mt-4 font-display text-lg text-indigo-900 dark:text-ivory">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm text-muted dark:text-indigo-300">{description}</p>}
    {onRetry && (
      <button onClick={onRetry} className="btn-outline mt-5">
        Try again
      </button>
    )}
  </div>
);
