import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl text-indigo-900 dark:text-ivory">404</p>
      <div className="horizon-rule mt-4" />
      <h1 className="mt-4 font-display text-xl text-indigo-900 dark:text-ivory">This page has wandered off</h1>
      <p className="mt-2 max-w-sm text-sm text-muted dark:text-indigo-300">
        The page you're looking for doesn't exist, or may have moved.
      </p>
      <Link to="/" className="btn-accent mt-6">Back to home</Link>
    </div>
  );
}
