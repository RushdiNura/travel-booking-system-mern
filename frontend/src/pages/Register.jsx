import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import { Input, Label, FieldError } from '../components/ui/FormElements.jsx';
import Button from '../components/ui/Button.jsx';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser(values);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted dark:text-indigo-300">Save trips, track bookings, and check out faster.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          {serverError && (
            <div role="alert" className="rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              {serverError}
            </div>
          )}
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" error={errors.name} {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" error={errors.email} {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" error={errors.password} {...register('password')} />
            <FieldError message={errors.password?.message} />
          </div>
          <Button type="submit" variant="accent" loading={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted dark:text-indigo-300">
          Already have an account? <Link to="/login" className="font-medium text-indigo-900 dark:text-ivory hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
