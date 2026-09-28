import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import { z } from 'zod';
import { unwrapApiError } from '@/api/middleware';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegister } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.email().max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['buyer', 'organizer']),
});

type RegisterForm = z.infer<typeof schema>;

const fields = ['name', 'email', 'password', 'role'] as const;

export function RegisterPage() {
  const { search } = useLocation();
  const registerUser = useRegister();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', role: 'buyer' },
  });

  const onSubmit = handleSubmit((values) =>
    registerUser.mutate(values, {
      onError: (error) => {
        const apiError = unwrapApiError(error);
        if (apiError?.code !== 'VALIDATION_FAILED') {
          return;
        }
        const details = apiError.details ?? {};
        let mapped = false;
        for (const field of fields) {
          const messages = details[field];
          if (Array.isArray(messages) && typeof messages[0] === 'string') {
            setError(field, { message: messages[0] });
            mapped = true;
          }
        }
        if (!mapped) {
          setError('root', { message: apiError.message });
        }
      },
    }),
  );

  const fieldError = (field: (typeof fields)[number]) =>
    errors[field] && (
      <p className="text-sm text-destructive">{errors[field].message}</p>
    );

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" {...register('name')} />
            {fieldError('name')}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {fieldError('email')}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {fieldError('password')}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {fieldError('role')}
          </div>
          <Button type="submit" disabled={registerUser.isPending}>
            Register
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to={`/login${search}`} className="underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
