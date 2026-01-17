import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { UserPlus, Building2, Briefcase } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters'),
  organization_type: z.enum(['HOTEL', 'AGENCY'], { required_error: 'Please select organization type' }),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organization_type: 'HOTEL',
    },
  });

  const selectedType = watch('organization_type');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    const result = await registerUser(registerData);
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">Start managing your business with TravelSync</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Organization Type Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">I am a</h3>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${selectedType === 'HOTEL'
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    value="HOTEL"
                    {...register('organization_type')}
                    className="sr-only"
                  />
                  <Building2 className={`w-10 h-10 mb-3 ${selectedType === 'HOTEL' ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${selectedType === 'HOTEL' ? 'text-primary-700' : 'text-gray-700'}`}>
                    Hotel
                  </span>
                  <span className="text-sm text-gray-500 text-center mt-1">
                    I own or manage a hotel
                  </span>
                </label>

                <label
                  className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${selectedType === 'AGENCY'
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    value="AGENCY"
                    {...register('organization_type')}
                    className="sr-only"
                  />
                  <Briefcase className={`w-10 h-10 mb-3 ${selectedType === 'AGENCY' ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${selectedType === 'AGENCY' ? 'text-primary-700' : 'text-gray-700'}`}>
                    Travel Agency
                  </span>
                  <span className="text-sm text-gray-500 text-center mt-1">
                    I run a travel agency
                  </span>
                </label>
              </div>
              {errors.organization_type && (
                <p className="mt-2 text-sm text-red-600">{errors.organization_type.message}</p>
              )}
            </div>

            {/* Organization Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedType === 'HOTEL' ? 'Hotel' : 'Agency'} Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label={selectedType === 'HOTEL' ? 'Hotel Name' : 'Agency Name'}
                  placeholder={selectedType === 'HOTEL' ? 'Grand Hotel' : 'Best Travel Agency'}
                  error={errors.organization_name?.message}
                  {...register('organization_name')}
                />
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  autoComplete="given-name"
                  error={errors.first_name?.message}
                  {...register('first_name')}
                />

                <Input
                  label="Last Name"
                  placeholder="Doe"
                  autoComplete="family-name"
                  error={errors.last_name?.message}
                  {...register('last_name')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@hotel.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 234 567 890"
                  autoComplete="tel"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  helperText="Minimum 8 characters"
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          &copy; {new Date().getFullYear()} TravelSync. All rights reserved.
        </p>
      </div>
    </div>
  );
}
