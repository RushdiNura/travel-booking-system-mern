import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import { Input, Label, FieldError } from '../components/ui/FormElements.jsx';
import Button from '../components/ui/Button.jsx';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values.email, values.password);
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted dark:text-indigo-300">Log in to manage your bookings and itineraries.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          {serverError && (
            <div role="alert" className="rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              {serverError}
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" error={errors.email} {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-gold hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" error={errors.password} {...register('password')} />
            <FieldError message={errors.password?.message} />
          </div>
          <Button type="submit" variant="accent" loading={isSubmitting} className="w-full">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted dark:text-indigo-300">
          New to Aerlume? <Link to="/register" className="font-medium text-indigo-900 dark:text-ivory hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
