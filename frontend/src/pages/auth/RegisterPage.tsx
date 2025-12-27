import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const registerSchema = z
  .object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    organization_name: z.string().min(2, 'Organization name is required'),
    organization_type: z.enum(['HOTEL', 'AGENCY']),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organization_type: 'HOTEL',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        organization_name: data.organization_name,
        organization_type: data.organization_type,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error(error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">TravelSync</h1>
          <p className="mt-2 text-gray-600">Hotel Automation Platform</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Start your 14-day free trial</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  error={errors.first_name?.message}
                  {...register('first_name')}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.last_name?.message}
                  {...register('last_name')}
                />
              </div>

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Organization Name"
                placeholder="Hotel Sunrise"
                error={errors.organization_name?.message}
                {...register('organization_name')}
              />

              <Select
                label="Organization Type"
                options={[
                  { value: 'HOTEL', label: 'Hotel / Property' },
                  { value: 'AGENCY', label: 'Travel Agency' },
                ]}
                error={errors.organization_type?.message}
                {...register('organization_type')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                error={errors.password?.message}
                {...register('password')}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
